import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link as LinkIcon } from 'lucide-react';
import type { ContentFormat } from './ContentTypeStep';

interface ReviewSubmitStepProps {
  format: ContentFormat;
  title: string;
  description: string;
  mediaUrl: string;
  contentType: string;
  rewardTitle?: string;
  displayName: string;
  isSponsor: boolean;
  brandName: string;
  agreedToTerms: boolean;
  onAgreedChange: (v: boolean) => void;
}

export function ReviewSubmitStep({
  format, title, description, mediaUrl, contentType,
  rewardTitle, displayName, isSponsor, brandName,
  agreedToTerms, onAgreedChange,
}: ReviewSubmitStepProps) {
  const sourceBadge = isSponsor
    ? `🏢 From ${brandName || 'Brand'}`
    : `👤 Shared by ${displayName || 'Contributor'}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">{format}</Badge>
            {contentType && <Badge variant="outline">{contentType}</Badge>}
          </div>

          <h3 className="font-semibold text-lg">{title || 'Untitled'}</h3>
          {description && <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>}

          {mediaUrl && (
            <p className="text-xs text-muted-foreground truncate">
              <LinkIcon className="inline h-3 w-3 mr-1" />{mediaUrl}
            </p>
          )}

          <p className="text-sm font-medium">{sourceBadge}</p>

          {rewardTitle && (
            <p className="text-xs text-primary">Linked to: {rewardTitle}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={v => onAgreedChange(v === true)}
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
            I have the rights to share this content and agree to the community guidelines.
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
