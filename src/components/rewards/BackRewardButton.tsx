import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAmbitions } from '@/contexts/AmbitionsContext';
import { useBackingPublic, useMyBacking, usePickCycles, useToggleBacking, monthLabel } from '@/hooks/useBacking';

interface Props {
  rewardId: string;
  rewardName: string;
  tierRequired?: string | null;
  claimable?: boolean;
}

const base: React.CSSProperties = {
  padding: '11px 12px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12px',
  textTransform: 'uppercase',
  borderRadius: 0,
  whiteSpace: 'nowrap',
  background: 'transparent',
};

/** Backing status line: count, "In the running", winner badge. */
export function BackingMeta({ rewardId }: { rewardId: string }) {
  const { data: pub } = useBackingPublic();
  const { data: cycles } = usePickCycles();
  const info = pub?.get(rewardId);
  const won = (cycles ?? []).find((c) => c.status === 'decided' && c.winner_reward_id === rewardId);
  if (!info?.backer_count && !info?.in_running && !won) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-3.5 pt-2" style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#6B6B68' }}>
      {won && (
        <span style={{ border: '1px solid #131313', padding: '2px 6px', color: '#131313' }}>
          {won.kind === 'commons' ? 'Commons Pick' : 'Member Pick'} · {monthLabel(won.cycle_month)}
        </span>
      )}
      {info?.in_running && <span style={{ border: '1px solid #D4D3CF', padding: '2px 6px' }}>In the running</span>}
      {!!info?.backer_count && <span>Backed by {info.backer_count} member{info.backer_count === 1 ? '' : 's'}</span>}
    </div>
  );
}

export function BackRewardButton({ rewardId, rewardName, tierRequired, claimable = false }: Props) {
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();
  const { tier, backed } = useMyBacking();
  const { isAmbition, toggleAmbition } = useAmbitions();
  const toggle = useToggleBacking();
  const isBacked = backed.has(rewardId);

  if (!isAuthenticated) {
    return (
      <button
        style={{ ...base, border: '1px solid #E0DFDB', color: '#6B6B68', cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); setAuthMode?.('signin'); setShowAuthModal?.(true); }}
      >
        Sign in to back
      </button>
    );
  }

  if (!tier) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span onClick={(e) => e.stopPropagation()}>
              <button disabled style={{ ...base, border: '1px solid #E0DFDB', color: '#A8A7A3', cursor: 'not-allowed' }}>
                Back this
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Counts at Bronze</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggle.mutateAsync({ rewardId, backed: isBacked });
      // Keep Wingman + the BH wish bridge in step through the existing ambitions path.
      const tracking = isAmbition(rewardId);
      if (!isBacked && !tracking) {
        await toggleAmbition({ rewardId, rewardName, claimable, tierRequired: tierRequired || 'Bronze' });
      }
    } catch (err) {
      toast((err as Error).message || 'Couldn’t save your backing. Try again.');
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={toggle.isPending}
      style={{
        ...base,
        border: isBacked ? '1px solid #E2FF6D' : '1px solid #E0DFDB',
        color: isBacked ? '#131313' : '#6B6B68',
        backgroundColor: isBacked ? '#E2FF6D' : 'transparent',
        cursor: 'pointer',
      }}
    >
      {isBacked ? 'Backed' : 'Back this'}
    </button>
  );
}
