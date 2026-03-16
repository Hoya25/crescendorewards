import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BOUNTY_HUNTER_DOMAIN = 'https://earn-with-nctr.lovable.app';
const CRESCENDO_DOMAIN = 'https://crescendo.nctr.live';

interface DualReferralLinksProps {
  referralCode: string;
  className?: string;
  compact?: boolean;
}

export function DualReferralLinks({ referralCode, className, compact = false }: DualReferralLinksProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const links = [
    {
      key: 'crescendo',
      label: 'Rewards link',
      url: `${CRESCENDO_DOMAIN}?ref=${referralCode}`,
    },
    {
      key: 'bounty',
      label: 'Shop & earn link',
      url: `${BOUNTY_HUNTER_DOMAIN}/auth?ref=${referralCode}`,
    },
  ];

  const handleCopy = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('Link copied!');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {links.map(({ key, label, url }) => (
        <div key={key}>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
          <div className="flex items-center gap-2">
            <code className={cn(
              "flex-1 bg-muted/50 rounded px-3 py-2 truncate text-muted-foreground font-mono",
              compact ? "text-[11px]" : "text-xs"
            )}>
              {url}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => handleCopy(key, url)}
            >
              {copiedKey === key
                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        Same code works everywhere. Share either link — your earnings track automatically.
      </p>
    </div>
  );
}
