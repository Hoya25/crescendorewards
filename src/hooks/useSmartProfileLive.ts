import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/** True only when admin_settings.smart_profile_live is 'true'; false on error or missing. */
export function useSmartProfileLive() {
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'smart_profile_live')
          .single();
        if (error || !data) return;
        const raw = typeof data.setting_value === 'string'
          ? data.setting_value.replace(/"/g, '')
          : String(data.setting_value);
        setLive(raw === 'true');
      } catch {
        setLive(false);
      } finally {
        setLoading(false);
      }
    };
    fetchFlag();
  }, []);

  return { live, loading };
}
