import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import type { ClaimGift, GiftStats, GiftFilters } from '@/types/gifts';

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
}) => {
  try {
    await supabase.functions.invoke('send-gift-notification', {
      body: params
    });
  } catch (err) {
    console.error('Error sending gift notification:', err);
  }
};

export function useAdminGifts() {
  const { profile } = useUnifiedUser();
  const [isLoading, setIsLoading] = useState(false);

  const creditClaims = useCallback(async (
    recipientId: string,
    amount: number,
    message?: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_credit_claims', {
        p_admin_id: profile.id,
        p_recipient_id: recipientId,
        p_claims_amount: amount,
        p_message: message || null,
        p_admin_notes: adminNotes || null
      });

      if (error) throw error;

      const result = data as { success: boolean; claims_credited?: number; error?: string };
      
      if (result.success) {
        toast.success(`Credited ${amount} Claims to user`);
        return { success: true };
      } else {
        toast.error(result.error || 'Failed to credit claims');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.error('Error crediting claims:', err);
      toast.error(err.message || 'Failed to credit claims');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  const sendAdminGift = useCallback(async (
    recipientEmail: string,
    amount: number,
    message?: string,
    adminNotes?: string
  ): Promise<{ success: boolean; giftCode?: string; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      // Check if recipient exists
      const { data: recipientData } = await supabase
        .from('unified_profiles')
        .select('id')
        .ilike('email', recipientEmail)
        .single();

      // Generate gift code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_gift_code');
      if (codeError) throw codeError;
      const giftCode = codeData as string;

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create the gift
      const { data: giftData, error } = await supabase
        .from('claim_gifts')
        .insert({
          sender_id: profile.id,
          recipient_id: recipientData?.id || null,
          recipient_email: recipientEmail,
          claims_amount: amount,
          message,
          gift_code: giftCode,
          status: 'pending',
          is_admin_gift: true,
          admin_notes: adminNotes,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification email
      sendGiftNotification({
        type: 'gift_sent',
        giftId: giftData?.id || '',
        recipientEmail,
        senderName: 'Crescendo Team',
        claimsAmount: amount,
        message,
        giftCode,
        expiresAt: expiresAt.toISOString()
      });

      toast.success(`Gift code sent to ${recipientEmail}`);
      return { success: true, giftCode };
    } catch (err: any) {
      console.error('Error sending admin gift:', err);
      toast.error(err.message || 'Failed to send gift');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  const getAllGifts = useCallback(async (filters?: GiftFilters): Promise<ClaimGift[]> => {
    try {
      let query = supabase
        .from('claim_gifts')
        .select(`
          *,
          sender:unified_profiles!claim_gifts_sender_id_fkey(id, display_name, email, avatar_url),
          recipient:unified_profiles!claim_gifts_recipient_id_fkey(id, display_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.type === 'admin') {
        query = query.eq('is_admin_gift', true);
      } else if (filters?.type === 'user') {
        query = query.eq('is_admin_gift', false);
      }

      if (filters?.search) {
        query = query.or(`recipient_email.ilike.%${filters.search}%,gift_code.ilike.%${filters.search}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as ClaimGift[];
    } catch (err) {
      console.error('Error fetching all gifts:', err);
      return [];
    }
  }, []);

  const cancelGift = useCallback(async (
    giftId: string
  ): Promise<{ success: boolean; error?: string }> => {
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

      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        toast.success('Gift cancelled');
        return { success: true };
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
  }, [profile?.id]);

  const extendGiftExpiry = useCallback(async (
    giftId: string,
    newExpiry: Date
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('claim_gifts')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', giftId);

      if (error) throw error;

      toast.success('Gift expiry extended');
      return { success: true };
    } catch (err: any) {
      console.error('Error extending gift expiry:', err);
      toast.error(err.message || 'Failed to extend expiry');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGiftStats = useCallback(async (): Promise<GiftStats | null> => {
    try {
      const { data, error } = await supabase.rpc('get_gift_stats');

      if (error) throw error;
      return data as unknown as GiftStats;
    } catch (err) {
      console.error('Error fetching gift stats:', err);
      return null;
    }
  }, []);

  const bulkCreditClaims = useCallback(async (
    recipients: { id: string; amount: number }[],
    adminNotes?: string
  ): Promise<{ success: boolean; credited: number; failed: number }> => {
    if (!profile?.id) {
      return { success: false, credited: 0, failed: recipients.length };
    }

    setIsLoading(true);
    let credited = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await creditClaims(recipient.id, recipient.amount, undefined, adminNotes);
      if (result.success) {
        credited++;
      } else {
        failed++;
      }
    }

    setIsLoading(false);
    
    if (credited > 0) {
      toast.success(`Credited Claims to ${credited} users`);
    }
    if (failed > 0) {
      toast.error(`Failed to credit ${failed} users`);
    }

    return { success: failed === 0, credited, failed };
  }, [profile?.id, creditClaims]);

  const searchUsers = useCallback(async (query: string): Promise<Array<{
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  }>> => {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('unified_profiles')
        .select('id, display_name, email, avatar_url')
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }, []);

  return {
    isLoading,
    creditClaims,
    sendAdminGift,
    getAllGifts,
    cancelGift,
    extendGiftExpiry,
    getGiftStats,
    bulkCreditClaims,
    searchUsers
  };
}
