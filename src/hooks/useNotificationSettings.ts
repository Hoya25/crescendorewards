import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_shop_purchases: boolean;
  email_nctr_credited: boolean;
  email_tier_changes: boolean;
  email_rewards_claimed: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotificationSettings() {
  const { profile } = useUnifiedUser();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchSettings = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from('notification_settings')
          .insert({
            user_id: profile.id,
            email_shop_purchases: true,
            email_nctr_credited: true,
            email_tier_changes: true,
            email_rewards_claimed: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ [key]: value })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      toast.success('Notification preference updated');
    } catch (error) {
      console.error('Error updating notification setting:', error);
      toast.error('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    updateSetting,
    refetch: fetchSettings,
  };
}
