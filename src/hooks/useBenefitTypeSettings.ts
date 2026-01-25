import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BenefitTypeSetting {
  id: string;
  benefit_key: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  category: string;
  sort_order: number;
}

export function useBenefitTypeSettings() {
  const [settings, setSettings] = useState<BenefitTypeSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('benefit_type_settings')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching benefit type settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleBenefitType = async (benefitKey: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('benefit_type_settings')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('benefit_key', benefitKey);

      if (error) throw error;

      setSettings(prev => 
        prev.map(s => s.benefit_key === benefitKey ? { ...s, is_active: isActive } : s)
      );

      toast.success(`${isActive ? 'Enabled' : 'Disabled'} benefit type`);
    } catch (error) {
      console.error('Error updating benefit type:', error);
      toast.error('Failed to update benefit type');
    }
  };

  const isActive = (benefitKey: string): boolean => {
    const setting = settings.find(s => s.benefit_key === benefitKey);
    return setting?.is_active ?? true;
  };

  return {
    settings,
    loading,
    toggleBenefitType,
    isActive,
    refetch: fetchSettings
  };
}
