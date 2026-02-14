import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Camera, ShoppingCart, Users, ChevronRight, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { toast } from "sonner";

interface ActionCard {
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
  highlight?: boolean;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { tier, nextTier, total360Locked, profile } = useUnifiedUser();
  const tierName = (tier?.tier_name || "bronze").toLowerCase();

  // Count bounties available at user's tier
  const { data: bountyCount = 0 } = useQuery({
    queryKey: ["available-bounties-count", tierName],
    queryFn: async () => {
      const tierHierarchy = ["bronze", "silver", "gold", "platinum", "diamond"];
      const tierIndex = tierHierarchy.indexOf(tierName);
      const accessible = [null, ...tierHierarchy.slice(0, tierIndex + 1)];

      const { data, error } = await supabase
        .from("bounties")
        .select("id, min_status_required")
        .eq("is_active", true);

      if (error) return 0;
      return (data || []).filter(
        (b) => !b.min_status_required || accessible.includes(b.min_status_required.toLowerCase())
      ).length;
    },
  });

  // Check if user is close to next tier (within 20%)
  const isCloseToNextTier = nextTier && tier && (() => {
    const range = nextTier.min_nctr_360_locked - tier.min_nctr_360_locked;
    const progress = total360Locked - tier.min_nctr_360_locked;
    return range > 0 && (progress / range) >= 0.8;
  })();

  const nctrToNext = nextTier ? Math.max(0, nextTier.min_nctr_360_locked - total360Locked) : 0;

  const handleCopyInvite = () => {
    const code = (profile?.crescendo_data as any)?.referral_code || profile?.id?.slice(0, 8);
    const link = `${window.location.origin}/join?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const actions: ActionCard[] = [];

  // Conditional "Almost next tier" card
  if (isCloseToNextTier && nextTier) {
    actions.push({
      emoji: "🔥",
      title: `Almost ${nextTier.display_name}!`,
      subtitle: `Commit ${nctrToNext.toLocaleString()} more NCTR to unlock new rewards`,
      cta: "See What's Waiting",
      onClick: () => {
        const el = document.getElementById("next-unlocks");
        el?.scrollIntoView({ behavior: "smooth" });
      },
      highlight: true,
    });
  }

  // Default cards
  actions.push(
    {
      emoji: "🛍️",
      title: "Shop The Garden",
      subtitle: "6,000+ brands. Earn NCTR on every purchase.",
      cta: "Start Shopping",
      onClick: () => navigate("/brands"),
    },
    {
      emoji: "📸",
      title: "Browse Bounties",
      subtitle: `${bountyCount} content challenges that pay NCTR.`,
      cta: "See Bounties",
      onClick: () => navigate("/bounties"),
    },
    {
      emoji: "👕",
      title: "Get NCTR Merch",
      subtitle: "Rep the brand. Unlock exclusive bounties.",
      cta: "Shop Merch",
      onClick: () => window.open("https://nctr-merch.myshopify.com", "_blank"),
    },
    {
      emoji: "🤝",
      title: "Invite a Friend",
      subtitle: "They join, you both earn 50 NCTR.",
      cta: "Get Your Link",
      onClick: handleCopyInvite,
    }
  );

  // Limit to 4 cards
  const displayActions = actions.slice(0, 4);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Your Next Move</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible scrollbar-hide">
        {displayActions.map((action) => (
          <Card
            key={action.title}
            className={`group cursor-pointer transition-all duration-200 shrink-0 w-[260px] md:w-auto bg-card-bg border-border-card hover:bg-card-hover ${
              action.highlight
                ? "border-accent-lime/40 bg-accent-lime/5 hover:border-accent-lime/60"
                : "hover:border-accent-lime/30"
            }`}
            onClick={action.onClick}
          >
            <CardContent className="p-4 flex flex-col h-full">
              <div className="text-3xl mb-2">{action.emoji}</div>
              <h3 className="font-semibold text-sm text-text-heading">{action.title}</h3>
              <p className="text-xs text-text-body-muted mt-1 flex-1">
                {action.subtitle}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-center text-xs text-accent-lime hover:text-accent-lime hover:bg-accent-lime/10 gap-1"
              >
                {action.cta}
                <ChevronRight className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
