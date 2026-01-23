import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openUserbackWidget } from "@/lib/userback";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FeedbackButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={openUserbackWidget}
            size="icon"
            className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground md:bottom-6"
            aria-label="Send feedback"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Send Feedback</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
