import { ShoppingBag, Trophy, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function HowItWorksSection() {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Three Steps to Free Rewards</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-background rounded-2xl p-6 text-center border">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 1</span>
            <h3 className="text-xl font-bold mt-1 mb-2">Earn Points</h3>
            <p className="text-sm text-muted-foreground">Shop at 6,000+ brands. Invite friends. Add value to the community.</p>
          </div>

          <div className="bg-background rounded-2xl p-6 text-center border">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 2</span>
            <h3 className="text-xl font-bold mt-1 mb-2">Level Up</h3>
            <p className="text-sm text-muted-foreground">Your points unlock membership tiers. Higher tier = better rewards.</p>
          </div>

          <div className="bg-background rounded-2xl p-6 text-center border">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 3</span>
            <h3 className="text-xl font-bold mt-1 mb-2">Claim Rewards</h3>
            <p className="text-sm text-muted-foreground">Streaming subs, gift cards, experiences — yours to claim, no purchase required.</p>
          </div>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/how-it-works')} className="gap-2">
            Learn More <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
