import { ShoppingBag, Trophy, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";

export function HowItWorksSection() {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl mb-3" style={{ fontFamily: barlow, fontWeight: 700, letterSpacing: '-0.02em' }}>Three Steps to Free Rewards</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-background p-6 text-center border" style={{ borderRadius: '0px' }}>
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ borderRadius: '0px', backgroundColor: '#323232' }}>
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: dmSans }}>Step 1</span>
            <h3 className="text-xl mt-1 mb-2" style={{ fontFamily: barlow, fontWeight: 700 }}>Earn Claims</h3>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: dmSans }}>Shop at thousands of brands. Invite friends. Add value to the community.</p>
          </div>

          <div className="bg-background p-6 text-center border" style={{ borderRadius: '0px' }}>
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ borderRadius: '0px', backgroundColor: '#323232' }}>
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: dmSans }}>Step 2</span>
            <h3 className="text-xl mt-1 mb-2" style={{ fontFamily: barlow, fontWeight: 700 }}>Level Up</h3>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: dmSans }}>Your Claims unlock membership tiers. Higher tier = better rewards.</p>
          </div>

          <div className="bg-background p-6 text-center border" style={{ borderRadius: '0px' }}>
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ borderRadius: '0px', backgroundColor: '#323232' }}>
              <Gift className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: dmSans }}>Step 3</span>
            <h3 className="text-xl mt-1 mb-2" style={{ fontFamily: barlow, fontWeight: 700 }}>Claim Rewards</h3>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: dmSans }}>Streaming subs, gift cards, experiences — yours to claim, no purchase required.</p>
          </div>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/how-it-works')} className="gap-2" style={{ borderRadius: '0px' }}>
            Learn More <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
