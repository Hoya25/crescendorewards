import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Gift, Coins, Users, Store, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation, useNavigate } from "react-router-dom";

const ONBOARDING_KEY = "crescendo_onboarding_progress";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  completed: boolean;
}

const initialSteps: OnboardingStep[] = [
  {
    id: "rewards",
    title: "Explore Rewards",
    description: "Browse the rewards marketplace",
    icon: Gift,
    route: "/rewards",
    completed: false,
  },
  {
    id: "earn",
    title: "Discover Earning",
    description: "Learn how to earn NCTR",
    icon: Coins,
    route: "/earn",
    completed: false,
  },
  {
    id: "brands",
    title: "Meet Partners",
    description: "Check out brand partners",
    icon: Store,
    route: "/brands",
    completed: false,
  },
  {
    id: "membership",
    title: "View Membership",
    description: "See your membership level",
    icon: Users,
    route: "/membership",
    completed: false,
  },
];

export const OnboardingProgress = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>(initialSteps);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ONBOARDING_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.dismissed) {
        setIsDismissed(true);
        return;
      }
      if (parsed.steps) {
        setSteps(prev => prev.map(step => ({
          ...step,
          completed: parsed.steps[step.id] || false,
        })));
      }
    }
  }, []);

  // Track route changes and mark steps as completed
  useEffect(() => {
    const currentPath = location.pathname;
    const matchingStep = steps.find(step => currentPath.startsWith(step.route));
    
    if (matchingStep && !matchingStep.completed) {
      setSteps(prev => {
        const updated = prev.map(step => 
          step.id === matchingStep.id ? { ...step, completed: true } : step
        );
        
        // Save to localStorage
        const stepsProgress = updated.reduce((acc, step) => ({
          ...acc,
          [step.id]: step.completed,
        }), {});
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ steps: stepsProgress }));
        
        return updated;
      });
    }
  }, [location.pathname]);

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;
  const allCompleted = completedCount === steps.length;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ dismissed: true }));
  };

  const handleStepClick = (route: string) => {
    navigate(route);
  };

  // Don't show if dismissed or all completed
  if (isDismissed || allCompleted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-72 sm:w-80"
      >
        <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div 
            className="p-4 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border-b border-border cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Getting Started</h3>
                  <p className="text-xs text-muted-foreground">{completedCount} of {steps.length} complete</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          {/* Steps List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.button
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleStepClick(step.route)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                          step.completed 
                            ? "bg-muted/30" 
                            : "hover:bg-muted/50 cursor-pointer"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          step.completed 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {step.completed ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            step.completed ? "text-muted-foreground line-through" : "text-foreground"
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {step.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
