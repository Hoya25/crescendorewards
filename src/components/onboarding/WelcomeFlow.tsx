import { useState, useEffect } from "react";
import { ShoppingBag, Shirt, Camera, Users, Gift, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WelcomeFlowProps {
  isOpen: boolean;
  onClose: () => void;
  claimsBalance?: number;
}

const ONBOARDED_KEY = "crescendo_onboarding_complete";

const earningWays = [
  { icon: ShoppingBag, emoji: "🛍️", title: "Shop The Garden", desc: "6,000+ brands. Same prices. You earn NCTR." },
  { icon: Shirt, emoji: "👕", title: "Rep the Brand", desc: "Buy NCTR merch. Unlock content bounties. Earn 3x." },
  { icon: Camera, emoji: "📸", title: "Complete Bounties", desc: "Create content, refer friends, hit milestones. Get paid in NCTR." },
  { icon: Users, emoji: "🤝", title: "Invite Friends", desc: "They join, you both earn." },
  { icon: Gift, emoji: "🎁", title: "Contribute Rewards", desc: "List a reward. Earn when others claim it." },
];

const tiers = [
  { emoji: "🥉", name: "Bronze", mult: "1x", desc: "Just getting started" },
  { emoji: "🥈", name: "Silver", mult: "1.1x", desc: "Unlocks Tier 2 bounties + better rewards" },
  { emoji: "🥇", name: "Gold", mult: "1.25x", desc: "Unlocks campaign bounties worth up to 3,000 NCTR" },
  { emoji: "💎", name: "Platinum", mult: "1.5x", desc: "Premium access + exclusive experiences" },
  { emoji: "👑", name: "Diamond", mult: "2x", desc: "Top tier. Double earnings. Community leader." },
];

const paths = [
  { emoji: "🛍️", label: "Shop The Garden", route: "/rewards" },
  { emoji: "👕", label: "Browse NCTR Merch", route: "https://nctr-merch.myshopify.com" },
  { emoji: "📸", label: "See Available Bounties", route: "/bounties" },
];

export function WelcomeFlow({ isOpen, onClose }: WelcomeFlowProps) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [nctrTotal, setNctrTotal] = useState(25); // signup bonus already counted
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();

  const totalSteps = 4;

  const handleSkip = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    onClose();
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleNameSubmit = async () => {
    if (!displayName.trim() || !profile?.id) return;
    try {
      await supabase
        .from("unified_profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", profile.id);
      setNameSubmitted(true);
      setNctrTotal(35);
    } catch (e) {
      console.error("Failed to update name:", e);
    }
  };

  const handleComplete = async () => {
    localStorage.setItem(ONBOARDED_KEY, "true");

    // Award bonuses (best effort)
    if (profile?.id) {
      try {
        await supabase.from("nctr_transactions").insert([
          { user_id: profile.id, source: "signup_bonus", base_amount: 25, status_multiplier: 1, merch_lock_multiplier: 1, final_amount: 25, notes: "Welcome to Crescendo", lock_type: "360lock" },
          { user_id: profile.id, source: "profile_completion", base_amount: 10, status_multiplier: 1, merch_lock_multiplier: 1, final_amount: 10, notes: "Profile completed during onboarding", lock_type: "360lock" },
        ]);
        await supabase
          .from("unified_profiles")
          .update({ has_completed_onboarding: true, signup_bonus_awarded: true })
          .eq("id", profile.id);
        refreshUnifiedProfile();
      } catch (e) {
        console.error("Failed to record onboarding bonuses:", e);
      }
    }

    toast.success("🎉 You earned 35 NCTR! Welcome to Crescendo.");
    onClose();

    const chosen = selectedPath !== null ? paths[selectedPath] : null;
    if (chosen) {
      if (chosen.route.startsWith("http")) {
        navigate("/dashboard");
      } else {
        navigate(chosen.route);
      }
    }
  };

  if (!isOpen) return null;

  const canComplete = nameSubmitted && selectedPath !== null;

  return (
    <div className="fixed inset-0 z-50 bg-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center text-center"
          >
            {/* SCREEN 1 */}
            {step === 0 && (
              <div className="space-y-6">
                <p className="text-xs tracking-widest text-text-body-muted uppercase">NCTR Alliance</p>
                <h1 className="text-4xl font-bold text-text-heading">Welcome to Crescendo</h1>
                <p className="text-text-body">The rewards program that pays you to participate.</p>
                <p className="text-sm text-text-body-muted max-w-sm mx-auto">
                  Most rewards programs reward spending. Crescendo rewards contribution. The more you participate and commit, the more you earn.
                </p>
                <Button onClick={handleNext} className="w-full max-w-xs mx-auto bg-accent-lime text-black font-semibold hover:bg-accent-lime/90">
                  How It Works <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button onClick={handleSkip} className="text-sm text-text-body-muted hover:text-text-body transition-colors">Skip</button>
              </div>
            )}

            {/* SCREEN 2 */}
            {step === 1 && (
              <div className="space-y-6 w-full">
                <h1 className="text-3xl font-bold text-text-heading">Earn NCTR Your Way</h1>
                <p className="text-text-body">Five ways to earn — pick what fits your life.</p>
                <div className="space-y-3 text-left">
                  {earningWays.map((way) => (
                    <div key={way.title} className="flex items-start gap-3">
                      <way.icon className="w-5 h-5 text-accent-lime mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-sm text-text-heading">{way.title}</span>
                        <span className="text-sm text-text-body"> — {way.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleNext} className="w-full max-w-xs mx-auto bg-accent-lime text-black font-semibold hover:bg-accent-lime/90">
                  What Do I Do With NCTR? <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button onClick={handleSkip} className="text-sm text-text-body-muted hover:text-text-body transition-colors">Skip</button>
              </div>
            )}

            {/* SCREEN 3 */}
            {step === 2 && (
              <div className="space-y-6 w-full">
                <h1 className="text-3xl font-bold text-text-heading">Commit More, Unlock More</h1>
                <p className="text-text-body">Your NCTR is always yours. Locking it is a commitment, not a cost.</p>
                <div className="space-y-2 text-left">
                  {tiers.map((t) => (
                    <div key={t.name} className="flex items-center gap-3 py-2">
                      <span className="text-xl">{t.emoji}</span>
                      <div className="flex-1">
                        <span className="font-semibold text-sm text-text-heading">{t.name}</span>
                        <span className="text-sm text-accent-lime ml-2">({t.mult})</span>
                        <span className="text-sm text-text-body"> — {t.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg p-4 bg-accent-lime/5 border border-accent-lime/20">
                  <p className="text-sm text-text-body">
                    <span className="font-semibold text-text-heading">The secret:</span> Choose 360LOCK on merch purchases and your rewards are multiplied 3x — on top of your status multiplier. Higher status literally makes everything worth more.
                  </p>
                </div>
                <Button onClick={handleNext} className="w-full max-w-xs mx-auto bg-accent-lime text-black font-semibold hover:bg-accent-lime/90">
                  Let's Earn Your First NCTR <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button onClick={handleSkip} className="text-sm text-text-body-muted hover:text-text-body transition-colors">Skip</button>
              </div>
            )}

            {/* SCREEN 4 */}
            {step === 3 && (
              <div className="space-y-6 w-full">
                <h1 className="text-3xl font-bold text-text-heading">Let's make it official.</h1>
                <p className="text-text-body">Complete your profile and earn your first NCTR right now.</p>

                {/* Checklist */}
                <div className="space-y-3 text-left">
                  {/* Auto-completed: Signup */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card-bg border border-border-card"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent-lime flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-sm text-text-heading line-through opacity-70">Signed up for Crescendo</span>
                    <span className="ml-auto text-sm font-semibold text-accent-lime">+25 NCTR</span>
                  </motion.div>

                  {/* Display name */}
                  <div className="p-3 rounded-lg bg-card-bg border border-border-card">
                    <div className="flex items-center gap-3">
                      {nameSubmitted ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-accent-lime flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-black" />
                        </motion.div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-border-card shrink-0" />
                      )}
                      <span className={cn("text-sm text-text-heading", nameSubmitted && "line-through opacity-70")}>
                        Add your display name
                      </span>
                      <span className="ml-auto text-sm font-semibold text-accent-lime">+10 NCTR</span>
                    </div>
                    {!nameSubmitted && (
                      <div className="flex gap-2 mt-3">
                        <Input
                          placeholder="Your display name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                          className="text-sm bg-page-bg border-border-card"
                        />
                        <Button size="sm" onClick={handleNameSubmit} disabled={!displayName.trim()} className="bg-accent-lime text-black hover:bg-accent-lime/90">
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Choose path */}
                  <div className="p-3 rounded-lg bg-card-bg border border-border-card">
                    <div className="flex items-center gap-3 mb-3">
                      {selectedPath !== null ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-accent-lime flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-black" />
                        </motion.div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-border-card shrink-0" />
                      )}
                      <span className="text-sm text-text-heading">Choose your first earning path</span>
                    </div>
                    <div className="grid gap-2">
                      {paths.map((p, i) => (
                        <button
                          key={p.label}
                          onClick={() => setSelectedPath(i)}
                          className={cn(
                            "text-left text-sm px-3 py-2 rounded-lg border transition-all",
                            selectedPath === i
                              ? "border-accent-lime bg-accent-lime/10 text-text-heading"
                              : "border-border-card bg-page-bg text-text-body hover:border-accent-lime/30"
                          )}
                        >
                          {p.emoji} {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Running total */}
                <div className="text-center">
                  <p className="text-sm text-text-body">
                    Your NCTR: <motion.span key={nctrTotal} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-lg font-bold text-accent-lime">{nctrTotal}</motion.span>
                  </p>
                  <p className="text-xs text-text-body-muted mt-1">This NCTR is yours. After onboarding you'll choose how to lock it.</p>
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={!canComplete}
                  className="w-full max-w-xs mx-auto bg-accent-lime text-black font-semibold hover:bg-accent-lime/90 disabled:opacity-40"
                >
                  Enter Crescendo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === step ? "bg-accent-lime w-6" : i < step ? "bg-accent-lime/60" : "bg-text-body-muted/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function hasBeenOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === "true";
}
