import { useState } from "react";
import { Gift, ShoppingCart, Sparkles, ArrowRight, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CrescendoLogo } from "../CrescendoLogo";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface WelcomeFlowProps {
  isOpen: boolean;
  onClose: () => void;
  claimsBalance?: number;
}

const ONBOARDED_KEY = "crescendo_onboarded";

const steps = [
  {
    id: 1,
    title: "Welcome to Crescendo! 🎉",
    subtitle: "The rewards marketplace where you earn, not spend",
    icon: null,
    content: null,
  },
  {
    id: 2,
    title: "Here's how it works:",
    subtitle: null,
    icon: null,
    content: [
      {
        icon: ShoppingCart,
        title: "1. Get Claims",
        description: "Purchase or earn free claim passes",
        color: "from-emerald-500 to-green-500",
      },
      {
        icon: Gift,
        title: "2. Browse Rewards",
        description: "Find subscriptions, experiences & more",
        color: "from-violet-500 to-purple-500",
      },
      {
        icon: Sparkles,
        title: "3. Claim It",
        description: "Unlock your reward instantly",
        color: "from-amber-500 to-orange-500",
      },
    ],
  },
  {
    id: 3,
    title: "You're ready!",
    subtitle: null,
    icon: Check,
    content: null,
  },
];

export function WelcomeFlow({ isOpen, onClose, claimsBalance = 0 }: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = (destination: string) => {
    // Always mark as onboarded when completing the flow
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

  // Handle dialog close from any source (overlay click, escape key, etc.)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Always persist onboarded state when closing
      localStorage.setItem(ONBOARDED_KEY, "true");
      onClose();
    }
  };

  const step = steps[currentStep];

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
            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <>
                <CrescendoLogo className="mb-6" />
                <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                <p className="text-muted-foreground mb-8">{step.subtitle}</p>
                
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-8">
                  <Gift className="w-12 h-12 text-primary" />
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {/* Step 2: How It Works */}
            {currentStep === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-6">{step.title}</h2>
                
                <div className="w-full space-y-4 mb-8">
                  {step.content?.map((item, index) => {
                    const IconComponent = item.icon;
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
                          item.color
                        )}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
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

            {/* Step 3: Get Started */}
            {currentStep === 2 && (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50 mb-6 w-full">
                  <p className="text-sm text-muted-foreground mb-1">Your current balance</p>
                  <p className="text-3xl font-bold">{claimsBalance} <span className="text-lg font-normal text-muted-foreground">Claims</span></p>
                </div>

                <div className="flex flex-col gap-3 w-full mb-6">
                  <Button 
                    onClick={() => handleComplete('/rewards')} 
                    className="w-full bg-gradient-to-r from-primary to-primary/80" 
                    size="lg"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Browse Rewards
                  </Button>
                  <Button 
                    onClick={() => handleComplete('/earn')} 
                    variant="outline"
                    className="w-full" 
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Free Claims
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="dont-show" 
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                  />
                  <label
                    htmlFor="dont-show"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Don't show this again
                  </label>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 pb-6">
          {steps.map((_, index) => (
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