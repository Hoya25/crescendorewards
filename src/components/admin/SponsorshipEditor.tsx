import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Calendar, Link as LinkIcon, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { SponsorBadge } from '@/components/rewards/SponsorBadge';
import { getSponsorshipStatus, formatSponsorshipStatus, type SponsorshipData } from '@/lib/sponsorship-utils';
import { cn } from '@/lib/utils';

interface SponsorshipFormData {
  sponsor_enabled: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  sponsor_link: string | null;
  sponsor_start_date: string | null;
  sponsor_end_date: string | null;
}

interface SponsorshipEditorProps {
  formData: SponsorshipFormData;
  onChange: (data: Partial<SponsorshipFormData>) => void;
}

/**
 * Admin component for editing reward sponsorship details
 */
export function SponsorshipEditor({ formData, onChange }: SponsorshipEditorProps) {
  const sponsorData: SponsorshipData = {
    sponsor_enabled: formData.sponsor_enabled,
    sponsor_name: formData.sponsor_name,
    sponsor_logo: formData.sponsor_logo,
    sponsor_link: formData.sponsor_link,
    sponsor_start_date: formData.sponsor_start_date,
    sponsor_end_date: formData.sponsor_end_date,
  };

  const status = getSponsorshipStatus(sponsorData);
  const statusDisplay = formatSponsorshipStatus(status);

  // Validation
  const isValid = !formData.sponsor_enabled || (
    formData.sponsor_name &&
    formData.sponsor_logo &&
    formData.sponsor_start_date &&
    formData.sponsor_end_date
  );

  const endBeforeStart = formData.sponsor_start_date && 
    formData.sponsor_end_date && 
    new Date(formData.sponsor_end_date) < new Date(formData.sponsor_start_date);

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Sponsorship
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Display sponsor branding on this reward
          </p>
        </div>
        <div className="flex items-center gap-3">
          {formData.sponsor_enabled && (
            <Badge className={statusDisplay.className} variant={statusDisplay.variant}>
              {statusDisplay.label}
            </Badge>
          )}
          <Switch
            checked={formData.sponsor_enabled}
            onCheckedChange={(checked) => onChange({ sponsor_enabled: checked })}
          />
        </div>
      </div>

      {/* Sponsorship Fields */}
      {formData.sponsor_enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-primary/20">
          {/* Sponsor Name */}
          <div className="space-y-1">
            <Label className="text-xs">Sponsor Name *</Label>
            <Input
              value={formData.sponsor_name || ''}
              onChange={(e) => onChange({ sponsor_name: e.target.value || null })}
              placeholder="e.g., Nike, Spotify"
            />
          </div>

          {/* Sponsor Logo */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Sponsor Logo URL *
            </Label>
            <Input
              value={formData.sponsor_logo || ''}
              onChange={(e) => onChange({ sponsor_logo: e.target.value || null })}
              placeholder="https://..."
            />
            {formData.sponsor_logo && (
              <div className="mt-2 p-2 bg-muted rounded border">
                <img
                  src={formData.sponsor_logo}
                  alt="Logo preview"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Sponsor Link */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Sponsor Link (optional)
            </Label>
            <Input
              value={formData.sponsor_link || ''}
              onChange={(e) => onChange({ sponsor_link: e.target.value || null })}
              placeholder="https://sponsor-website.com"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start Date *
              </Label>
              <Input
                type="date"
                value={formData.sponsor_start_date || ''}
                onChange={(e) => onChange({ sponsor_start_date: e.target.value || null })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End Date *
              </Label>
              <Input
                type="date"
                value={formData.sponsor_end_date || ''}
                onChange={(e) => onChange({ sponsor_end_date: e.target.value || null })}
                className={cn(endBeforeStart && 'border-destructive')}
              />
            </div>
          </div>

          {/* Validation Errors */}
          {endBeforeStart && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertTriangle className="w-3 h-3" />
              End date must be after start date
            </div>
          )}

          {formData.sponsor_enabled && !isValid && !endBeforeStart && (
            <div className="flex items-center gap-2 text-amber-600 text-xs">
              <AlertTriangle className="w-3 h-3" />
              Please fill in all required fields (*)
            </div>
          )}

          {/* Preview */}
          {formData.sponsor_name && formData.sponsor_logo && (
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Card view:</span>
                    <div className="mt-1">
                      <SponsorBadge sponsorData={{
                        ...sponsorData,
                        // Force show preview even if dates aren't in range
                        sponsor_start_date: null,
                        sponsor_end_date: null,
                      }} variant="card" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Detail view:</span>
                    <div className="mt-1">
                      <SponsorBadge sponsorData={{
                        ...sponsorData,
                        sponsor_start_date: null,
                        sponsor_end_date: null,
                      }} variant="detail" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
