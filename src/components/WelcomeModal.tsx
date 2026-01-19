import { Search, Lock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CrescendoLogo } from "./CrescendoLogo";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Search,
    title: "Browse",
    description: "Explore rewards from the community",
  },
  {
    icon: Lock,
    title: "Lock",
    description: "Commit NCTR to unlock access",
  },
  {
    icon: Sparkles,
    title: "Earn",
    description: "Get rewards, opportunities, experiences",
  },
];

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const handleComplete = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-6">
            <CrescendoLogo />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">Welcome to Crescendo</h2>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-8">
            The rewards marketplace built by members, owned by members
          </p>

          {/* Steps */}
          <div className="w-full space-y-4 mb-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Button */}
          <Button 
            onClick={handleComplete} 
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
            size="lg"
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
