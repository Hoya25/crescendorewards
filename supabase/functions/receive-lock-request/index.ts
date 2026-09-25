import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { pushToGodview } from "../_shared/push-to-godview.ts";

// BH → Crescendo mirror (ruling M7: BH user_profiles.nctr_locked_points is the
// ledger of record; Crescendo mirrors it).
//
// Two request shapes are accepted during the Step 1.2–1.6 transition:
//   NEW    { bh_user_id, event_id, source_updated_at, nctr_locked_points, ... }
//          Idempotent on event_id (bh_sync_events), monotonic on
//          unified_profiles.last_bh_sync_at, strict validation, non-2xx on failure.
//   LEGACY { email, nctr_amount, nctr_locked_points?, ... }
//          Response contract unchanged (200 { received:false } on failure) so
//          current BH callers cannot break. Logged as shape "legacy"; removed at Step 1.6.

const MAX_POINTS = 1_000_000_000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secretsMatch(provided: string | null, expected: string): boolean {
  if (provided === null) return false;
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// undefined → absent; a finite number in [0, MAX_POINTS] → ok; anything else → invalid.
function checkPoints(v: unknown): "absent" | "ok" | "invalid" {
  if (v === undefined || v === null) return "absent";
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > MAX_POINTS) return "invalid";
  return "ok";
}

