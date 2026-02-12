import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, Target, ArrowRight, Lock, TrendingUp, Crown } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
  diamond: "#B9F2FF",
};

const TIER_THRESHOLDS = [
  { name: "Bronze", min: 100 },
  { name: "Silver", min: 500 },
  { name: "Gold", min: 2000 },
  { name: "Platinum", min: 10000 },
  { name: "Diamond", min: 50000 },
];

function getTierForAmount(amount: number) {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (amount >= TIER_THRESHOLDS[i].min) return TIER_THRESHOLDS[i].name;
  }
  return null;
}

export function YourNextStep() {
  const navigate = useNavigate();
  const { profile, tier, nextTier, total360Locked } = useUnifiedUser();

  const crescendoData = profile?.crescendo_data || {};
  const totalEarned = (crescendoData as any)?.total_nctr_earned || (crescendoData as any)?.available_nctr || 0;
  const tierName = (tier?.tier_name || "").toLowerCase();
  const locked = total360Locked || 0;

  // Fetch a featured bounty for Gold+ users
  const { data: featuredBounty } = useQuery({
    queryKey: ["featured-bounty-next-step"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bounties")
        .select("id, title, nctr_reward, image_emoji")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: tierName === "gold" || tierName === "platinum" || tierName === "diamond",
  });

  // Determine which condition to show
  const getCondition = () => {
    if (totalEarned === 0 && locked === 0) return 1;
    if (locked === 0) return 2;
    if (tierName === "bronze" && locked < 500) return 3;
    if (tierName === "silver" && locked < 2000) return 4;
    return 5; // Gold+
  };

  const condition = getCondition();

  return (
    <Card className="overflow-hidden border-0 shadow-lg" style={{ background: "#1A1A2E" }}>
      <CardContent className="p-5 md:p-6">
        {condition === 1 && <Condition1 navigate={navigate} />}
        {condition === 2 && <Condition2 navigate={navigate} earned={totalEarned} />}
        {condition === 3 && <Condition3 navigate={navigate} locked={locked} />}
        {condition === 4 && <Condition4 navigate={navigate} locked={locked} />}
        {condition === 5 && (
          <Condition5
            navigate={navigate}
            tierName={tierName}
            nextTier={nextTier}
            locked={locked}
            featuredBounty={featuredBounty}
          />
        )}
      </CardContent>
    </Card>
  );
}

function StepLabel() {
  return (
    <span className="text-xs font-medium tracking-wider uppercase mb-2 block" style={{ color: "#C8FF00" }}>
      Your Next Step
    </span>
  );
}

function Condition1({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div>
      <StepLabel />
      <h3 className="text-xl font-bold text-white mb-2">Earn Your First NCTR</h3>
      <p className="text-sm text-white/70 mb-4">
        Start earning NCTR by shopping with The Garden or completing a bounty.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => navigate("/brands")}
          className="gap-2 font-semibold"
          style={{ backgroundColor: "#C8FF00", color: "#1A1A2E" }}
        >
          <ShoppingBag className="w-4 h-4" />
          Shop The Garden
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/bounties")}
          className="gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white"
        >
          <Target className="w-4 h-4" />
          View Bounties
        </Button>
      </div>
    </div>
  );
}

function Condition2({ navigate, earned }: { navigate: (path: string) => void; earned: number }) {
  const wouldReach = getTierForAmount(earned);
  return (
    <div>
      <StepLabel />
      <h3 className="text-xl font-bold text-white mb-2">Commit Your NCTR with 360LOCK</h3>
      <p className="text-sm text-white/70 mb-3">
        You have <span className="font-semibold text-white">{earned.toLocaleString()} NCTR</span> earned.
        Lock it for 360 days to get 3x rewards and start building your Crescendo status.
      </p>
      {wouldReach && (
        <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 mb-4 text-sm text-white/80">
          <Lock className="w-4 h-4 inline mr-1.5 -mt-0.5" style={{ color: "#C8FF00" }} />
          {earned.toLocaleString()} NCTR locked = <span className="font-semibold text-white">{wouldReach}</span> status
        </div>
      )}
      <Button
        onClick={() => navigate("/membership")}
        className="gap-2 font-semibold"
        style={{ backgroundColor: "#C8FF00", color: "#1A1A2E" }}
      >
        Lock Now
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function TierProgress({ locked, target, tierColor, tierName }: { locked: number; target: number; tierColor: string; tierName: string }) {
  const pct = Math.min(100, (locked / target) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-white/60 mb-1.5">
        <span>{locked.toLocaleString()} NCTR locked</span>
        <span>{target.toLocaleString()} NCTR for {tierName}</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: tierColor }}
        />
      </div>
    </div>
  );
}

