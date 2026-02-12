import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface EarningConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lockType: "90lock" | "360lock") => void;
  base_amount: number;
  source_type: string;
  source_name: string;
  requires_360lock: boolean;
  lock_multiplier?: number;
  status_multiplier: number;
  user_tier: string;
  user_tier_emoji?: string;
  current_locked: number;
  next_tier_name?: string;
  next_tier_threshold?: number;
  next_tier_emoji?: string;
}

const EARNING_SEEN_KEY = "crescendo_earning_seen";

export function EarningConfirmation({
  isOpen,
  onClose,
  onConfirm,
  base_amount,
  source_name,
  requires_360lock,
  lock_multiplier = 3,
  status_multiplier,
  user_tier,
  user_tier_emoji = "🥉",
  current_locked,
  next_tier_name,
  next_tier_threshold,
  next_tier_emoji,
}: EarningConfirmationProps) {
  const [selectedLock, setSelectedLock] = useState<"90lock" | "360lock">("360lock");
  const [confirmed, setConfirmed] = useState(false);
  const [showFirstTime, setShowFirstTime] = useState(false);

  useEffect(() => {
    if (isOpen && !localStorage.getItem(EARNING_SEEN_KEY)) {
      setShowFirstTime(true);
    }
  }, [isOpen]);

  const dismissFirstTime = () => {
    localStorage.setItem(EARNING_SEEN_KEY, "true");
    setShowFirstTime(false);
  };

  const statusAmount = Math.round(base_amount * status_multiplier);
  const finalAmount = requires_360lock
    ? Math.round(base_amount * status_multiplier * lock_multiplier)
    : statusAmount;

  const newLocked = current_locked + finalAmount;
  const progressToNext = next_tier_threshold
    ? Math.min(100, (newLocked / next_tier_threshold) * 100)
    : 100;
  const triggersLevelUp = next_tier_threshold ? newLocked >= next_tier_threshold : false;

  const handleConfirm = () => {
    setConfirmed(true);
    if (requires_360lock || selectedLock === "360lock") {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
    onConfirm(requires_360lock ? "360lock" : selectedLock);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-card-bg border border-border-card p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-body-muted hover:text-text-heading">
          <X className="w-4 h-4" />
        </button>

        {/* First-time callout */}
        {showFirstTime && (
          <div className="mb-4 p-3 rounded-lg bg-accent-lime/10 border border-accent-lime/20">
            <p className="text-sm text-text-body">
              <Star className="w-4 h-4 inline text-accent-lime mr-1" />
              <span className="font-semibold">First time earning?</span> Your Crescendo status gives you an automatic earning multiplier. The higher your tier, the more everything is worth.
            </p>
            <button onClick={dismissFirstTime} className="text-xs text-accent-lime mt-2 font-semibold">Got it</button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-xl font-bold text-text-heading">You earned NCTR!</p>
          <p className="text-sm text-text-body-muted">{source_name}</p>
        </div>

        {/* Math breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-body-muted">Base reward:</span>
            <span className="text-text-body-muted">{base_amount} NCTR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-body">Your status ({user_tier} {status_multiplier}x):</span>
            <span className="text-text-heading">×{status_multiplier}</span>
          </div>
          {requires_360lock && (
            <div className="flex justify-between text-sm">
              <span className="text-text-body">360LOCK bonus:</span>
              <span className="text-accent-lime font-bold">×{lock_multiplier}</span>
            </div>
          )}
          <div className="border-t border-border-card my-2" />
          <div className="flex justify-between">
            <span className="text-sm text-text-body">{requires_360lock ? "Total earned:" : "You earned:"}</span>
            <span className="text-2xl font-bold text-accent-lime">{finalAmount} NCTR</span>
          </div>
          {requires_360lock && (
            <p className="text-xs text-text-body-muted text-right">
              {base_amount} × {status_multiplier} × {lock_multiplier} = {finalAmount} NCTR
            </p>
          )}
          {status_multiplier === 1 && (
            <p className="text-xs text-accent-lime">
              Reach Silver for 1.25x on everything →
            </p>
          )}
        </div>

        {/* Lock choice for non-merch */}
        {!requires_360lock && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setSelectedLock("90lock")}
              className={cn(
                "rounded-xl p-4 border text-left transition-all",
                selectedLock === "90lock"
                  ? "border-border-card bg-elevated-bg"
                  : "border-border-card bg-card-bg opacity-60"
              )}
            >
              <p className="font-semibold text-sm text-text-heading">90LOCK</p>
              <p className="text-xs text-text-body-muted">Locked for 90 days</p>
              <p className="text-sm font-semibold text-text-heading mt-2">{statusAmount} NCTR</p>
            </button>
            <button
              onClick={() => setSelectedLock("360lock")}
              className={cn(
                "rounded-xl p-4 border-2 text-left transition-all",
                selectedLock === "360lock"
                  ? "border-accent-lime bg-accent-lime/5"
                  : "border-border-card bg-card-bg opacity-60"
              )}
            >
              <p className="font-semibold text-sm text-accent-lime">360LOCK ★ RECOMMENDED</p>
              <p className="text-xs text-text-body-muted">Locked for 360 days</p>
              <p className="text-sm font-semibold text-text-heading mt-2">{statusAmount} NCTR</p>
              <p className="text-xs text-accent-lime mt-1">Builds status faster → higher multiplier</p>
            </button>
          </div>
        )}

        {!requires_360lock && (
          <p className="text-xs text-text-body-muted mb-4">
            Both options give you the same NCTR. 360LOCK counts more toward your Crescendo status — higher status means a higher multiplier on everything you earn.
          </p>
        )}

        {/* Status impact */}
        {next_tier_name && next_tier_threshold && (
          <div className="mb-4 space-y-1">
            <p className="text-xs text-text-body-muted">
              Your locked NCTR: {current_locked.toLocaleString()} → {newLocked.toLocaleString()}
            </p>
            <div className="h-2 rounded-full bg-elevated-bg overflow-hidden">
              <div className="h-full rounded-full bg-accent-lime transition-all" style={{ width: `${progressToNext}%` }} />
            </div>
            {triggersLevelUp ? (
              <p className="text-sm font-semibold text-accent-lime">
                🎉 This puts you at {next_tier_name}!
              </p>
            ) : (
              <p className="text-xs text-text-body-muted">
                {next_tier_emoji} {Math.max(0, next_tier_threshold - newLocked).toLocaleString()} more to {next_tier_name}
              </p>
            )}
          </div>
        )}

        {/* Confirm button */}
        <Button
          onClick={handleConfirm}
          className={cn(
            "w-full font-semibold",
            (requires_360lock || selectedLock === "360lock")
              ? "bg-accent-lime text-black hover:bg-accent-lime/90"
              : "bg-elevated-bg text-text-heading hover:bg-elevated-bg/80"
          )}
        >
          Lock {requires_360lock ? finalAmount : statusAmount} NCTR for {requires_360lock || selectedLock === "360lock" ? "360" : "90"} Days
        </Button>
      </motion.div>
    </div>
  );
}
