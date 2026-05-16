// Fire-and-forget pusher to Godview's ingest-event endpoint.
// Uses EdgeRuntime.waitUntil() so the Deno isolate stays alive until the
// fetch completes, even after the parent function returns its Response.
// Failures are logged but never thrown.

declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void } | undefined;

const GODVIEW_INGEST_URL =
  "https://pvjjpkmjbdoziladjtlt.supabase.co/functions/v1/ingest-event";

export function pushToGodview(
  eventType: string,
  payload: Record<string, unknown>
): void {
  const key = Deno.env.get("GODVIEW_INGEST_KEY");
  if (!key) {
    console.error("[godview] GODVIEW_INGEST_KEY not set, skipping push");
    return;
  }

  const p = payload as Record<string, unknown>;
  const envelope = {
    source_app: "crescendo",
    event_type: eventType,
    actor_email: (p?.actor_email as string) || (p?.user_email as string) || null,
    actor_name: (p?.actor_name as string) || (p?.display_name as string) || "Crescendo Member",
    actor_role: "member",
    user_id: (p?.user_id as string) || null,
    occurred_at: new Date().toISOString(),
    metadata: payload,
    env: Deno.env.get("ENVIRONMENT") || "production",
  };

  const pushPromise = (async () => {
    try {
      const res = await fetch(GODVIEW_INGEST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-godview-key": key,
        },
        body: JSON.stringify(envelope),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[godview] non-2xx ${res.status} for ${eventType}: ${body}`);
      } else {
        console.log(`[godview] ${eventType} pushed successfully`);
      }
    } catch (err) {
      console.error(`[godview] push failed for ${eventType}:`, err);
    }
  })();

  // Critical: keep the edge isolate alive until the push completes
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(pushPromise);
  }
}