function Condition3({ navigate, locked }: { navigate: (path: string) => void; locked: number }) {
  const remaining = 500 - locked;
  return (
    <div>
      <StepLabel />
      <h3 className="text-xl font-bold text-white mb-2">
        You're Bronze! <span style={{ color: "#C0C0C0" }}>Silver</span> is Next.
      </h3>
      <TierProgress locked={locked} target={500} tierColor={TIER_COLORS.bronze} tierName="Silver" />
      <p className="text-sm text-white/70 mb-4">
        Lock <span className="font-semibold text-white">{remaining.toLocaleString()}</span> more NCTR to reach Silver
        and unlock Tier 2 bounties and better rewards.
      </p>
      <Button
        onClick={() => navigate("/brands")}
        className="gap-2 font-semibold"
        style={{ backgroundColor: "#C8FF00", color: "#1A1A2E" }}
      >
        <TrendingUp className="w-4 h-4" />
        Earn More NCTR
      </Button>
    </div>
  );
}

function Condition4({ navigate, locked }: { navigate: (path: string) => void; locked: number }) {
  const remaining = 2000 - locked;
  return (
    <div>
      <StepLabel />
      <h3 className="text-xl font-bold text-white mb-2">
        Silver Member! <span style={{ color: "#FFD700" }}>Gold</span> is Next.
      </h3>
      <TierProgress locked={locked} target={2000} tierColor={TIER_COLORS.silver} tierName="Gold" />
      <p className="text-sm text-white/70 mb-4">
        Lock <span className="font-semibold text-white">{remaining.toLocaleString()}</span> more NCTR to reach Gold
        and unlock Tier 3 campaign bounties worth up to 3,000 NCTR each.
      </p>
      <Button
        onClick={() => navigate("/bounties")}
        className="gap-2 font-semibold"
        style={{ backgroundColor: "#C8FF00", color: "#1A1A2E" }}
      >
        <TrendingUp className="w-4 h-4" />
        Keep Earning
      </Button>
    </div>
  );
}

function Condition5({
  navigate,
  tierName,
  nextTier,
  locked,
  featuredBounty,
}: {
  navigate: (path: string) => void;
  tierName: string;
  nextTier: any;
  locked: number;
  featuredBounty: any;
}) {
  const displayTier = tierName.charAt(0).toUpperCase() + tierName.slice(1);
  const tierColor = TIER_COLORS[tierName] || TIER_COLORS.gold;

  return (
    <div>
      <StepLabel />
      <h3 className="text-xl font-bold text-white mb-2">
        <span style={{ color: tierColor }}>{displayTier}</span> Member — You Have Full Access
      </h3>
      <p className="text-sm text-white/70 mb-4">
        All bounty tiers unlocked.{" "}
        {nextTier
          ? `Keep earning to reach ${nextTier.display_name}.`
          : "You've reached the highest Crescendo status!"}
      </p>
      {featuredBounty && (
        <div
          className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 mb-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => navigate("/bounties")}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{featuredBounty.image_emoji || "🎯"}</span>
            <div>
              <p className="text-sm font-semibold text-white">{featuredBounty.title}</p>
              <p className="text-xs text-white/60">{featuredBounty.nctr_reward.toLocaleString()} NCTR reward</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/40" />
        </div>
      )}
      <Button
        onClick={() => navigate("/bounties")}
        className="gap-2 font-semibold"
        style={{ backgroundColor: "#C8FF00", color: "#1A1A2E" }}
      >
        <Crown className="w-4 h-4" />
        Browse Bounties
      </Button>
    </div>
  );
}
