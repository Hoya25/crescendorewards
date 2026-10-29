import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface PickCycle {
  id: string;
  kind: 'member' | 'commons';
  cycle_month: string;
  envelope_claims: number | null;
  status: 'open' | 'decided';
  winner_reward_id: string | null;
  candidates: { reward_id: string; title: string; image_url: string | null }[];
}

export function usePickCycles() {
  return useQuery({
    queryKey: ['pick-cycles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pick_cycles_public');
      if (error) throw error;
      return ((data as unknown) as PickCycle[]) ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useBackingPublic() {
  return useQuery({
    queryKey: ['backing-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('backing_public').select('reward_id, backer_count, in_running');
      if (error) throw error;
      const map = new Map<string, { backer_count: number; in_running: boolean }>();
      (data ?? []).forEach((r) => r.reward_id && map.set(r.reward_id, { backer_count: r.backer_count ?? 0, in_running: !!r.in_running }));
      return map;
    },
    staleTime: 30 * 1000,
  });
}

export function useMyBacking() {
  const { isAuthenticated, user } = useAuthContext();
  const tierQ = useQuery({
    queryKey: ['my-member-tier', user?.id],
    enabled: isAuthenticated && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('current_member_tier');
      if (error) throw error;
      return (data as string | null) ?? null;
    },
    staleTime: 60 * 1000,
  });
  const backedQ = useQuery({
    queryKey: ['my-backing', user?.id],
    enabled: isAuthenticated && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('reward_backing').select('reward_id');
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.reward_id));
    },
  });
  return { tier: tierQ.data ?? null, backed: backedQ.data ?? new Set<string>(), isLoading: tierQ.isLoading || backedQ.isLoading };
}

export function useToggleBacking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rewardId, backed }: { rewardId: string; backed: boolean }) => {
      const { error } = backed
        ? await supabase.rpc('withdraw_backing', { p_reward_id: rewardId })
        : await supabase.rpc('back_reward', { p_reward_id: rewardId });
      if (error) throw error;
      return !backed;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['my-backing'] });
      qc.invalidateQueries({ queryKey: ['backing-public'] });
    },
  });
}

export function monthLabel(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  return d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
}
