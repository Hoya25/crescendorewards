import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EngineMirrorRow {
  id: string;
  display_name: string;
  status: string;
  primary_color: string | null;
  last_synced_at: string;
}

/**
 * Reads the local mirror of BH Engine registry.
 * Filters to status='live' so the UI never surfaces non-launched engines.
 * Returns [] (never throws) if the mirror is empty or unreachable.
 */
export function useLiveEngines() {
  return useQuery({
    queryKey: ['engine-registry-mirror', 'live'],
    staleTime: 5 * 60 * 1000, // per page-load cache, refresh after 5min
    queryFn: async (): Promise<EngineMirrorRow[]> => {
      const { data, error } = await (supabase as any)
        .from('engine_registry_mirror')
        .select('*')
        .eq('status', 'live')
        .order('display_name');
      if (error) {
        console.warn('[useLiveEngines] mirror unreachable', error.message);
        return [];
      }
      return (data ?? []) as EngineMirrorRow[];
    },
  });
}

export interface EngineMembershipResult {
  memberships: Record<string, boolean>;
  has_any_required: boolean;
  bh_proxy_unavailable: boolean;
}

/**
 * Pre-fetches Engine membership for the given user across the catalog's
 * union of required engines. Single proxy call, per-page-load only.
 * On BH outage → returns LOCKED_FALLBACK (all false).
 */
export function useEngineMembership(
  userId: string | null | undefined,
  engines: string[],
) {
  const sorted = [...new Set(engines)].sort();
  return useQuery({
    queryKey: ['engine-membership', userId, sorted],
    enabled: Boolean(userId) && sorted.length > 0,
    staleTime: 0, // per-page-load only — do not cache across navigations
    gcTime: 0,
    queryFn: async (): Promise<EngineMembershipResult> => {
      if (!userId || sorted.length === 0) {
        return { memberships: {}, has_any_required: true, bh_proxy_unavailable: false };
      }
      const { data, error } = await supabase.functions.invoke(
        'check-engine-membership',
        { body: { user_id: userId, engines: sorted } },
      );
      if (error) {
        const memberships: Record<string, boolean> = {};
        for (const e of sorted) memberships[e] = false;
        return { memberships, has_any_required: false, bh_proxy_unavailable: true };
      }
      return data as EngineMembershipResult;
    },
  });
}
