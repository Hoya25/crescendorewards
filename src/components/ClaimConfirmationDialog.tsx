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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Gift, Sparkles, TrendingUp, Check, Mail, Wallet, Truck, 
  Calendar, Code, ExternalLink, Copy, PartyPopper, CheckCircle2, UserPlus
} from "lucide-react";
import { useState } from "react";
import type { DeliveryMethod } from "@/types/delivery";
import { DELIVERY_METHOD_LABELS } from "@/types/delivery";
import { InvitePromptCard } from "@/components/referral/InvitePromptCard";

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
  // Delivery info
  deliveryMethod?: DeliveryMethod | null;
  // Success state
  showSuccess?: boolean;
  claimCode?: string | null;
  onViewClaims?: () => void;
}

// Helper to get delivery-specific success content
function getDeliverySuccessContent(method: DeliveryMethod | null | undefined): {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
} {
  switch (method) {
    case 'instant_code':
      return {
        icon: <Code className="w-8 h-8 text-emerald-500" />,
        title: "Your Code is Ready!",
        description: "Your reward code is displayed below. Copy it now or find it in your claims history.",
        action: "Copy Code"
      };
    case 'email':
      return {
        icon: <Mail className="w-8 h-8 text-blue-500" />,
        title: "Check Your Email!",
        description: "We've sent your reward details to your email address. Check your inbox (and spam folder) shortly.",
      };
    case 'wallet_transfer':
      return {
        icon: <Wallet className="w-8 h-8 text-purple-500" />,
        title: "Sent to Your Wallet!",
        description: "Your reward has been initiated to your wallet address. It may take a few minutes to appear.",
      };
    case 'shipping':
      return {
        icon: <Truck className="w-8 h-8 text-orange-500" />,
        title: "Order Confirmed!",
        description: "Your order is being prepared for shipping. You'll receive tracking information via email soon.",
      };
    case 'platform_delivery':
      return {
        icon: <ExternalLink className="w-8 h-8 text-cyan-500" />,
        title: "Delivered to Your Account!",
        description: "Your reward has been sent to your connected account. Check the platform to access it.",
      };
    case 'scheduling':
      return {
        icon: <Calendar className="w-8 h-8 text-amber-500" />,
        title: "Almost There!",
        description: "You'll receive an email shortly with a link to schedule your experience.",
      };
    case 'manual':
      return {
        icon: <CheckCircle2 className="w-8 h-8 text-teal-500" />,
        title: "Claim Received!",
        description: "Our team has received your claim and will process it within 24-48 hours. We'll contact you via email.",
      };
    default:
      return {
        icon: <Gift className="w-8 h-8 text-primary" />,
        title: "Claim Successful!",
        description: "Your reward has been claimed. Check your email for further details.",
      };
  }
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
  deliveryMethod,
  showSuccess = false,
  claimCode,
  onViewClaims,
}: ClaimConfirmationDialogProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const savings = originalPrice - userPrice;
  const newBalance = currentBalance - userPrice;
  
  const successContent = getDeliverySuccessContent(deliveryMethod);

  const handleCopyCode = async () => {
    if (claimCode) {
      await navigator.clipboard.writeText(claimCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Success State
  if (showSuccess) {
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-6 space-y-4">
            {/* Confetti/Celebration */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-primary/20 to-amber-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center gap-2">
                <PartyPopper className="w-6 h-6 text-amber-500 animate-bounce" />
                {successContent.icon}
                <PartyPopper className="w-6 h-6 text-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{successContent.title}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {successContent.description}
              </p>
            </div>

            {/* Reward Title */}
            <Badge variant="secondary" className="text-base py-2 px-4">
              <Gift className="w-4 h-4 mr-2" />
              {rewardTitle}
            </Badge>

            {/* Code Display for instant_code */}
            {deliveryMethod === 'instant_code' && claimCode && (
              <div className="w-full mt-4 p-4 bg-muted/50 rounded-xl border-2 border-dashed border-primary/30">
                <p className="text-xs text-muted-foreground mb-2">Your Reward Code</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xl font-mono font-bold tracking-widest">
                    {claimCode}
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCopyCode}
                    className="h-8 w-8 p-0"
                  >
                    {codeCopied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Delivery Method Info */}
            {deliveryMethod && DELIVERY_METHOD_LABELS[deliveryMethod] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Delivery:</span>
                <Badge variant="outline" className="font-normal">
                  {DELIVERY_METHOD_LABELS[deliveryMethod].label}
                </Badge>
              </div>
            )}

            {/* Balance Update */}
            {!isFree && (
              <div className="w-full p-3 bg-muted/30 rounded-lg flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Balance:</span>
                <span className="font-bold">{newBalance} Claims</span>
              </div>
            )}

            {/* Invite Friends CTA */}
            <div className="w-full mt-2">
              <InvitePromptCard variant="after-claim" />
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            {onViewClaims && (
              <Button variant="outline" onClick={onViewClaims} className="w-full sm:w-auto">
                View My Claims
              </Button>
            )}
            <AlertDialogAction onClick={onClose} className="w-full sm:w-auto">
              Continue Browsing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Confirmation State (existing)
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

          {/* Delivery Method Preview */}
          {deliveryMethod && DELIVERY_METHOD_LABELS[deliveryMethod] && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery:</span>
                <Badge variant="outline" className="font-normal">
                  {DELIVERY_METHOD_LABELS[deliveryMethod].label}
                </Badge>
              </div>
            </>
          )}

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