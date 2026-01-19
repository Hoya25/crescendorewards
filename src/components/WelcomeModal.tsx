import { Search, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay: 0.6,
      duration: 0.3,
    },
  },
};

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const handleComplete = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div 
              className="p-8 flex flex-col items-center text-center"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Logo */}
              <motion.div 
                className="mb-6"
                variants={headerVariants}
              >
                <CrescendoLogo />
              </motion.div>

              {/* Title */}
              <motion.h2 
                className="text-2xl font-bold mb-2"
                variants={headerVariants}
              >
                Welcome to Crescendo
              </motion.h2>

              {/* Subtitle */}
              <motion.p 
                className="text-muted-foreground mb-8"
                variants={headerVariants}
              >
                The rewards marketplace built by members, owned by members
              </motion.p>

              {/* Steps */}
              <motion.div 
                className="w-full space-y-4 mb-8"
                variants={containerVariants}
              >
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <motion.div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg"
                        whileHover={{ 
                          rotate: [0, -10, 10, 0],
                          transition: { duration: 0.4 },
                        }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Button */}
              <motion.div 
                className="w-full"
                variants={buttonVariants}
              >
                <Button 
                  onClick={handleComplete} 
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  size="lg"
                >
                  Start Exploring
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
