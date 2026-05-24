import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface EngineOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engineSlug: string | null;
  engineDisplayName: string | null;
}

export function EngineOnboardingModal({
  open,
  onOpenChange,
  engineSlug,
  engineDisplayName,
}: EngineOnboardingModalProps) {
  const label = engineDisplayName || engineSlug || 'this Engine';
  const bhUrl = engineSlug
    ? `https://bountyhunter.nctr.live/engines/${engineSlug}`
    : 'https://bountyhunter.nctr.live/engines';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ borderRadius: 0 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
            Join {label} to unlock
          </DialogTitle>
          <DialogDescription style={{ fontFamily: "'DM Sans', sans-serif" }}>
            This reward is reserved for members of the {label} Engine.
            Engines are formed inside Bounty Hunter — join one to unlock
            its dedicated rewards and benefits.
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#6B6B68',
            lineHeight: 1.6,
            padding: '12px 0',
          }}
        >
          1. Open Bounty Hunter<br />
          2. Find the {label} Engine<br />
          3. Tap “Join Engine” and complete the prompt
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} style={{ borderRadius: 0 }}>
            Maybe later
          </Button>
          <Button
            asChild
            style={{ borderRadius: 0, backgroundColor: '#E2FF6D', color: '#131313' }}
          >
            <a href={bhUrl} target="_blank" rel="noopener noreferrer">
              Open Bounty Hunter <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
