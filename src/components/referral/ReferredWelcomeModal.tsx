import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { 
  Trophy, User, Sparkles, Gift, MessageSquare, ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReferredWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  referrerName?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const BETA_BENEFITS = [
  { icon: Trophy, text: "You're starting at Bronze status" },
  { icon: User, text: 'Complete your profile to earn bonus NCTR' },
  { icon: Gift, text: 'Check "Earn" for Beta-exclusive opportunities' },
  { icon: MessageSquare, text: 'Your feedback helps shape the platform' },
];

export function ReferredWelcomeModal({ 
  isOpen, 
  onClose, 
  userName, 
  referrerName 
}: ReferredWelcomeModalProps) {
  const navigate = useNavigate();
  const firstName = userName.split(' ')[0];

  const handleStartEarning = () => {
    onClose();
    navigate('/earn');
  };

  const handleBrowseRewards = () => {
    onClose();
    navigate('/rewards');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div 
              className="p-6 sm:p-8 flex flex-col items-center text-center"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Celebration Icon */}
              <motion.div 
                className="mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🎉</span>
                </div>
              </motion.div>

              {/* Logo */}
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CrescendoLogo />
              </motion.div>

              {/* Title */}
              <motion.h2 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Welcome to Crescendo, {firstName}!
              </motion.h2>

              {/* Referrer Context */}
              {referrerName && (
                <motion.p 
                  className="text-muted-foreground mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  You joined through {referrerName}'s invitation.
                </motion.p>
              )}

              {/* Beta Benefits */}
              <motion.div
                className="w-full mb-6"
                variants={containerVariants}
              >
                <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">
                  Your Beta Tester Benefits
                </p>
                <div className="space-y-2">
                  {BETA_BENEFITS.map((benefit, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                className="w-full space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  onClick={handleStartEarning} 
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Earning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  onClick={handleBrowseRewards}
                  variant="outline"
                  className="w-full"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Browse Rewards First
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
