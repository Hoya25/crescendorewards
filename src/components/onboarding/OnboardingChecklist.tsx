import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronUp, ChevronDown, ExternalLink, Sparkles, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NCTRLogo } from "@/components/NCTRLogo";
import { useUserOnboarding } from "@/hooks/useUserOnboarding";
import { useNavigate } from "react-router-dom";

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const {
    checklistItems,
    completedCount,
    totalItems,
    progressPercent,
    totalPotentialNCTR,
    earnedNCTR,
    shouldShowChecklist,
    completeItem,
    dismissOnboarding,
    loading,
  } = useUserOnboarding();
  
  const [isExpanded, setIsExpanded] = useState(true);

  if (loading || !shouldShowChecklist) {
    return null;
  }

  const handleItemClick = async (item: typeof checklistItems[0]) => {
    if (item.completed) return;

    // For How It Works, mark complete immediately when clicking
    if (item.id === 'how_it_works_viewed') {
      await completeItem('how_it_works_viewed');
    }

    // Navigate or open external link
    if (item.externalUrl) {
      // Mark garden as visited when they click
      if (item.id === 'garden_visited') {
        await completeItem('garden_visited');
      }
      window.open(item.externalUrl, '_blank');
    } else if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Get Started
                <Badge variant="secondary" className="text-xs">
                  +{totalPotentialNCTR - earnedNCTR} NCTR available
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalItems} complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dismissOnboarding()}
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2 mt-3" />
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2">
                {checklistItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleItemClick(item)}
                    disabled={item.completed}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      item.completed
                        ? "bg-muted/30 cursor-default"
                        : "hover:bg-muted/50 cursor-pointer"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        item.completed
                          ? "bg-primary text-primary-foreground"
                          : "border-2 border-muted-foreground/30"
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          item.completed ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>

                    {/* NCTR Reward */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.completed ? (
                        <span className="text-xs text-muted-foreground">Earned</span>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-primary">+{item.nctrReward}</span>
                          <NCTRLogo size="sm" />
                        </>
                      )}
                      {item.externalUrl && !item.completed && (
                        <ExternalLink className="w-3 h-3 text-muted-foreground ml-1" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Total potential */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Complete all to earn
                </span>
                <span className="text-sm font-bold flex items-center gap-1">
                  +{totalPotentialNCTR} <NCTRLogo />
                </span>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
