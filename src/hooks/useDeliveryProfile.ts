import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { UserDeliveryProfile, RequiredDataField } from '@/types/delivery';

interface UseDeliveryProfileReturn {
  profile: UserDeliveryProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<UserDeliveryProfile>) => Promise<boolean>;
  checkRequiredFields: (requiredData: RequiredDataField[]) => { complete: boolean; missing: RequiredDataField[] };
  getFieldValue: (field: RequiredDataField) => string | undefined;
  refetch: () => Promise<void>;
  completionPercentage: number;
}

const ALL_PROFILE_FIELDS: RequiredDataField[] = [
  'email', 'phone', 'shipping_address', 'wallet_address',
  'twitter_handle', 'instagram_handle', 'tiktok_handle',
  'kick_username', 'discord_username', 'telegram_handle', 'youtube_channel'
];

export function useDeliveryProfile(): UseDeliveryProfileReturn {
  const unifiedUser = useUnifiedUser();
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserDeliveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unifiedProfileId = unifiedUser?.profile?.id;
  const unifiedEmail = unifiedUser?.profile?.email;
  const unifiedWallet = unifiedUser?.profile?.wallet_address;
  const userEmail = user?.email;

  const fetchProfile = useCallback(async () => {
    if (!unifiedProfileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_delivery_profiles')
        .select('*')
        .eq('user_id', unifiedProfileId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setProfile(data as UserDeliveryProfile);
      } else {
        // Create initial profile with available data
        const initialProfile = {
          user_id: unifiedProfileId,
          email: unifiedEmail || userEmail || undefined,
          wallet_address: unifiedWallet || undefined,
        };
        
        const { data: newProfile, error: insertError } = await supabase
          .from('user_delivery_profiles')
          .insert([initialProfile])
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile as UserDeliveryProfile);
      }
    } catch (err: any) {
      console.error('Error fetching delivery profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unifiedProfileId, unifiedEmail, unifiedWallet, userEmail]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: Partial<UserDeliveryProfile>): Promise<boolean> => {
    if (!unifiedProfileId) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('user_delivery_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', unifiedProfileId);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, ...data } : null);
      toast({ title: 'Saved', description: 'Your delivery profile has been updated.' });
      return true;
    } catch (err: any) {
      console.error('Error updating delivery profile:', err);
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
      return false;
    }
  }, [unifiedProfileId]);

  const getFieldValue = useCallback((field: RequiredDataField): string | undefined => {
    if (!profile) return undefined;
    
    switch (field) {
      case 'email':
        return profile.email;
      case 'phone':
        return profile.phone;
      case 'shipping_address':
        // Shipping is complete if we have name, address, city, state, zip
        if (profile.shipping_name && profile.shipping_address_line1 && 
            profile.shipping_city && profile.shipping_state && profile.shipping_zip) {
          return `${profile.shipping_name}, ${profile.shipping_address_line1}`;
        }
        return undefined;
      case 'wallet_address':
        return profile.wallet_address;
      case 'twitter_handle':
        return profile.twitter_handle;
      case 'instagram_handle':
        return profile.instagram_handle;
      case 'tiktok_handle':
        return profile.tiktok_handle;
      case 'kick_username':
        return profile.kick_username;
      case 'discord_username':
        return profile.discord_username;
      case 'telegram_handle':
        return profile.telegram_handle;
      case 'youtube_channel':
        return profile.youtube_channel;
      default:
        return undefined;
    }
  }, [profile]);

  const checkRequiredFields = useCallback((requiredData: RequiredDataField[]): { complete: boolean; missing: RequiredDataField[] } => {
    const missing: RequiredDataField[] = [];
    
    for (const field of requiredData) {
      const value = getFieldValue(field);
      if (!value || value.trim() === '') {
        missing.push(field);
      }
    }

    return {
      complete: missing.length === 0,
      missing
    };
  }, [getFieldValue]);

  const completionPercentage = (() => {
    if (!profile) return 0;
    let completed = 0;
    for (const field of ALL_PROFILE_FIELDS) {
      if (getFieldValue(field)) completed++;
    }
    return Math.round((completed / ALL_PROFILE_FIELDS.length) * 100);
  })();

  return {
    profile,
    loading,
    error,
    updateProfile,
    checkRequiredFields,
    getFieldValue,
    refetch: fetchProfile,
    completionPercentage
  };
}
