import { Card, CardContent } from "@/components/ui/card";
import { Gift, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { toast } from "sonner";

interface ActionCard {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();

  const handleCopyInvite = () => {
    const code = (profile?.crescendo_data as any)?.referral_code || profile?.id?.slice(0, 8);
    const link = `https://crescendo.nctr.live?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const actions: ActionCard[] = [
    {
      icon: Gift,
      iconColor: "#E2FF6D",
      title: "Browse Rewards",
      subtitle: "Explore rewards you can claim with your status.",
      cta: "See Rewards",
      onClick: () => navigate("/rewards"),
    },
    {
      icon: UserPlus,
      iconColor: "#D9D9D9",
      title: "Invite a Friend",
      subtitle: "They join, you both earn 50 NCTR.",
      cta: "Get Your Link",
      onClick: handleCopyInvite,
    },
  ];

  return (
    <section className="space-y-3">
      <h2
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '18px',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.04em',
          color: '#FFFFFF',
        }}
      >
        Your Next Move
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.title}
              onClick={action.onClick}
              className="cursor-pointer"
              style={{
                background: '#131313',
                border: '1px solid #323232',
                borderRadius: '0px',
                padding: '20px',
                transition: 'border-color 200ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E2FF6D')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#323232')}
            >
              <Icon style={{ width: 24, height: 24, color: action.iconColor, marginBottom: 12 }} />
              <h3
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.03em',
                }}
              >
                {action.title}
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: '#D9D9D9',
                  lineHeight: 1.5,
                  marginTop: '4px',
                }}
              >
                {action.subtitle}
              </p>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '12px',
                  color: '#E2FF6D',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  display: 'inline-block',
                  marginTop: '12px',
                }}
              >
                {action.cta}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
