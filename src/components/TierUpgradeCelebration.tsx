import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Gift, CheckSquare, Flame, Star, Eye,
  Trophy, Crown, Sparkles, Gem, Shield, Scale,
  Rocket, Copy, ExternalLink,
} from 'lucide-react';
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

const TIER_CONFETTI: Record<string, string[]> = {
  bronze: ['#CD7F32', '#B87333', '#A0522D', '#D2691E'],
  silver: ['#C0C0C0', '#E8E8E8', '#A9A9A9', '#DCDCDC'],
  gold: ['#FFD700', '#FFA500', '#DAA520', '#F0E68C'],
  platinum: ['#E5E4E2', '#4169E1', '#00BFFF', '#87CEEB'],
  diamond: ['#B9F2FF', '#00CED1', '#FFD700', '#C8FF00', '#9370DB'],
};

const TIER_BG_GRADIENT: Record<string, string> = {
  bronze: 'radial-gradient(ellipse at 50% 30%, rgba(205,127,50,0.15) 0%, transparent 60%)',
  silver: 'radial-gradient(ellipse at 50% 30%, rgba(192,192,192,0.12) 0%, transparent 60%)',
  gold: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.12) 0%, transparent 60%)',
  platinum: 'radial-gradient(ellipse at 50% 30%, rgba(229,228,226,0.10) 0%, transparent 60%)',
  diamond: 'radial-gradient(ellipse at 50% 30%, rgba(185,242,255,0.12) 0%, transparent 60%)',
};

interface UnlockCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function getUnlockCards(tierName: string): UnlockCard[] {
  const iconClass = 'w-5 h-5';
  const cards: Record<string, UnlockCard[]> = {
    bronze: [
      { icon: <ShoppingBag className={iconClass} />, title: 'Tier 1 Merch Bounties', description: 'Earn NCTR by purchasing and sharing NCTR merch' },
      { icon: <Gift className={iconClass} />, title: 'Basic Crescendo Rewards', description: 'Access Bronze-level rewards in the marketplace' },
      { icon: <CheckSquare className={iconClass} />, title: 'Community Voting Rights', description: 'Vote on new rewards and community decisions' },
    ],
    silver: [
      { icon: <Flame className={iconClass} />, title: 'Tier 2 Merch Bounties', description: 'Up to 1,500 NCTR each with 360LOCK' },
      { icon: <Star className={iconClass} />, title: 'Silver-tier Crescendo Rewards', description: 'Upgraded rewards now available to you' },
      { icon: <Eye className={iconClass} />, title: 'NCTR Sighting Bounty', description: 'Spot someone wearing NCTR merch, earn 1,500 NCTR' },
    ],
    gold: [
      { icon: <Trophy className={iconClass} />, title: 'Tier 3 Campaign Bounties', description: 'Up to 3,000 NCTR each — the highest-value bounties' },
      { icon: <Crown className={iconClass} />, title: 'Gold-tier Crescendo Rewards', description: 'Premium experiences and rewards unlocked' },
      { icon: <Sparkles className={iconClass} />, title: 'VIP Opportunities', description: 'Exclusive access to special campaigns and events' },
    ],
    platinum: [
      { icon: <Gem className={iconClass} />, title: 'Platinum-exclusive Rewards', description: 'The best Crescendo has to offer' },
      { icon: <Rocket className={iconClass} />, title: 'Priority Access to New Features', description: 'Be first to try new platform capabilities' },
      { icon: <Scale className={iconClass} />, title: 'Enhanced Governance Weight', description: 'Your voice carries more weight in community decisions' },
    ],
    diamond: [
      { icon: <Gem className={iconClass} />, title: 'Diamond-exclusive Everything', description: 'Every reward in Crescendo is available to you' },
      { icon: <Shield className={iconClass} />, title: 'Inner Circle Access', description: 'Join the inner circle shaping Crescendo\'s future' },
      { icon: <Crown className={iconClass} />, title: 'Maximum Governance Influence', description: 'The highest level of community leadership' },
    ],
  };
  return cards[tierName] || cards.bronze;
}

