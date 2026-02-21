import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

const DISMISSED_KEY = 'crescendo_lock_banner_dismissed';

export function LockCalloutBanner() {
  const navigate = useNavigate();
  const { profile, total360Locked } = useUnifiedUser();
  const [dismissed, setDismissed] = useState(() => 
    sessionStorage.getItem(DISMISSED_KEY) === 'true'
  );

  // available_nctr from profile (unlocked balance)
  const availableNctr = (profile as any)?.available_nctr ?? 0;
  const hasNo360Lock = total360Locked <= 0;

  // Only show if user has unlocked NCTR > 0 AND no active 360LOCK
  if (dismissed || availableNctr <= 0 || !hasNo360Lock || !profile) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div 
      className="w-full px-4 py-3 flex items-center justify-between gap-3"
      style={{ background: '#E2FF6D', color: '#323232' }}
    >
      <button
        onClick={() => navigate('/membership')}
        className="flex-1 flex items-center gap-2 text-sm font-medium text-left min-w-0"
        style={{ color: '#323232' }}
      >
        <span className="truncate">
          You have <span className="font-bold">{availableNctr.toLocaleString()} NCTR</span> ready. Commit it for 360 days to activate your status and unlock your rewards.
        </span>
        <ArrowRight className="w-4 h-4 flex-shrink-0" />
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" style={{ color: '#323232' }} />
      </button>
    </div>
  );
}
