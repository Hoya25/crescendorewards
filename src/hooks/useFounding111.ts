import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useFounding111() {
  return useQuery({
    queryKey: ['founding-111-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_founding_111_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    staleTime: 30_000, // refresh every 30s
  });
}
