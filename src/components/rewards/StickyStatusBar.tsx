import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { getNextMembershipTier, getMembershipProgress, getNCTRNeededForNextLevel } from "@/utils/membershipLevels";

/**
 * Sticky status bar shown at the top of the Rewards page.
 * Displays current tier, progress to next, and a Level Up link.
 */
export function StickyStatusBar() {
  const navigate = useNavigate();
  const { tier, total360Locked } = useUnifiedUser();

  const nextTierData = getNextMembershipTier(total360Locked);
  const progressPercent = getMembershipProgress(total360Locked);
  const nctrNeeded = getNCTRNeededForNextLevel(total360Locked);

  return (
    <div className="sticky top-[57px] md:top-[65px] z-20 bg-background/95 backdrop-blur border-b">
      <div className="container mx-auto px-4 py-2.5 max-w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">{tier?.badge_emoji || '💧'}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: tier?.badge_color }}>
                {tier?.display_name || 'Member'}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Level {tier?.sort_order || 0}
              </Badge>
            </div>
          </div>

          {nextTierData ? (
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <div className="flex-1">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>{nctrNeeded.toLocaleString()} pts to {nextTierData.name}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/membership')}
                className="text-xs gap-1 shrink-0 h-7"
              >
                Level Up <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
              Max Level ✨
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
