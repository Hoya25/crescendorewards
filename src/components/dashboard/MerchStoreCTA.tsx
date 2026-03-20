import { ShoppingBag, Sparkles, ChevronRight } from "lucide-react";

export function MerchStoreCTA() {
  return (
    <a
      href="https://nctr-merch.myshopify.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full border-2 p-4 transition-all group"
      style={{ borderRadius: '0px', borderColor: 'rgba(196,153,26,0.2)', background: 'linear-gradient(to right, rgba(196,153,26,0.1), rgba(196,153,26,0.05), rgba(196,153,26,0.1))' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ borderRadius: '0px', backgroundColor: 'rgba(196,153,26,0.2)' }}>
          <ShoppingBag className="w-5 h-5" style={{ color: '#C4991A' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            Shop NCTR Merch
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#C4991A' }} />
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
