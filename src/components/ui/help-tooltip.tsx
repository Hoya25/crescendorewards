import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
}

// Predefined help content for common terms
export const HELP_CONTENT = {
  nctr: "Your digital ownership stake. Earned through participation, not purchased.",
  "360lock": "Commit your NCTR for 360 days to unlock higher status tiers and better rewards.",
  statusTier: "Your tier determines your reward multiplier and how many rewards you can claim.",
  pendingNctr: "NCTR you've earned that hasn't been committed yet. Commit it via 360LOCK to increase your tier.",
  lockedNctr: "NCTR you've committed via 360LOCK. This determines your status tier.",
  claims: "Use claims to redeem rewards from the marketplace. Earn claims through participation or purchase packages.",
  multiplier: "Higher tiers earn more NCTR from the same actions. A 2x multiplier means you earn double.",
} as const;

export function HelpTooltip({ 
  content, 
  side = "top", 
  className,
  iconClassName 
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
            aria-label="Help"
          >
            <HelpCircle className={cn("w-3.5 h-3.5", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs text-sm"
          sideOffset={5}
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Convenience components for common terms
export function NCTRHelp({ className }: { className?: string }) {
  return <HelpTooltip content={HELP_CONTENT.nctr} className={className} />;
}

export function LockHelp({ className }: { className?: string }) {
  return <HelpTooltip content={HELP_CONTENT["360lock"]} className={className} />;
}

export function TierHelp({ className }: { className?: string }) {
  return <HelpTooltip content={HELP_CONTENT.statusTier} className={className} />;
}

export function PendingNCTRHelp({ className }: { className?: string }) {
  return <HelpTooltip content={HELP_CONTENT.pendingNctr} className={className} />;
}

export function LockedNCTRHelp({ className }: { className?: string }) {
  return <HelpTooltip content={HELP_CONTENT.lockedNctr} className={className} />;
}

export function ClaimsHelp({ className }: { className?: string }) {
  return <HelpTooltip content={HELP_CONTENT.claims} className={className} />;
}

export function MultiplierHelp({ className }: { className?: string }) {
  return <HelpTooltip content={HELP_CONTENT.multiplier} className={className} />;
}
