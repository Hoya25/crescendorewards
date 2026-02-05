import { Coins, Lock, Gift, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    icon: Coins,
    title: "Earn",
    description: "Shop, invite, contribute → earn NCTR",
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: Lock,
    title: "Commit",
    description: "Lock NCTR for 360 days → unlock your tier",
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    icon: Gift,
    title: "Reward",
    description: "Claim rewards you actually want",
    color: "from-emerald-400 to-green-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
];

export function HowItWorksSection() {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">How Crescendo Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to ownership and rewards
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {steps.map((step, index) => (
            <Card key={step.title} className={`border-0 ${step.bgColor}`}>
              <CardContent className="p-6 text-center">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/how-it-works')}
            className="gap-2"
          >
            Learn More
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
