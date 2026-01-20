import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gift, Sparkles, TrendingUp, Check } from "lucide-react";
import { ReactNode } from "react";

interface ClaimConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rewardTitle: string;
  isLoading?: boolean;
  // Status-based pricing info
  userTierEmoji: string;
  userTierName: string;
  userTierColor: string;
  userPrice: number;
  originalPrice: number;
  isFree: boolean;
  discount: number;
  // Balance info
  currentBalance: number;
}

export function ClaimConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  rewardTitle,
  isLoading = false,
  userTierEmoji,
  userTierName,
  userTierColor,
  userPrice,
  originalPrice,
  isFree,
  discount,
  currentBalance,
}: ClaimConfirmationDialogProps) {
  const savings = originalPrice - userPrice;
  const newBalance = currentBalance - userPrice;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Confirm Claim
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            You're about to claim <span className="font-medium text-foreground">"{rewardTitle}"</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Status-based pricing breakdown */}
        <div className="space-y-4 py-2">
          {/* Your status */}
          <div 
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ backgroundColor: `${userTierColor}10` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{userTierEmoji}</span>
              <div>
                <p className="text-sm font-medium">Your Status</p>
                <p className="text-xs text-muted-foreground" style={{ color: userTierColor }}>
                  {userTierName}
                </p>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="gap-1"
              style={{ 
                backgroundColor: `${userTierColor}20`,
                color: userTierColor 
              }}
            >
              <Check className="w-3 h-3" />
              Active
            </Badge>
          </div>

          <Separator />

          {/* Your price */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Price:</span>
              {isFree ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-xl font-bold text-emerald-500">FREE</span>
                </div>
              ) : (
                <span className="text-xl font-bold">{userPrice} Claims</span>
              )}
            </div>

            {discount > 0 && !isFree && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Standard Price:</span>
                <span className="text-muted-foreground line-through">{originalPrice} Claims</span>
              </div>
            )}

            {savings > 0 && (
              <div 
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: `${userTierColor}10` }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: userTierColor }} />
                  <span className="text-sm font-medium">Status Savings</span>
                </div>
                <span className="font-bold" style={{ color: userTierColor }}>
                  {isFree ? `${originalPrice} Claims` : `${savings} Claims (${discount}% off)`}
                </span>
              </div>
            )}
          </div>

          {!isFree && (
            <>
              <Separator />
              
              {/* Balance breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span>{currentBalance} Claims</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">After Claim:</span>
                  <span className="font-medium">{newBalance} Claims</span>
                </div>
              </div>
            </>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            Go Back
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
            style={{ 
              backgroundColor: userTierColor,
            }}
          >
            {isLoading ? (
              "Processing..."
            ) : isFree ? (
              <>
                <Sparkles className="w-4 h-4" />
                Claim for Free
              </>
            ) : (
              `Claim for ${userPrice} Claims`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
