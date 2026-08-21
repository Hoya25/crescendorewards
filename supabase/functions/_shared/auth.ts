// Shared caller-authentication helpers for edge functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Validates the Authorization bearer token against Supabase auth.
 * Returns the authenticated auth.users id, or null when invalid/missing.
 */
export async function getAuthUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );

  const { data, error } = await client.auth.getClaims(token);
  const sub = data?.claims?.sub as string | undefined;
  if (error || !sub) return null;
  return sub;
}

/**
 * True when the authenticated caller is an active admin.
 * Checks admin_users (via unified_profiles) and the legacy user_roles table.
 */
export async function isAdminUser(authUserId: string): Promise<boolean> {
  const admin = adminClient();

  const { data: hasRole } = await admin.rpc("has_role", {
    _user_id: authUserId,
    _role: "admin",
  });
  if (hasRole === true) return true;

  const { data: profile } = await admin
    .from("unified_profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (!profile?.id) return false;

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("id")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .maybeSingle();

  return !!adminRow;
}

/** Returns the auth user id when the caller is a verified admin, else null. */
export async function requireAdmin(req: Request): Promise<string | null> {
  const authUserId = await getAuthUserId(req);
  if (!authUserId) return null;
  return (await isAdminUser(authUserId)) ? authUserId : null;
}

/** Constant-time-ish comparison of the internal service secret. */
export function hasSyncSecret(req: Request): boolean {
  const expected = Deno.env.get("SYNC_SECRET");
  const provided = req.headers.get("x-sync-secret");
  return !!expected && !!provided && provided === expected;
}

/** True when the caller presents the service-role key as its bearer token. */
export function hasServiceRoleAuth(req: Request): boolean {
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!expected || !authHeader.startsWith("Bearer ")) return false;
  return authHeader.replace("Bearer ", "").trim() === expected;
}

/** True for trusted server-to-server callers (service role key or SYNC_SECRET). */
export function isInternalCaller(req: Request): boolean {
  return hasServiceRoleAuth(req) || hasSyncSecret(req);
}

/** Escapes user-supplied text before it is interpolated into an HTML email. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes and truncates free-text fields destined for an email body. */
export function safeText(value: unknown, maxLength = 2000): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const clipped = raw.length > maxLength ? `${raw.slice(0, maxLength)}…` : raw;
  return escapeHtml(clipped);
}

/** Returns the URL only when it is a plain http(s) link, else empty string. */
export function safeUrl(value: unknown): string {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return escapeHtml(url.toString());
  } catch {
    return "";
  }
}

export const unauthorized = (corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
