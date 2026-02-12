import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Lock, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { UncelebratedPurchase, useMarkCelebrated } from '@/hooks/useMerchCelebration';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

interface MerchCelebrationModalProps {
  purchases: UncelebratedPurchase[];
  onDismiss: () => void;
}

// Sample merch bounties to display
const SAMPLE_BOUNTIES = [
  { title: 'Rep the Brand Photo', nctr: 750, emoji: '📸' },
  { title: 'Unboxing Moment', nctr: 1500, emoji: '📦' },
  { title: 'Style Your Way', nctr: 1500, emoji: '👕' },
];

export function MerchCelebrationModal({ purchases, onDismiss }: MerchCelebrationModalProps) {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const markCelebrated = useMarkCelebrated();
  const [phase, setPhase] = useState<'reward' | 'bounties'>('reward');

  const totalNctr = purchases.reduce((sum, p) => sum + (p.nctr_earned || 0), 0);
  const purchaseCount = purchases.length;

  // Extract item name from first purchase metadata/shopify_data
  const firstPurchase = purchases[0];
  const itemName = (() => {
    const shopifyData = firstPurchase?.shopify_data as any;
    if (shopifyData?.line_items?.[0]?.title) return shopifyData.line_items[0].title;
    const meta = firstPurchase?.metadata as any;
    if (meta?.item_name) return meta.item_name;
    return null;
  })();

  useEffect(() => {
    const timer = setTimeout(() => setPhase('bounties'), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = async () => {
    // Mark all as celebrated
    const ids = purchases.map(p => p.id);
    await markCelebrated.mutateAsync(ids);

    // Create notification
    if (profile?.id) {
      await supabase.from('notifications').insert({
        user_id: profile.auth_user_id,
        type: 'purchase_reward',
        title: 'NCTR Merch Purchase Confirmed!',
        message: `You earned ${totalNctr.toLocaleString()} NCTR from your purchase. Merch bounties are now available — complete them with 360LOCK to earn 3x more!`,
        metadata: {
          nctr_earned: totalNctr,
          purchase_count: purchaseCount,
          link: '/bounties?filter=merch',
        },
      });
    }

    onDismiss();
  };

  const handleViewBounties = async () => {
    await handleDismiss();
    navigate('/bounties?filter=merch');
  };

  const handleCommitNow = async () => {
    await handleDismiss();
    // Navigate to dashboard which has lock decision flow
    navigate('/dashboard');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: 'hsla(240, 10%, 10%, 0.9)' }}
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'hsl(240, 10%, 12%)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button onClick={handleDismiss} className="absolute top-4 right-4 text-white/40 hover:text-white/70 z-10">
            <X className="h-5 w-5" />
          </button>

          {/* Header — NCTR earned */}
          <div className="p-6 pb-4 text-center relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'hsl(var(--accent-lime))', color: '#1A1A2E' }}
            >
              <ShoppingBag className="h-8 w-8" />
            </motion.div>

            <h2 className="text-xl font-bold text-white mb-1">
              {purchaseCount > 1
                ? `Nice! You Earned ${totalNctr.toLocaleString()} NCTR`
                : `Nice! You Just Earned ${totalNctr.toLocaleString()} NCTR`}
            </h2>

            <p className="text-3xl font-black mb-2" style={{ color: 'hsl(var(--accent-lime))' }}>
              {totalNctr.toLocaleString()} NCTR
            </p>

            {purchaseCount > 1 ? (
              <p className="text-sm text-white/50">From {purchaseCount} purchases</p>
            ) : itemName ? (
              <p className="text-sm text-white/50">From your {itemName} purchase</p>
            ) : null}
          </div>

          {/* Bounties section */}
          <AnimatePresence>
            {phase === 'bounties' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pb-2"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Merch Bounties Unlocked!
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="space-y-2">
                  {SAMPLE_BOUNTIES.map((bounty, i) => (
                    <motion.div
                      key={bounty.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center justify-between rounded-lg p-3"
                      style={{ backgroundColor: 'hsl(0 0% 100% / 0.05)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{bounty.emoji}</span>
                        <span className="text-sm font-medium text-white">{bounty.title}</span>
                      </div>
                      <Badge className="border-0 text-xs font-bold px-2 py-0.5"
                             style={{ backgroundColor: 'hsl(var(--accent-lime) / 0.15)', color: 'hsl(var(--accent-lime))' }}>
                        <Lock className="h-3 w-3 mr-1" />
                        {bounty.nctr.toLocaleString()} NCTR
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                <p className="text-[11px] text-white/40 text-center mt-2">
                  Complete with 360LOCK to earn 3x rewards
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="p-6 pt-4 space-y-2">
            <Button
              onClick={handleViewBounties}
              className="w-full font-semibold gap-2"
              style={{ backgroundColor: 'hsl(var(--accent-lime))', color: '#1A1A2E' }}
            >
              View My Bounties <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCommitNow}
              variant="outline"
              className="w-full text-white/70 border-white/10 hover:bg-white/5"
            >
              Commit NCTR Now
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
