import { UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReferralStats } from '@/hooks/useReferralStats';
import { useReferralMilestones } from '@/hooks/useReferralMilestones';

const FALLBACK_THRESHOLDS = [1, 3, 5, 10, 25];

export function DashboardReferralCard() {
  const navigate = useNavigate();
  const { data: stats } = useReferralStats();
  const { data: milestones } = useReferralMilestones();

  const current = stats?.totalReferrals ?? 0;

  // Determine next milestone threshold
  const thresholds = milestones && milestones.length > 0
    ? milestones.map((m) => m.referral_count)
    : FALLBACK_THRESHOLDS;

  const nextThreshold = thresholds.find((t) => current < t);
  const allComplete = !nextThreshold;
  const progress = nextThreshold ? Math.min((current / nextThreshold) * 100, 100) : 100;

  return (
    <div
      className="flex items-center gap-4 p-4"
      style={{
        background: 'rgba(50,50,50,0.6)',
        border: '1px solid rgba(226,255,109,0.15)',
        borderRadius: 0,
      }}
    >
      <UserPlus className="w-6 h-6 flex-shrink-0" style={{ color: '#E2FF6D' }} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-[15px] font-semibold text-white">Invite Friends, Earn NCTR</p>

        <p className="text-[13px]" style={{ color: '#D9D9D9' }}>
          {current === 0
            ? 'Invite your first friend to earn 500 NCTR'
            : allComplete
              ? 'Keep inviting — every friend strengthens the Alliance'
              : `${current} of ${nextThreshold} referrals to next milestone`}
        </p>

        {!allComplete && (
          <div className="w-full h-1" style={{ background: '#5A5A58', borderRadius: 0 }}>
            <div
              className="h-full transition-all"
              style={{ width: `${progress}%`, background: '#E2FF6D', borderRadius: 0 }}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/invite')}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase"
        style={{ background: '#E2FF6D', color: '#323232', borderRadius: 0 }}
      >
        Invite <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
