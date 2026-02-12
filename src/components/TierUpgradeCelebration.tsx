import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { StatusTier } from '@/contexts/UnifiedUserContext';
import { DEFAULT_EARNING_MULTIPLIERS } from '@/utils/calculateReward';

interface TierUpgradeCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  previousTier: StatusTier;
  newTier: StatusTier;
  totalLockedNctr: number;
  nextTierThreshold: number | null;
  nextTierName: string | null;
}

// Tier-specific confetti color palettes
const TIER_COLORS: Record<string, string[]> = {
  bronze: ['#CD7F32', '#B87333', '#A0522D', '#D2691E'],
  silver: ['#C0C0C0', '#E8E8E8', '#A9A9A9', '#DCDCDC'],
  gold: ['#FFD700', '#FFA500', '#DAA520', '#F0E68C'],
  platinum: ['#4169E1', '#00BFFF', '#E5E4E2', '#87CEEB'],
  diamond: ['#FF69B4', '#00CED1', '#FFD700', '#AAFF00', '#9370DB'],
};

// Tier-specific unlock reveals
function getUnlockCards(tierName: string, nctrToNext: number | null, nextName: string | null, newMultiplier: number): { emoji: string; title: string; description: string }[] {
  const lowerTier = tierName.toLowerCase();

  const base: Record<string, { emoji: string; title: string; description: string }[]> = {
    bronze: [
      { emoji: '🥉', title: 'Bronze Status Achieved', description: 'All Tier 1 bounties + Merch Monday rewards unlocked' },
      { emoji: '📸', title: 'Content Bounties', description: 'Creative content bounties now available to earn more NCTR' },
      { emoji: '⭐', title: 'Bronze Rewards', description: 'Bronze-level rewards now available in the marketplace' },
    ],
    silver: [
      { emoji: '📸', title: '4 New Bounties', description: 'Tier 2 creative content bounties worth up to 1,500 NCTR each with 360LOCK' },
      { emoji: '👀', title: 'NCTR Sighting Bounty', description: 'Spot someone wearing NCTR merch, earn 1,500 NCTR' },
      { emoji: '⭐', title: 'Better Crescendo Rewards', description: 'Silver-level rewards now available in the marketplace' },
    ],
    gold: [
      { emoji: '🎬', title: 'Campaign Bounties Unlocked', description: 'Tier 3 bounties worth up to 3,000 NCTR each' },
      { emoji: '🏆', title: 'Multi-Purchase Bonus', description: 'Complete 3 merch bounties in a month for 3,000 NCTR bonus' },
      { emoji: '💎', title: 'Gold-Level Rewards', description: 'Premium experiences now available' },
    ],
    platinum: [
      { emoji: '🌟', title: 'Premium Access', description: 'Exclusive experiences and opportunities unlocked' },
      { emoji: '🎁', title: 'Platinum Rewards', description: 'The best Crescendo has to offer' },
    ],
    diamond: [
      { emoji: '👑', title: 'Maximum Status Achieved', description: 'Every reward in Crescendo is available to you' },
      { emoji: '🏛️', title: 'Community Leader', description: 'Your voice carries the most weight' },
      { emoji: '🌟', title: 'You ARE the Movement', description: 'Maximum rewards. Maximum impact.' },
    ],
  };

  const cards = base[lowerTier] || base.bronze;

  // Add multiplier card
  if (newMultiplier > 1) {
    cards.unshift({
      emoji: '⚡',
      title: `${newMultiplier}x Earning Multiplier`,
      description: `Your earning multiplier is now ${newMultiplier}x on everything!`,
    });
  }

  if (nctrToNext && nextName && lowerTier !== 'diamond') {
    cards.push({
      emoji: '📈',
      title: `${nctrToNext.toLocaleString()} NCTR to ${nextName}`,
      description: 'Keep earning and locking to reach the next level',
    });
  }

  return cards;
}