const NEXT_TIER_PREVIEWS: Record<string, string[]> = {
  bronze: ['Tier 2 Merch Bounties worth up to 1,500 NCTR', 'NCTR Sighting Bounty'],
  silver: ['Campaign Bounties worth up to 3,000 NCTR', 'VIP Opportunities'],
  gold: ['Platinum-exclusive Rewards', 'Priority Feature Access'],
  platinum: ['Diamond-exclusive Everything', 'Inner Circle Access'],
};

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

  const tierName = (newTier.tier_name || newTier.display_name || 'bronze').toLowerCase();
  const colors = TIER_CONFETTI[tierName] || TIER_CONFETTI.bronze;
  const tierColor = newTier.badge_color || '#C8FF00';
  const newMultiplier = (newTier as any)?.earning_multiplier ?? DEFAULT_EARNING_MULTIPLIERS[tierName] ?? 1;
  const nctrToNext = nextTierThreshold ? Math.max(0, nextTierThreshold - totalLockedNctr) : null;
  const unlockCards = getUnlockCards(tierName);

  const progressPercent = nextTierThreshold
    ? Math.min(100, ((totalLockedNctr - newTier.min_nctr_360_locked) / (nextTierThreshold - newTier.min_nctr_360_locked)) * 100)
    : 100;

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.45 }, colors });
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
    }, 300);
    setTimeout(() => {
      confetti({ particleCount: 40, spread: 360, startVelocity: 30, origin: { y: 0.4, x: 0.5 }, shapes: ['star'], colors });
    }, 600);
  }, [colors]);

  useEffect(() => {
    if (!isOpen) {
      setPhase('reveal');
      return;
    }

    const t1 = setTimeout(fireConfetti, 500);
    const t2 = setTimeout(() => setPhase('unlocks'), 2200);
    const t3 = setTimeout(() => setPhase('ready'), 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isOpen, fireConfetti]);

  // Allow dismiss after unlocks phase
  useEffect(() => {
    if (!isOpen || phase === 'reveal') return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, phase, onClose]);

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

  const isDiamond = tierName === 'diamond';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4">
      {/* Overlay — clickable after reveal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        style={{ background: 'rgba(26, 26, 46, 0.92)' }}
        onClick={phase !== 'reveal' ? onClose : undefined}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: '#1A1A2E' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tier glow background */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: TIER_BG_GRADIENT[tierName] || TIER_BG_GRADIENT.bronze }} />

        <div className="relative p-6 space-y-6">

          {/* ══════ PHASE 1: DRAMATIC REVEAL ══════ */}
          <div className="text-center space-y-4 pt-2">
            {/* Badge morph */}
            <div className="relative h-28 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key="old-badge"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0.3, y: -30 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute text-5xl"
                >
                  {previousTier.badge_emoji}
                </motion.div>
              </AnimatePresence>

              {/* New badge with metallic ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.9, type: 'spring', stiffness: 180, damping: 12 }}
                className="absolute flex items-center justify-center"
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-6xl"
                  style={{
                    background: `radial-gradient(circle at 40% 35%, ${tierColor}33, ${tierColor}11)`,
                    boxShadow: `0 0 40px ${tierColor}22, 0 0 80px ${tierColor}11`,
                    border: `2px solid ${tierColor}44`,
                  }}
                >
                  {newTier.badge_emoji}
                </div>
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
            >
              <h1 className="text-3xl font-black tracking-tight" style={{ color: tierColor }}>
                You Reached {newTier.display_name}!
              </h1>
              <p className="text-white/50 text-sm mt-1.5">
                Your commitment is paying off.
              </p>
            </motion.div>

            {/* Multiplier badge */}
            {newMultiplier > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.3 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}30`, color: tierColor }}
              >
                ⚡ {newMultiplier}x Earning Multiplier Active
              </motion.div>
            )}
          </div>

          {/* ══════ PHASE 2: WHAT YOU UNLOCKED ══════ */}
          <AnimatePresence>
            {(phase === 'unlocks' || phase === 'ready') && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 h-px" style={{ background: `${tierColor}20` }} />
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40 shrink-0">
                    What {newTier.display_name} members get
                  </p>
                  <div className="flex-1 h-px" style={{ background: `${tierColor}20` }} />
                </div>

                {unlockCards.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${tierColor}12`, color: tierColor }}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{card.title}</p>
                      <p className="text-xs text-white/45 mt-0.5">{card.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════ PHASE 3: NEXT TIER + CTAs ══════ */}
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Divider */}
                <div className="h-px" style={{ background: `${tierColor}15` }} />

                {/* Next tier preview OR max tier */}
                {isDiamond ? (
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ background: `${tierColor}08`, border: `1px solid ${tierColor}20` }}
                  >
                    <p className="text-sm font-semibold" style={{ color: tierColor }}>
                      👑 You have reached the highest tier. Welcome to the top.
                    </p>
                  </div>
                ) : nextTierName && nextTierThreshold ? (
                  <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                        Next: {nextTierName}
                      </p>
                      <p className="text-xs text-white/40">
                        {nextTierThreshold.toLocaleString()} NCTR locked
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: tierColor }}
                      />
                    </div>
                    <p className="text-xs text-white/40">
                      {totalLockedNctr.toLocaleString()} / {nextTierThreshold.toLocaleString()} NCTR
                      {nctrToNext !== null && ` — ${nctrToNext.toLocaleString()} to go`}
                    </p>

                    {/* Next tier preview rewards */}
                    {NEXT_TIER_PREVIEWS[tierName] && (
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[11px] text-white/30 uppercase tracking-wider">Coming at {nextTierName}:</p>
                        {NEXT_TIER_PREVIEWS[tierName].map((preview, i) => (
                          <p key={i} className="text-xs text-white/50 flex items-center gap-1.5">
                            <span style={{ color: tierColor }}>•</span> {preview}
                          </p>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-white/40 text-center mt-1">
                      Keep earning and committing to get there!
                    </p>
                  </div>
                ) : null}

                {/* Share row */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-white/15 text-white/60 hover:bg-white/5 hover:text-white"
                    onClick={handleShare}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-white/15 text-white/60 hover:bg-white/5 hover:text-white"
                    onClick={handleShareTwitter}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> Post on X
                  </Button>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    className="w-full h-12 font-semibold text-base"
                    style={{ background: '#C8FF00', color: '#1A1A2E' }}
                    onClick={() => {
                      onClose();
                      window.location.href = '/rewards';
                    }}
                  >
                    Explore My New Rewards
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-white border-white/15 hover:bg-white/5"
                    onClick={() => {
                      onClose();
                      window.location.href = '/dashboard';
                    }}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
