import { useState } from "react";
import { Lock, Gift, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Lock,
    title: "Commit NCTR to Level Up",
    description: "The more NCTR you commit to 360LOCK, the higher your status level and the better your rewards multiplier.",
  },
  {
    icon: Gift,
    title: "Claim Exclusive Rewards",
    description: "Use your claim passes to redeem member-curated rewards—from gift cards to VIP experiences.",
  },
  {
    icon: Users,
    title: "Refer Friends, Earn Together",
    description: "Share your referral code and earn bonus NCTR when friends join.",
  },
];

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onClose();
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon with gradient background */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
            <IconComponent className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3">{currentStepData.title}</h2>

          {/* Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Step indicators */}
          <div className="flex gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full">
            {isLastStep ? (
              <Button onClick={handleComplete} className="w-full">
                Get Started
              </Button>
            ) : (
              <Button onClick={handleNext} className="w-full">
                Next
              </Button>
            )}
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