export function TierUpgradeCelebration({
  isOpen,
  onClose,
  previousTier,
  newTier,
  totalLockedNctr,
  nextTierThreshold,
  nextTierName,
}: TierUpgradeCelebrationProps) {
  const [phase, setPhase] = useState<'reveal' | 'unlocks' | 'ready'>('reveal');

  const tierName = newTier.tier_name || newTier.display_name?.toLowerCase() || 'bronze';
  const colors = TIER_COLORS[tierName] || TIER_COLORS.bronze;
  const newMultiplier = (newTier as any)?.earning_multiplier ?? DEFAULT_EARNING_MULTIPLIERS[tierName] ?? 1;
  const nctrToNext = nextTierThreshold ? Math.max(0, nextTierThreshold - totalLockedNctr) : null;
  const unlockCards = getUnlockCards(tierName, nctrToNext, nextTierName, newMultiplier);

  const progressPercent = nextTierThreshold
    ? Math.min(100, ((totalLockedNctr - newTier.min_nctr_360_locked) / (nextTierThreshold - newTier.min_nctr_360_locked)) * 100)
    : 100;

  // Fire confetti on reveal
  const fireConfetti = useCallback(() => {
    // Big center burst
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors });
    // Side cannons
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
    }, 300);
    // Stars
    setTimeout(() => {
      confetti({ particleCount: 40, spread: 360, startVelocity: 30, origin: { y: 0.4, x: 0.5 }, shapes: ['star'], colors });
    }, 600);
  }, [colors]);

  useEffect(() => {
    if (!isOpen) {
      setPhase('reveal');
      return;
    }

    // Phase 1: Reveal animation + confetti
    const confettiTimer = setTimeout(fireConfetti, 600);
    // Phase 2: Show unlocks after reveal
    const unlockTimer = setTimeout(() => setPhase('unlocks'), 2500);
    // Phase 3: Show CTAs
    const readyTimer = setTimeout(() => setPhase('ready'), 3200);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(unlockTimer);
      clearTimeout(readyTimer);
    };
  }, [isOpen, fireConfetti]);

  const handleShare = () => {
    const text = `Just reached ${newTier.display_name} status on Crescendo! Earning rewards through participation, not spending. #LiveAndEarn`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Just reached ${newTier.display_name} status on Crescendo! Earning rewards through participation, not spending. #LiveAndEarn`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto">
      {/* Dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.9)' }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md mx-4 my-8 rounded-2xl p-6 space-y-6 overflow-y-auto max-h-[90vh]"
        style={{ background: '#1A1A1A' }}
      >
        {/* PHASE 1: THE REVEAL */}
        <div className="text-center space-y-4">
          {/* Badge morph animation */}
          <div className="relative h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key="old-badge"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0.5, y: -20 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute text-5xl"
              >
                {previousTier.badge_emoji}
              </motion.div>
            </AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.0, type: 'spring', stiffness: 200 }}
              className="absolute text-6xl"
            >
              {newTier.badge_emoji}
            </motion.div>
          </div>

          {/* Tier name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <h1
              className="text-4xl font-black tracking-tight"
              style={{ color: newTier.badge_color || '#AAFF00' }}
            >
              {newTier.display_name?.toUpperCase()}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              You've reached {newTier.display_name} status
            </p>
          </motion.div>
        </div>

        {/* PHASE 2: UNLOCK REVEAL */}
        <AnimatePresence>
          {(phase === 'unlocks' || phase === 'ready') && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-3"
            >
              <p className="text-sm font-semibold text-white/80 text-center">
                Here's what just unlocked:
              </p>
              {unlockCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.12, duration: 0.3 }}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: '#222' }}
                >
                  <span className="text-xl shrink-0 mt-0.5">{card.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <p className="text-xs text-white/50">{card.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHASE 3: STATUS BAR + CTAs */}
        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Progress bar */}
              {nextTierName && (
                <div className="space-y-2 p-4 rounded-xl" style={{ background: '#222' }}>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>{newTier.badge_emoji} {newTier.display_name}</span>
                    <span>{nextTierName}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#333' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: newTier.badge_color || '#AAFF00' }}
                    />
                  </div>
                  {nctrToNext !== null && (
                    <p className="text-xs text-white/50">
                      {nctrToNext.toLocaleString()} NCTR to {nextTierName}
                    </p>
                  )}
                </div>
              )}

              {/* No next tier — max */}
              {!nextTierName && (
                <div
                  className="p-4 rounded-xl text-center border"
                  style={{ borderColor: newTier.badge_color || '#AAFF00', background: 'rgba(170,255,0,0.05)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: newTier.badge_color || '#AAFF00' }}>
                    👑 Maximum tier achieved. You're at the top.
                  </p>
                </div>
              )}

              {/* Share */}
              <div className="p-3 rounded-xl text-center space-y-2" style={{ background: '#222' }}>
                <p className="text-xs text-white/50">🎉 Share your achievement</p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-white/20 text-white hover:bg-white/10"
                    onClick={handleShare}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-white/20 text-white hover:bg-white/10"
                    onClick={handleShareTwitter}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> Post on X
                  </Button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full h-12 font-semibold text-base"
                  style={{ background: '#AAFF00', color: '#000' }}
                  onClick={() => {
                    onClose();
                    // Navigate to rewards/bounties filtered by tier
                    window.location.href = '/rewards';
                  }}
                >
                  See What's New →
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-white border-white/20 hover:bg-white/10"
                  onClick={onClose}
                >
                  Back to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
