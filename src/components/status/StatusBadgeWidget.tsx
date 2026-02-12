import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { cn } from '@/lib/utils';

// Tier thresholds matching the memory
const TIER_THRESHOLDS = [
  { name: 'Bronze', min: 100, color: '#CD7F32' },
  { name: 'Silver', min: 500, color: '#C0C0C0' },
  { name: 'Gold', min: 2000, color: '#FFD700' },
  { name: 'Platinum', min: 10000, color: '#E5E4E2' },
  { name: 'Diamond', min: 50000, color: '#B9F2FF' },
];

function getTierInfo(locked: number) {
  let current: { name: string; color: string; min: number } | null = null;
  let next: { name: string; min: number } | null = null;

  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (locked >= TIER_THRESHOLDS[i].min) {
      current = TIER_THRESHOLDS[i];
      next = TIER_THRESHOLDS[i + 1] || null;
      break;
    }
  }

  if (!current) {
    return {
      tierName: 'Member',
      tierColor: '#9E9E9E',
      currentMin: 0,
      nextMin: 100,
      nextName: 'Bronze',
      progress: Math.min(100, (locked / 100) * 100),
      isMaxTier: false,
    };
  }

  if (!next) {
    return {
      tierName: current.name,
      tierColor: current.color,
      currentMin: current.min,
      nextMin: current.min,
      nextName: null,
      progress: 100,
      isMaxTier: true,
    };
  }

  const range = next.min - current.min;
  const progress = Math.min(100, Math.max(0, ((locked - current.min) / range) * 100));

  return {
    tierName: current.name,
    tierColor: current.color,
    currentMin: current.min,
    nextMin: next.min,
    nextName: next.name,
    progress,
    isMaxTier: false,
  };
}

/** Sidebar version — shown when sidebar is expanded */
export function StatusBadgeSidebar() {
  const navigate = useNavigate();
  const { total360Locked } = useUnifiedUser();
  const info = getTierInfo(total360Locked);

  return (
    <div
      onClick={() => navigate('/membership')}
      className="cursor-pointer rounded-lg p-3 mx-2 transition-colors bg-muted/50 hover:bg-muted border border-border"
    >
      <div className="flex items-center gap-2 mb-2">
        <TierBadgeCircle color={info.tierColor} size={20} />
        <span className="text-sm font-semibold text-foreground">{info.tierName}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-neutral-700 overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${info.progress}%`,
            backgroundColor: info.tierColor,
          }}
        />
      </div>

      {/* Progress text */}
      <p className="text-[11px] text-muted-foreground leading-tight">
        {info.isMaxTier
          ? 'Maximum Status'
          : total360Locked === 0
            ? 'Lock NCTR to start'
            : `${total360Locked.toLocaleString()} / ${info.nextMin.toLocaleString()} NCTR`}
      </p>
    </div>
  );
}

/** Collapsed sidebar version — just the badge circle */
export function StatusBadgeCollapsed() {
  const navigate = useNavigate();
  const { total360Locked } = useUnifiedUser();
  const info = getTierInfo(total360Locked);

  return (
    <div
      onClick={() => navigate('/membership')}
      className="cursor-pointer flex justify-center py-2"
      title={`${info.tierName} — ${total360Locked.toLocaleString()} NCTR locked`}
    >
      <TierBadgeCircle color={info.tierColor} size={24} />
    </div>
  );
}

/** Mobile header badge + popover content */
export function MobileStatusBadge() {
  const { total360Locked } = useUnifiedUser();
  const info = getTierInfo(total360Locked);
  const nctrNeeded = info.isMaxTier ? 0 : info.nextMin - total360Locked;

  return (
    <TierBadgeCircle color={info.tierColor} size={24} />
  );
}

export function MobileStatusContent() {
  const navigate = useNavigate();
  const { total360Locked } = useUnifiedUser();
  const info = getTierInfo(total360Locked);
  const nctrNeeded = info.isMaxTier ? 0 : info.nextMin - total360Locked;

  return (
    <div className="p-3 space-y-3 w-56">
      <div className="flex items-center gap-2">
        <TierBadgeCircle color={info.tierColor} size={28} />
        <div>
          <p className="font-semibold text-sm text-foreground">{info.tierName}</p>
          <p className="text-xs text-muted-foreground">Crescendo Status</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="w-full h-1.5 rounded-full bg-neutral-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${info.progress}%`,
              backgroundColor: info.tierColor,
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {info.isMaxTier
            ? 'Maximum Status'
            : total360Locked === 0
              ? 'Lock NCTR to start'
              : `${nctrNeeded.toLocaleString()} NCTR to reach ${info.nextName}`}
        </p>
      </div>

      <button
        onClick={() => navigate('/membership')}
        className="text-xs font-medium text-primary hover:underline"
      >
        View Benefits →
      </button>
    </div>
  );
}

/** Shared tier badge circle */
function TierBadgeCircle({ color, size }: { color: string; size: number }) {
  return (
    <div
      className="rounded-full flex-shrink-0 ring-1 ring-white/20"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}40`,
      }}
    />
  );
}
