import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export interface ValidationResult {
  success: boolean;
  status: 'eligible' | 'not_eligible' | 'already_claimed' | 'auto_applied' | 'auto_drip' | 'pending' | 'error';
  message: string;
  progress?: number;
  required?: number;
  purchases?: number;
  merch_purchases?: number;
  referrals?: number;
}

export function useBountyValidation() {
  const { profile } = useUnifiedUser();

  const mutation = useMutation({
    mutationFn: async ({
      bountyId,
      submissionUrl,
      submissionNotes,
    }: {
      bountyId: string;
      submissionUrl?: string;
      submissionNotes?: string;
    }): Promise<ValidationResult> => {
      if (!profile?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('validate_and_claim_bounty', {
        p_user_id: profile.id,
        p_bounty_id: bountyId,
        p_submission_url: submissionUrl ?? null,
        p_submission_notes: submissionNotes ?? null,
      });

      if (error) throw error;
      return data as unknown as ValidationResult;
    },
  });

  return {
    validate: mutation.mutateAsync,
    isValidating: mutation.isPending,
  };
}
