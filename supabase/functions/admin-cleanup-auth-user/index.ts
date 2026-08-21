// Admin-gated cleanup of orphaned / junk auth users.
//
// Deletes an auth.users row only when it is safe to do so:
//   - the caller is a verified admin (server-derived from the session JWT)
//     or a trusted internal caller (service role / SYNC_SECRET)
//   - the target has never signed in
//   - the target has no unified_profiles row
//   - the target has no member activity (transactions, claims, selections)
// Anything else is refused, so a real member can never be removed by mistake.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import {
  adminClient,
  requireAdmin,
  isInternalCaller,
  unauthorized,
} from "../_shared/auth.ts";

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const cors = getCorsHeaders(req);

  try {
    const internal = isInternalCaller(req);
    const callerId = internal ? "internal" : await requireAdmin(req);
    if (!callerId) return unauthorized(cors);

    const body = await req.json().catch(() => ({}));
    const targetId: string | undefined = body?.user_id;
    const dryRun: boolean = body?.dry_run === true;

    if (!targetId || !/^[0-9a-f-]{36}$/i.test(targetId)) {
      return json({ error: "user_id (uuid) is required" }, 400, cors);
    }

    const admin = adminClient();

    // --- Fetch the target ------------------------------------------------
    const { data: targetRes, error: getErr } = await admin.auth.admin
      .getUserById(targetId);
    if (getErr || !targetRes?.user) {
      return json({ error: "Auth user not found" }, 404, cors);
    }
    const target = targetRes.user;

    // --- Safety checks --------------------------------------------------
    const blockers: string[] = [];

    if (target.last_sign_in_at) blockers.push("user has signed in before");

    const { data: profile } = await admin
      .from("unified_profiles")
      .select("id")
      .eq("auth_user_id", targetId)
      .maybeSingle();
    if (profile?.id) blockers.push("user has a member profile");

    const activityChecks: Array<[string, string]> = [
      ["nctr_transactions", "user_id"],
      ["rewards_claims", "user_id"],
      ["member_reward_selections", "member_id"],
      ["purchases", "user_id"],
      ["shop_transactions", "user_id"],
    ];

    for (const [table, column] of activityChecks) {
      const { count } = await admin
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(column, targetId);
      if ((count ?? 0) > 0) blockers.push(`user has rows in ${table}`);
    }

    if (blockers.length > 0) {
      return json(
        {
          success: false,
          error: "Refusing to delete: target does not look like a junk account",
          blockers,
          target: { id: target.id, email: target.email },
        },
        409,
        cors,
      );
    }

    if (dryRun) {
      return json(
        {
          success: true,
          dry_run: true,
          would_delete: { id: target.id, email: target.email },
        },
        200,
        cors,
      );
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) {
      return json({ success: false, error: delErr.message }, 500, cors);
    }

    console.log(
      `admin-cleanup-auth-user: deleted ${target.id} (${target.email}) by ${callerId}`,
    );

    return json(
      { success: true, deleted: { id: target.id, email: target.email } },
      200,
      cors,
    );
  } catch (err) {
    console.error("admin-cleanup-auth-user error:", err);
    return json({ error: "Internal error" }, 500, cors);
  }
});
