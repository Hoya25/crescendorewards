// Fire-and-forget pusher to Godview's ingest-event endpoint.
// Failures are logged but never thrown — calling functions must not await this
// in a way that blocks their primary response.

const GODVIEW_INGEST_URL =
  "https://pvjjpkmjbdoziladjtlt.supabase.co/functions/v1/ingest-event";

export function pushToGodview(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const key = Deno.env.get("GODVIEW_INGEST_KEY");
  if (!key) {
    console.error("[godview] GODVIEW_INGEST_KEY not set — skipping push", { eventType });
    return Promise.resolve();
  }

  const envelope = {
    source: "crescendo",
    event_type: eventType,
    user_id: (payload as { user_id?: string | null }).user_id ?? null,
    timestamp: new Date().toISOString(),
    payload,
    env: Deno.env.get("ENVIRONMENT") || "production",
  };

  // Fire-and-forget — return immediately; handle the promise in the background.
  (async () => {
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
        const text = await res.text().catch(() => "");
        console.error(`[godview] non-2xx ${res.status} for ${eventType}:`, text);
      } else {
        await res.text().catch(() => "");
      }
    } catch (err) {
      console.error(`[godview] push failed for ${eventType}:`, err);
    }
  })();

  return Promise.resolve();
}
