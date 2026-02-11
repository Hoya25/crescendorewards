import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Camera, ShoppingCart, Users, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { toast } from "sonner";

export function QuickActions() {
  const navigate = useNavigate();
  const { tier, profile } = useUnifiedUser();
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

  const handleCopyInvite = () => {
    const code = (profile?.crescendo_data as any)?.referral_code || profile?.id?.slice(0, 8);
    const link = `${window.location.origin}/join?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const actions = [
    {
      icon: ShoppingBag,
      emoji: "🛍️",
      title: "Shop The Garden",
      subtitle: "6,000+ brands. Earn NCTR on every purchase.",
      cta: "Start Shopping →",
      onClick: () => navigate("/brands"),
    },
    {
      icon: Camera,
      emoji: "📸",
      title: "Complete a Bounty",
      subtitle: `${bountyCount} bounties available at your status level`,
      cta: "Browse Bounties →",
      onClick: () => navigate("/bounties"),
    },
    {
      icon: ShoppingCart,
      emoji: "👕",
      title: "Shop NCTR Merch",
      subtitle: "Buy gear. Unlock exclusive merch bounties.",
      cta: "Shop Merch →",
      onClick: () => window.open("https://nctr-merch.myshopify.com", "_blank"),
    },
    {
      icon: Users,
      emoji: "🤝",
      title: "Invite Friends",
      subtitle: "You both earn 50 NCTR",
      cta: "Share Invite →",
      onClick: handleCopyInvite,
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cta" />
        Earn More NCTR
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Card
            key={action.title}
            className="group cursor-pointer hover:border-cta/40 hover:shadow-md transition-all duration-200"
            onClick={action.onClick}
          >
            <CardContent className="p-4 flex flex-col h-full">
              <div className="text-3xl mb-2">{action.emoji}</div>
              <h3 className="font-semibold text-sm">{action.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex-1">
                {action.subtitle}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-center text-xs text-cta hover:text-cta hover:bg-cta/10 gap-1"
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