// Escape LIKE wildcards so an address such as first_last@x.com matches only itself.
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  let isNewShapeRequest = false; // read by the catch-all to keep the legacy contract

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Verify SYNC_SECRET header
    const expectedSecret = Deno.env.get("SYNC_SECRET");
    if (!expectedSecret || !secretsMatch(req.headers.get("x-sync-secret"), expectedSecret)) {
      console.error("Invalid or missing x-sync-secret header");
      return json({ error: "Unauthorized" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return json({ error: "body must be a JSON object" }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }

    const isNewShape = body.event_id !== undefined || body.bh_user_id !== undefined;
    isNewShapeRequest = isNewShape;
    const shape = isNewShape ? "new" : "legacy";

    const {
      email,
      nctr_amount,
      target_tier,
      status,
      nctr_locked_points,
      nctr_balance_points,
      nctr_earned_total,
    } = body as Record<string, any>;

    // ---- Validation --------------------------------------------------------
    const lockedCheck = checkPoints(nctr_locked_points);
    if (
      lockedCheck === "invalid" ||
      checkPoints(nctr_balance_points) === "invalid" ||
      checkPoints(nctr_earned_total) === "invalid" ||
      (nctr_amount !== undefined && nctr_amount !== null &&
        (typeof nctr_amount !== "number" || !Number.isFinite(nctr_amount)))
    ) {
      return json({ error: "numeric fields must be finite numbers in range" }, 400);
    }

    let bhUserId: string | null = null;
    let eventId: string | null = null;
    let sourceUpdatedAt: string | null = null;

    if (isNewShape) {
      if (typeof body.bh_user_id !== "string" || !UUID_RE.test(body.bh_user_id)) {
        return json({ error: "bh_user_id must be a UUID" }, 400);
      }
      if (typeof body.event_id !== "string" || body.event_id.length < 1 || body.event_id.length > 200) {
        return json({ error: "event_id is required (1-200 chars)" }, 400);
      }
      const ts = typeof body.source_updated_at === "string" ? Date.parse(body.source_updated_at) : NaN;
      if (!Number.isFinite(ts) || ts > Date.now() + MAX_CLOCK_SKEW_MS) {
        return json({ error: "source_updated_at must be an ISO timestamp, not in the future" }, 400);
      }
      if (lockedCheck !== "ok") {
        // Never treat a missing ledger balance as 0: that would clear the member's tier.
        return json({ error: "nctr_locked_points is required" }, 400);
      }
      bhUserId = (body.bh_user_id as string).toLowerCase();
      eventId = body.event_id as string;
      sourceUpdatedAt = new Date(ts).toISOString();
    } else if (typeof email !== "string" || !email || nctr_amount == null) {
      return json({ error: "email and nctr_amount are required" }, 400);
    }

    // Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const recordEvent = async (
      outcome: "applied" | "stale" | "rejected" | "profile_not_found",
      profileId: string | null,
      detail: string | null,
    ) => {
      if (!isNewShape) return;
      const { error } = await supabaseAdmin.from("bh_sync_events").insert({
        event_id: eventId,
        bh_user_id: bhUserId,
        profile_id: profileId,
        source_updated_at: sourceUpdatedAt,
        nctr_locked_points: nctr_locked_points ?? null,
        outcome,
        detail,
      });
      // 23505 = a concurrent duplicate of the same event already recorded it.
      if (error && error.code !== "23505") {
        console.error("[receive-lock-request] bh_sync_events insert failed:", error.message);
      }
    };

    // ---- Idempotency (new shape) -------------------------------------------
    if (isNewShape) {
      const { data: prior, error: priorError } = await supabaseAdmin
        .from("bh_sync_events")
        .select("outcome")
        .eq("event_id", eventId)
        .maybeSingle();
      if (priorError) {
        console.error("[receive-lock-request] bh_sync_events lookup failed:", priorError.message);
        return json({ received: false, error: "event lookup failed" }, 500);
      }
      if (prior) {
        return json({ received: true, status: "already_applied", outcome: prior.outcome });
      }
    }

    // ---- Profile resolution -------------------------------------------------
    type Profile = {
      id: string;
      crescendo_data: unknown;
      display_name: string | null;
      email: string | null;
      bh_user_id: string | null;
      last_bh_sync_at: string | null;
    };
    const cols = "id, crescendo_data, display_name, email, bh_user_id, last_bh_sync_at";
    let profile: Profile | null = null;
    let matchedBy: "bh_user_id" | "email" | null = null;

    if (isNewShape) {
      const { data, error } = await supabaseAdmin
        .from("unified_profiles").select(cols).eq("bh_user_id", bhUserId).maybeSingle();
      if (error) {
        console.error("[receive-lock-request] lookup by bh_user_id failed:", error.message);
        return json({ received: false, error: "profile lookup failed" }, 500);
      }
      if (data) { profile = data as Profile; matchedBy = "bh_user_id"; }
    }

    if (!profile && typeof email === "string" && email) {
      // Case-insensitive exact match; ambiguity is refused, never guessed.
      const { data, error } = await supabaseAdmin
        .from("unified_profiles").select(cols).ilike("email", escapeLike(email.trim())).limit(2);
      if (error) {
        console.error("[receive-lock-request] lookup by email failed:", error.message);
        if (!isNewShape) return json({ received: false, error: "Profile lookup failed" });
        return json({ received: false, error: "profile lookup failed" }, 500);
      }
      if (data && data.length > 1) {
        await recordEvent("rejected", null, "ambiguous_email");
        if (!isNewShape) return json({ received: false, error: "Ambiguous email" });
        return json({ received: false, error: "ambiguous email" }, 409);
      }
      if (data && data.length === 1) { profile = data[0] as Profile; matchedBy = "email"; }
    }

    if (!profile) {
      console.error(`[receive-lock-request] profile not found (shape=${shape})`);
      await recordEvent("profile_not_found", null, null);
      if (!isNewShape) return json({ received: false, error: "Profile not found for email" });
      return json({ received: false, error: "profile not found" }, 404);
    }

    if (isNewShape && profile.bh_user_id && profile.bh_user_id.toLowerCase() !== bhUserId) {
      // The email points at a profile already bound to a different BH account.
      await recordEvent("rejected", profile.id, "bh_user_id_mismatch");
      return json({ received: false, error: "bh_user_id mismatch" }, 409);
    }

    // Merge pending_lock into existing crescendo_data
    const existingData =
      typeof profile.crescendo_data === "string"
        ? JSON.parse(profile.crescendo_data)
        : (profile.crescendo_data as Record<string, unknown>) ?? {};

    // Build targeted update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (nctr_amount !== undefined && nctr_amount !== null) {
      updatePayload.crescendo_data = {
        ...existingData,
        pending_lock: {
          nctr_amount,
          target_tier: target_tier ?? null,
          requested_at: new Date().toISOString(),
          status: status ?? "pending",
        },
      };
    }
    if (nctr_locked_points !== undefined && nctr_locked_points !== null) {
      updatePayload.nctr_locked_points = nctr_locked_points;
    }
    if (nctr_balance_points !== undefined && nctr_balance_points !== null) {
      updatePayload.nctr_balance_points = nctr_balance_points;
    }
    if (nctr_earned_total !== undefined && nctr_earned_total !== null) {
      updatePayload.nctr_earned_total = nctr_earned_total;
    }
    if (isNewShape) {
      updatePayload.last_bh_sync_at = sourceUpdatedAt;
      if (!profile.bh_user_id) updatePayload.bh_user_id = bhUserId; // bind on first email match
    }

    // Monotonic write (new shape): applies only if this event is newer than the
    // last one applied, checked atomically in the UPDATE itself.
    let updateQuery = supabaseAdmin.from("unified_profiles").update(updatePayload).eq("id", profile.id);
    if (isNewShape) {
      updateQuery = updateQuery.or(`last_bh_sync_at.is.null,last_bh_sync_at.lt."${sourceUpdatedAt}"`);
    }
    const { data: updatedRows, error: updateError } = await updateQuery.select("id");

    if (updateError) {
      console.error("Failed to update unified_profiles:", updateError);
      // Log failed sync attempt
      const { error: logError } = await supabaseAdmin.from("cross_platform_activity_log").insert({
        user_id: profile.id,
        platform: "bounty_hunter",
        action_type: "bh_lock_sync_failed",
        action_data: { shape, event_id: eventId, nctr_locked_points, nctr_balance_points, nctr_amount, error: updateError.message },
      });
      if (logError) console.error("[receive-lock-request] failure log insert failed:", logError.message);
      await recordEvent("rejected", profile.id, `update_failed: ${updateError.message}`);
      if (!isNewShape) return json({ received: false, error: updateError.message });
      return json({ received: false, error: "update failed" }, 500);
    }

    if (isNewShape && (!updatedRows || updatedRows.length === 0)) {
      await recordEvent("stale", profile.id, `last_bh_sync_at >= ${sourceUpdatedAt}`);
      return json({ received: true, status: "stale" });
    }

    // --- CHANGE 1: Recalculate tier from locked points ---
    // Only when the ledger balance was actually supplied; an absent value never clears a tier.
    let assignedTierName = "unchanged";

    if (lockedCheck === "ok") {
      const locked = nctr_locked_points as number;
      assignedTierName = "none";
      let tierId: string | null = null;

      if (locked >= 1000) {
        const { data: matchedTier, error: tierError } = await supabaseAdmin
          .from("status_tiers")
          .select("id, tier_name")
          .lte("min_nctr_360_locked", locked)
          .order("min_nctr_360_locked", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (tierError) console.error("[receive-lock-request] tier lookup failed:", tierError.message);
        if (matchedTier) {
          tierId = matchedTier.id;
          assignedTierName = matchedTier.tier_name;
        }
      }

      if (locked < 1000 || tierId) {
        // Below Bronze threshold → clear tier; otherwise set the matched tier.
        const { error: tierUpdateError } = await supabaseAdmin
          .from("unified_profiles")
          .update({ current_tier_id: tierId })
          .eq("id", profile.id);
        if (tierUpdateError) {
          console.error("[receive-lock-request] tier update failed:", tierUpdateError.message);
        }
      }
    }

    // --- CHANGE 2: Log successful sync ---
    const { error: logError } = await supabaseAdmin.from("cross_platform_activity_log").insert({
      user_id: profile.id,
      platform: "bounty_hunter",
      action_type: "bh_lock_sync",
      action_data: {
        shape,
        event_id: eventId,
        matched_by: matchedBy,
        source_updated_at: sourceUpdatedAt,
        nctr_locked_points,
        nctr_balance_points,
        nctr_earned_total,
        nctr_amount,
        target_tier,
        tier_assigned: assignedTierName,
        synced_at: new Date().toISOString(),
      },
    });
    if (logError) console.error("[receive-lock-request] success log insert failed:", logError.message);

    await recordEvent("applied", profile.id, matchedBy === "email" ? "matched_by_email" : null);

    console.log(
      `Lock sync applied: shape=${shape} event=${eventId ?? "n/a"} profile=${profile.id}, tier_assigned=${assignedTierName}, locked_pts=${nctr_locked_points ?? "n/a"}, balance_pts=${nctr_balance_points ?? "n/a"}, earned_total=${nctr_earned_total ?? "n/a"}`
    );

    // Push to Godview (fire-and-forget) — only when a tier was actually recalculated.
    if (assignedTierName !== "unchanged") {
      pushToGodview("tier_upgrade", {
        user_id: profile.id,
        actor_email: profile.email || email,
        actor_name: profile.display_name || profile.email || email || "Crescendo Member",
        new_tier: assignedTierName,
        prior_tier: (existingData as { tier?: string })?.tier ?? null,
        nctr_locked: nctr_locked_points,
      });
    }

    if (isNewShape) return json({ received: true, status: "applied", tier_assigned: assignedTierName });
    return json({ received: true, tier_assigned: assignedTierName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("receive-lock-request error:", msg);
    // Legacy callers keep the old 200 { received:false } contract until Step 1.6.
    return json({ received: false, error: msg }, isNewShapeRequest ? 500 : 200);
  }
});
