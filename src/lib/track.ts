import { supabase } from '@/integrations/supabase/client';

export async function track(
  eventName: string,
  properties: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('analytics_events' as any).insert({
      event_name: eventName,
      source_app: 'crescendo',
      user_id: user?.id ?? null,
      properties,
    });
  } catch (err) {
    // Fire-and-forget — never block the UI
    console.warn('[track] failed to log event:', eventName, err);
  }
}
