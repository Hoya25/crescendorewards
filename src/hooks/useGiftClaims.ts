import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import type { ClaimGift } from '@/types/gifts';

// Helper to send gift notification emails
const sendGiftNotification = async (params: {
  type: "gift_sent" | "gift_claimed" | "gift_expiring";
  giftId: string;
  recipientEmail: string;
  senderName?: string;
  claimsAmount: number;
  message?: string;
  giftCode?: string;
  expiresAt?: string;
  claimedByName?: string;
}) => {
  try {
    await supabase.functions.invoke('send-gift-notification', {
      body: params
    });
  } catch (err) {
    console.error('Error sending gift notification:', err);
    // Don't throw - notification failure shouldn't block the action
  }
};

export function useGiftClaims() {
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const [isLoading, setIsLoading] = useState(false);

  const sendGift = useCallback(async (
    recipientEmail: string,
    claimsAmount: number,
    message?: string
  ): Promise<{ success: boolean; giftCode?: string; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_gift_from_balance', {
        p_sender_id: profile.id,
        p_recipient_email: recipientEmail,
        p_claims_amount: claimsAmount,
        p_message: message || null
      });

      if (error) throw error;

      const result = data as { success: boolean; gift_code?: string; gift_id?: string; expires_at?: string; error?: string };
      
      if (result.success) {
        await refreshUnifiedProfile();
        
        // Send email notification to recipient
        sendGiftNotification({
          type: 'gift_sent',
          giftId: result.gift_id || '',
          recipientEmail,
          senderName: profile.display_name || profile.email || 'A Crescendo member',
          claimsAmount,
          message,
          giftCode: result.gift_code,
          expiresAt: result.expires_at
        });
        
        toast.success(`Gift sent! ${claimsAmount} Claims are on their way.`);
        return { success: true, giftCode: result.gift_code };
      } else {
        toast.error(result.error || 'Failed to send gift');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.error('Error sending gift:', err);
      toast.error(err.message || 'Failed to send gift');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.display_name, profile?.email, refreshUnifiedProfile]);

  const claimGift = useCallback(async (
    giftCode: string
  ): Promise<{ success: boolean; claimsReceived?: number; message?: string; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      // First get the gift details for notification
      const giftDetails = await getGiftByCode(giftCode);
      
      const { data, error } = await supabase.rpc('claim_gift', {
        p_gift_code: giftCode,
        p_user_id: profile.id
      });

      if (error) throw error;

      const result = data as { success: boolean; claims_received?: number; message?: string; error?: string };
      
      if (result.success) {
        await refreshUnifiedProfile();
        
        // Send notification to sender that gift was claimed
        if (giftDetails?.sender?.email && !giftDetails.is_admin_gift) {
          sendGiftNotification({
            type: 'gift_claimed',
            giftId: giftDetails.id,
            recipientEmail: giftDetails.sender.email,
            claimsAmount: result.claims_received || giftDetails.claims_amount,
            claimedByName: profile.display_name || profile.email || 'The recipient'
          });
        }
        
        toast.success(`🎁 You received ${result.claims_received} Claims!`);
        return { 
          success: true, 
          claimsReceived: result.claims_received,
          message: result.message 
        };
      } else {
        toast.error(result.error || 'Failed to claim gift');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.error('Error claiming gift:', err);
      toast.error(err.message || 'Failed to claim gift');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.display_name, profile?.email, refreshUnifiedProfile]);

  const getGiftByCode = useCallback(async (
    giftCode: string
  ): Promise<ClaimGift | null> => {
    try {
      const { data, error } = await supabase
        .from('claim_gifts')
        .select(`
          *,
          sender:unified_profiles!claim_gifts_sender_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('gift_code', giftCode)
        .single();

      if (error) return null;
      return data as unknown as ClaimGift;
    } catch (err) {
      console.error('Error fetching gift by code:', err);
      return null;
    }
  }, []);

  const getSentGifts = useCallback(async (): Promise<ClaimGift[]> => {
    if (!profile?.id) return [];

    try {
      const { data, error } = await supabase
        .from('claim_gifts')
        .select(`
          *,
          recipient:unified_profiles!claim_gifts_recipient_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ClaimGift[];
    } catch (err) {
      console.error('Error fetching sent gifts:', err);
      return [];
    }
  }, [profile?.id]);

  const getReceivedGifts = useCallback(async (): Promise<ClaimGift[]> => {
    if (!profile?.id) return [];

    try {
      const { data, error } = await supabase
        .from('claim_gifts')
        .select(`
          *,
          sender:unified_profiles!claim_gifts_sender_id_fkey(id, display_name, email, avatar_url)
        `)
        .or(`recipient_id.eq.${profile.id},recipient_email.ilike.${profile.email}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ClaimGift[];
    } catch (err) {
      console.error('Error fetching received gifts:', err);
      return [];
    }
  }, [profile?.id, profile?.email]);

  const getPendingGifts = useCallback(async (): Promise<ClaimGift[]> => {
    if (!profile?.id || !profile?.email) return [];

    try {
      const { data, error } = await supabase
        .from('claim_gifts')
        .select(`
          *,
          sender:unified_profiles!claim_gifts_sender_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('status', 'pending')
        .or(`recipient_id.eq.${profile.id},recipient_email.ilike.${profile.email}`)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ClaimGift[];
    } catch (err) {
      console.error('Error fetching pending gifts:', err);
      return [];
    }
  }, [profile?.id, profile?.email]);

  const cancelGift = useCallback(async (
    giftId: string
  ): Promise<{ success: boolean; refunded?: boolean; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_gift', {
        p_gift_id: giftId,
        p_user_id: profile.id
      });

      if (error) throw error;

      const result = data as { success: boolean; refunded?: boolean; error?: string };
      
      if (result.success) {
        await refreshUnifiedProfile();
        if (result.refunded) {
          toast.success('Gift cancelled and Claims refunded');
        } else {
          toast.success('Gift cancelled');
        }
        return { success: true, refunded: result.refunded };
      } else {
        toast.error(result.error || 'Failed to cancel gift');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.error('Error cancelling gift:', err);
      toast.error(err.message || 'Failed to cancel gift');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, refreshUnifiedProfile]);

  return {
    isLoading,
    sendGift,
    claimGift,
    getSentGifts,
    getReceivedGifts,
    getPendingGifts,
    cancelGift,
    getGiftByCode
  };
}
