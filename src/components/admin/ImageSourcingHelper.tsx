import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageSourcingHelperProps {
  imageUrl: string;
  imageSourceUrl: string;
  imageQualityApproved: boolean;
  category: string;
  onImageSourceUrlChange: (url: string) => void;
  onImageQualityApprovedChange: (approved: boolean) => void;
}

const SOURCING_TIPS: Record<string, string> = {
  subscriptions: "💡 For creators: Use their Kick/YouTube profile photo or banner. Check their channel's About page.",
  gaming: "💡 For games: Check the official website press kit or Steam page for approved artwork.",
  gift_cards: "💡 For brands: Use their Instagram lifestyle content or website hero images.",
  wellness: "💡 For wellness brands: Look for homepage hero images or member success photos.",
  experiences: "💡 For events/venues: Use official venue photos from their website gallery.",
  music: "💡 For artists: Spotify artist page has official press photos and album art.",
};

export function ImageSourcingHelper({
  imageUrl,
  imageSourceUrl,
  imageQualityApproved,
  category,
  onImageSourceUrlChange,
  onImageQualityApprovedChange,
}: ImageSourcingHelperProps) {
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    setImageError(false);
  };

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
      <h4 className="text-sm font-semibold flex items-center gap-1.5">
        <Camera className="w-4 h-4" /> Image Quality & Sourcing
      </h4>

      {/* Image preview with dimensions */}
      {imageUrl && (
        <div className="space-y-1.5">
          <div className="relative rounded-lg overflow-hidden border bg-muted" style={{ maxWidth: 300 }}>
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full object-contain"
              style={{ maxHeight: 200 }}
              onLoad={handleImageLoad}
              onError={() => setImageError(true)}
            />
          </div>
          {imageError && (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <XCircle className="w-4 h-4" /> Could not load image — check URL
            </div>
          )}
          {imageDimensions && !imageError && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{imageDimensions.w} × {imageDimensions.h}px</span>
              {imageDimensions.w < 800 && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Low resolution
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source URL */}
      <div>
        <Label className="text-xs">Source URL <span className="text-muted-foreground">(where you found this image)</span></Label>
        <Input
          value={imageSourceUrl}
          onChange={e => onImageSourceUrlChange(e.target.value)}
          placeholder="e.g., https://brand.com/press"
          className="h-8 text-sm mt-1"
        />
      </div>

      {/* Quality approval */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={imageQualityApproved} onCheckedChange={(v) => onImageQualityApprovedChange(!!v)} />
        <span className="text-sm">
          {imageQualityApproved ? (
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Image quality reviewed and approved</span>
          ) : (
            'Image quality reviewed and approved'
          )}
        </span>
      </label>

      {/* Sourcing tips */}
      <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <Camera className="w-3.5 h-3.5" />
          Finding Official Brand Images
          <ChevronDown className={cn("w-3 h-3 ml-auto transition-transform", tipsOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 text-xs text-muted-foreground space-y-2 pl-5">
          <p className="font-medium text-foreground">Always use official brand assets to respect their marketing.</p>
          <div>
            <p className="font-medium">Where to look:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Press/Media Kit: [brand].com/press or /media</li>
              <li>Homepage Hero: Main website header image</li>
              <li>App Store: iOS/Android listing screenshots</li>
              <li>Social Profiles: Instagram, Twitter headers</li>
            </ul>
          </div>
          {SOURCING_TIPS[category] && (
            <p className="mt-1 p-2 bg-primary/5 rounded text-foreground">{SOURCING_TIPS[category]}</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
