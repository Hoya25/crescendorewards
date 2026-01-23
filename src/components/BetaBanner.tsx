import { useState, useEffect } from "react";
import { X, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openUserbackWidget } from "@/lib/userback";

const BETA_BANNER_DISMISSED_KEY = "crescendo_beta_banner_dismissed";

export function BetaBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    const dismissed = localStorage.getItem(BETA_BANNER_DISMISSED_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(BETA_BANNER_DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white px-4 py-2 relative">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <FlaskConical className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Beta</span>
        <span className="hidden sm:inline">—</span>
        <span className="hidden sm:inline">Help us improve!</span>
        <button
          onClick={openUserbackWidget}
          className="underline underline-offset-2 hover:no-underline font-medium"
        >
          Your feedback shapes the future
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white hover:text-white hover:bg-white/20"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}