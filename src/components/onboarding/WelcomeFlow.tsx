import { useState } from "react";
import { Gift, ShoppingBag, UserPlus, Sparkles, ArrowRight, X, Check, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CrescendoLogo } from "../CrescendoLogo";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface WelcomeFlowProps {
  isOpen: boolean;
  onClose: () => void;
  claimsBalance?: number;
}

const ONBOARDED_KEY = "crescendo_onboarded";

const rewardImages = [
  { src: "/rewards/spotify-premium.jpg", alt: "Spotify Premium" },
  { src: "/rewards/netflix-premium.jpg", alt: "Netflix Premium" },
  { src: "/rewards/amazon-gift-card.jpg", alt: "Amazon Gift Card" },
  { src: "/rewards/discord-nitro.jpg", alt: "Discord Nitro" },
];

const earningSteps = [
  {
    icon: ShoppingBag,
    title: "Shop",
    description: "Earn from 6,000+ brands",
    color: "from-emerald-500 to-green-500",
  },
  {
    icon: UserPlus,
    title: "Invite",
    description: "Bring friends, earn together",
    color: "from-primary to-primary/80",
  },
  {
    icon: Sparkles,
    title: "Earn",
    description: "Every action builds your level",
    color: "from-amber-500 to-orange-500",
  },
];

export function WelcomeFlow({ isOpen, onClose, claimsBalance = 0 }: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = (destination?: string) => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    onClose();
    if (destination) {
      navigate(destination);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      localStorage.setItem(ONBOARDED_KEY, "true");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8 flex flex-col items-center text-center"
          >
            {/* Screen 1: Welcome */}
            {currentStep === 0 && (
              <>
                <CrescendoLogo className="mb-6" />
                <h2 className="text-2xl font-bold mb-2">Welcome to Crescendo! 🎉</h2>
                <p className="text-muted-foreground mb-6">
                  You're about to unlock rewards from brands you love.
                </p>
                
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                  {rewardImages.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="aspect-[4/3] rounded-xl overflow-hidden border shadow-sm"
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Let's Go
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {/* Screen 2: How You'll Earn */}
            {currentStep === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-2">How You'll Earn</h2>
                <p className="text-muted-foreground mb-6">
                  Every action builds your membership and unlocks better rewards.
                </p>
                
                <div className="w-full space-y-4 mb-8">
                  {earningSteps.map((step, index) => {
                    const IconComponent = step.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-lg",
                          step.color
                        )}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-foreground">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Got It
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {/* Screen 3: Claim Your First Points */}
            {currentStep === 2 && (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
                  <Gift className="w-10 h-10 text-primary" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">Claim Your First Points</h2>
                <p className="text-muted-foreground mb-6">
                  Complete your profile to earn 25 points instantly.
                </p>

                <div className="w-full space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Add your name & avatar</span>
                    <span className="ml-auto text-xs font-semibold text-primary">+10 pts</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    <Gift className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Add items to your wishlist</span>
                    <span className="ml-auto text-xs font-semibold text-primary">+10 pts</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Explore the marketplace</span>
                    <span className="ml-auto text-xs font-semibold text-primary">+5 pts</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Button 
                    onClick={() => handleComplete('/profile')} 
                    className="w-full" 
                    size="lg"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                  <Button 
                    onClick={() => handleComplete('/rewards')} 
                    variant="outline"
                    className="w-full" 
                    size="lg"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Browse Rewards First
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 pb-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep 
                  ? "bg-primary w-6" 
                  : index < currentStep 
                    ? "bg-primary/60" 
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to check if user has been onboarded
export function hasBeenOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === "true";
}
