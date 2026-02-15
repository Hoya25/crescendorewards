import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export function useFounding111() {
  return useQuery({
    queryKey: ['founding-111-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_founding_111_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    staleTime: 30_000,
  });
}

export function useFounding111Status() {
  const { profile } = useUnifiedUser();

  return useQuery({
    queryKey: ['founding-111-status', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase.rpc('get_my_founding_111_status', {
        p_user_id: profile.id,
      });
      if (error) throw error;
      return data as {
        status: 'not_found' | 'not_candidate' | 'candidate' | 'qualified_pending' | 'approved' | 'closed';
        founding_number?: number;
        approved_count?: number;
        has_purchase?: boolean;
        has_referral_purchase?: boolean;
      };
    },
    enabled: !!profile?.id,
    staleTime: 30_000,
  });
}

export interface Founding111Candidate {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  founding_111_candidate: boolean;
  founding_111_qualified: boolean;
  founding_111_approved: boolean;
  founding_111_number: number | null;
  founding_111_qualified_at: string | null;
  founding_111_approved_at: string | null;
  purchase_count: number;
  total_spend: number;
  referral_count: number;
  referral_purchases: number;
}

export function useFounding111Candidates() {
  return useQuery({
    queryKey: ['founding-111-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_founding_111_candidates');
      if (error) throw error;
      return (data as Founding111Candidate[]) ?? [];
    },
    staleTime: 10_000,
  });
}

export function useApproveFounding111() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('approve_founding_111', { p_user_id: userId });
      if (error) throw error;
      return data as { success: boolean; founding_number?: number; error?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founding-111-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['founding-111-count'] });
    },
  });
}

export function useRejectFounding111() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('reject_founding_111', { p_user_id: userId });
      if (error) throw error;
      return data as { success: boolean; error?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founding-111-candidates'] });
    },
  });
}
