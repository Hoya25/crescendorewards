import { Button } from '@/components/ui/button';
import { ChevronRight, Lock, Star, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickStatsBarProps {
  lockedNCTR: number;
  tierName: string;
  claimBalance: number;
}

export function QuickStatsBar({ lockedNCTR, tierName, claimBalance }: QuickStatsBarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-card/80 backdrop-blur border overflow-x-auto">
      <div className="flex items-center gap-6 text-sm whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">NCTR:</span>
          <span className="font-semibold">{lockedNCTR.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Tier:</span>
          <span className="font-semibold">{tierName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Claims:</span>
          <span className="font-semibold">{claimBalance}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 shrink-0 text-xs h-7"
        onClick={() => navigate('/membership')}
      >
        View Benefits <ChevronRight className="w-3 h-3" />
      </Button>
    </div>
  );
}
