import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Eye, Star, Film, Trophy, Crown, Gem, Zap, Users, TrendingUp, Copy, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  previousTier: string;
  newTier: string;
  newMultiplier: number;
  previousMultiplier: number;
  totalLockedNctr: number;
  nextTierThreshold?: number;
  nextTierName?: string;
  previousEmoji?: string;
  newEmoji?: string;
  nextEmoji?: string;
}

const tierUnlocks: Record<string, { icon: any; title: string; desc: string }[]> = {
  silver: [
    { icon: Camera, title: "4 New Bounties", desc: "Tier 2 creative bounties worth up to 1,200+ NCTR each" },
    { icon: Eye, title: "NCTR Sighting Bounty", desc: "Spot NCTR merch in the wild, earn 1,500 NCTR" },
    { icon: Star, title: "Silver Rewards", desc: "Better options in the Crescendo marketplace" },
  ],
  gold: [
    { icon: Film, title: "Campaign Bounties", desc: "Tier 3 bounties worth up to 3,000+ NCTR each" },
    { icon: Trophy, title: "Multi-Purchase Bonus", desc: "3,000 NCTR bonus for completing 3 merch bounties monthly" },
    { icon: Crown, title: "Gold Rewards", desc: "Premium marketplace access" },
  ],
  platinum: [
    { icon: Gem, title: "Premium Rewards", desc: "Exclusive experiences and opportunities" },
    { icon: Star, title: "Priority Contributor", desc: "Your contributed rewards get featured placement" },
    { icon: Zap, title: "1.5x Earning", desc: "50% more on everything" },
  ],
  diamond: [
    { icon: Crown, title: "Maximum Status", desc: "Every opportunity in Crescendo is yours" },
    { icon: Users, title: "Community Leader", desc: "Featured contributor, maximum influence" },
    { icon: TrendingUp, title: "2x Earning", desc: "Double rewards on every action" },
  ],
};

export function LevelUpCelebration({
  isOpen,
  onClose,
  previousTier,
  newTier,
  newMultiplier,
  previousMultiplier,
  totalLockedNctr,
  nextTierThreshold,
  nextTierName,
  previousEmoji = "🥉",
  newEmoji = "🥈",
  nextEmoji,
}: LevelUpCelebrationProps) {
  const [phase, setPhase] = useState(0);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) { setPhase(0); return; }
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
    const t1 = setTimeout(() => setPhase(1), 2500);
    return () => clearTimeout(t1);
  }, [isOpen]);

  const unlocks = tierUnlocks[newTier.toLowerCase()] || [];
  const multIncrease = Math.round((newMultiplier - previousMultiplier) * 100);

  const handleShare = () => {
    const text = `Just reached ${newTier} status on Crescendo! ${newMultiplier}x earning multiplier on everything. #LiveAndEarn`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-page-bg/95">
      <div className="w-full max-w-md text-center space-y-6">
        <AnimatePresence mode="wait">
          {/* Phase 0: The Reveal */}
          {phase === 0 && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                className="text-8xl block"
              >
                {newEmoji}
              </motion.span>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-5xl font-black text-text-heading uppercase tracking-tight"
              >
                {newTier}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-text-body"
              >
                You've reached {newTier} status
              </motion.p>
            </motion.div>
          )}

          {/* Phase 1: Details */}
          {phase >= 1 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Multiplier upgrade */}
              <div>
                <p className="text-sm text-text-body-muted mb-1">Your earning multiplier:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg text-text-body-muted line-through">{previousMultiplier}x</span>
                  <span className="text-text-body-muted">→</span>
                  <span className="text-2xl font-bold text-accent-lime">{newMultiplier}x</span>
                </div>
                <p className="text-sm text-text-body mt-1">
                  You now earn {multIncrease}% more on every action.
                </p>
              </div>

              {/* Unlocks */}
              {unlocks.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-text-heading">Here's what just unlocked:</p>
                  {unlocks.map((u) => (
                    <div key={u.title} className="flex items-start gap-3 p-3 rounded-xl bg-card-bg border border-border-card text-left">
                      <u.icon className="w-5 h-5 text-accent-lime mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-text-heading">{u.title}</p>
                        <p className="text-xs text-text-body-muted">{u.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Next tier progress */}
              {nextTierName && nextTierThreshold && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-text-body-muted">
                    <span>{newEmoji} {newTier}</span>
                    <span>{nextEmoji} {nextTierName}: {Math.max(0, nextTierThreshold - totalLockedNctr).toLocaleString()} to go</span>
                  </div>
                  <div className="h-2 rounded-full bg-elevated-bg overflow-hidden">
                    <div className="h-full rounded-full bg-accent-lime" style={{ width: `${Math.min(100, (totalLockedNctr / nextTierThreshold) * 100)}%` }} />
                  </div>
                </div>
              )}

              {/* Share */}
              <button onClick={handleShare} className="flex items-center gap-2 mx-auto text-sm text-text-body-muted hover:text-text-heading transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                🎉 Share your achievement
              </button>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => { onClose(); navigate("/bounties"); }}
                  className="flex-1 bg-accent-lime text-black font-semibold hover:bg-accent-lime/90"
                >
                  See What's New →
                </Button>
                <Button
                  onClick={() => { onClose(); navigate("/dashboard"); }}
                  variant="outline"
                  className="flex-1 border-border-card text-text-heading"
                >
                  Back to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
