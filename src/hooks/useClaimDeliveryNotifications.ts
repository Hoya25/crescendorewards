import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import { Truck, Mail, Package, CheckCircle, AlertCircle, Clock, Wallet } from 'lucide-react';

interface ClaimUpdate {
  id: string;
  status: string;
  delivery_status: string | null;
  delivery_method: string | null;
  reward_id: string;
}

const DELIVERY_STATUS_MESSAGES: Record<string, { title: string; description: string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  pending: {
    title: 'Claim Received',
    description: 'Your reward claim is being processed.',
    type: 'info',
  },
  processing: {
    title: 'Processing Your Reward',
    description: 'We\'re preparing your reward for delivery.',
    type: 'info',
  },
  shipped: {
    title: 'Reward Shipped! 📦',
    description: 'Your reward is on its way!',
    type: 'success',
  },
  delivered: {
    title: 'Reward Delivered! 🎉',
    description: 'Your reward has been delivered successfully.',
    type: 'success',
  },
  failed: {
    title: 'Delivery Issue',
    description: 'There was a problem with your reward delivery. Please contact support.',
    type: 'error',
  },
};

const DELIVERY_METHOD_MESSAGES: Record<string, string> = {
  shipping: 'Check your mailbox soon!',
  email: 'Check your email inbox.',
  wallet_transfer: 'Check your connected wallet.',
  instant_code: 'Your code is ready in your claims.',
  platform_delivery: 'Delivery via the platform.',
  scheduling: 'You\'ll be contacted to schedule.',
  manual: 'A team member will reach out.',
};

const CLAIM_STATUS_MESSAGES: Record<string, { title: string; description: string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  approved: {
    title: 'Claim Approved! ✅',
    description: 'Your reward claim has been approved and is being processed.',
    type: 'success',
  },
  rejected: {
    title: 'Claim Not Approved',
    description: 'Unfortunately your claim could not be approved. Check your submissions for details.',
    type: 'error',
  },
};

export function useClaimDeliveryNotifications() {
  const { profile } = useUnifiedUser();
  const processedUpdates = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('claim-delivery-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rewards_claims',
          filter: `user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const newClaim = payload.new as ClaimUpdate;
          const oldClaim = payload.old as ClaimUpdate;
          
          // Create a unique key for this update to prevent duplicates
          const updateKey = `${newClaim.id}-${newClaim.status}-${newClaim.delivery_status}`;
          
          if (processedUpdates.current.has(updateKey)) {
            return;
          }
          processedUpdates.current.add(updateKey);
          
          // Clear old keys after some time to prevent memory bloat
          setTimeout(() => {
            processedUpdates.current.delete(updateKey);
          }, 60000);

          // Fetch reward title for better context
          let rewardTitle = 'Your reward';
          try {
            const { data: reward } = await supabase
              .from('rewards')
              .select('title')
              .eq('id', newClaim.reward_id)
              .single();
            
            if (reward?.title) {
              rewardTitle = reward.title;
            }
          } catch (error) {
            // Continue with default title
          }

          // Check for claim status changes (approved/rejected)
          if (oldClaim.status !== newClaim.status && CLAIM_STATUS_MESSAGES[newClaim.status]) {
            const statusMsg = CLAIM_STATUS_MESSAGES[newClaim.status];
            
            if (statusMsg.type === 'success') {
              toast.success(statusMsg.title, {
                description: `${rewardTitle}: ${statusMsg.description}`,
                duration: 6000,
              });
            } else if (statusMsg.type === 'error') {
              toast.error(statusMsg.title, {
                description: `${rewardTitle}: ${statusMsg.description}`,
                duration: 8000,
              });
            }
          }

          // Check for delivery status changes
          if (oldClaim.delivery_status !== newClaim.delivery_status && newClaim.delivery_status) {
            const deliveryMsg = DELIVERY_STATUS_MESSAGES[newClaim.delivery_status];
            
            if (deliveryMsg) {
              // Add delivery method specific message
              const methodHint = newClaim.delivery_method 
                ? DELIVERY_METHOD_MESSAGES[newClaim.delivery_method] || ''
                : '';
              
              const fullDescription = methodHint 
                ? `${rewardTitle}: ${deliveryMsg.description} ${methodHint}`
                : `${rewardTitle}: ${deliveryMsg.description}`;

              if (deliveryMsg.type === 'success') {
                toast.success(deliveryMsg.title, {
                  description: fullDescription,
                  duration: 6000,
                });
              } else if (deliveryMsg.type === 'error') {
                toast.error(deliveryMsg.title, {
                  description: fullDescription,
                  duration: 8000,
                });
              } else if (deliveryMsg.type === 'warning') {
                toast.warning(deliveryMsg.title, {
                  description: fullDescription,
                  duration: 6000,
                });
              } else {
                toast.info(deliveryMsg.title, {
                  description: fullDescription,
                  duration: 5000,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);
}
