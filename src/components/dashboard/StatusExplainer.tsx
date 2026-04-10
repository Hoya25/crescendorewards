import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Info, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TIER_INFO = [
  {
    name: "Bronze",
    key: "bronze",
    emoji: "🥉",
    range: "1,000+ NCTR locked",
    mult: "1.0x",
    perks: "1 monthly claim · wellness rewards",
    color: "#CD7F32",
  },
  {
    name: "Silver",
    key: "silver",
    emoji: "🥈",
    range: "5,000+ NCTR locked",
    mult: "1.25x",
    perks: "5 monthly claims · early access · streams",
    color: "#C0C0C0",
  },
  {
    name: "Gold",
    key: "gold",
    emoji: "🥇",
    range: "15,000+ NCTR locked",
    mult: "1.5x",
    perks: "12 monthly claims · creator tools · merch",
    color: "#FFD700",
  },
  {
    name: "Platinum",
    key: "platinum",
    emoji: "💎",
    range: "40,000+ NCTR locked",
    mult: "1.8x",
    perks: "25 monthly claims · brand priority",
    color: "#E5E4E2",
  },
  {
    name: "Diamond",
    key: "diamond",
    emoji: "👑",
    range: "100,000+ NCTR locked",
    mult: "2.5x",
    perks: "50 monthly claims · governance · vault",
    color: "#B9F2FF",
  },
];

export function StatusExplainer() {
  const [open, setOpen] = useState(false);
  const { tier } = useUnifiedUser();
  const currentTierKey = tier?.tier_name?.toLowerCase() || "bronze";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
        <Info className="w-4 h-4" />
        <span>How Crescendo Status Works</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 ml-auto transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2 pb-4 space-y-4">
          {/* Tiers grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {TIER_INFO.map((t) => {
              const isCurrent = t.key === currentTierKey;
              const currentIdx = TIER_INFO.findIndex((x) => x.key === currentTierKey);
              const thisIdx = TIER_INFO.findIndex((x) => x.key === t.key);
              const isNext = thisIdx === currentIdx + 1;

              return (
                <div
                  key={t.key}
                  className={cn(
                    "rounded-lg p-3 text-center border transition-all",
                    isCurrent
                      ? "border-cta/50 bg-cta/10 ring-1 ring-cta/30"
                      : isNext
                      ? "border-dashed border-muted-foreground/30 bg-muted/20"
                      : "border-transparent bg-muted/30"
                  )}
                >
                  <span className="text-2xl block">{t.emoji}</span>
                  <p
                    className="text-sm font-semibold mt-1"
                    style={isCurrent ? { color: t.color } : undefined}
                  >
                    {t.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t.range}
                  </p>
                  <p className="text-xs font-bold mt-1" style={{ color: t.color }}>
                    {t.mult}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1 leading-tight">
                    {t.perks}
                  </p>
                  {isCurrent && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium text-cta bg-cta/10 px-2 py-0.5 rounded-full">
                      You are here
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your NCTR stays yours when locked. Locking = commitment, not
            spending. Choose <span className="font-semibold text-cta">360LOCK</span> for 3x rewards.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
