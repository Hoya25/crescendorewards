import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ReferralSettings {
  allocation360Lock: number;
}

export function useReferralSettings() {
  return useQuery({
    queryKey: ['referral-settings'],
    queryFn: async (): Promise<ReferralSettings> => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'referral_360lock_allocation')
        .maybeSingle();

      if (error) {
        console.error('Error fetching referral settings:', error);
        // Return default value
        return { allocation360Lock: 500 };
      }

      const value = data?.setting_value;
      const allocation = typeof value === 'number' 
        ? value 
        : typeof value === 'string' 
          ? parseInt(value.replace(/"/g, ''), 10) 
          : 500;

      return { allocation360Lock: isNaN(allocation) ? 500 : allocation };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
