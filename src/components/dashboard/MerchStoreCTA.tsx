import { ShoppingBag, Sparkles, ChevronRight } from "lucide-react";

export function MerchStoreCTA() {
  return (
    <a
      href="https://nctr-merch.myshopify.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl border-2 border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-4 hover:border-amber-500/40 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            Shop NCTR Merch
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </p>
          <p className="text-xs text-muted-foreground">
            Shop merch. Complete bounties. Earn 3x with 360LOCK.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </div>
    </a>
  );
}
