import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSponsorshipVisible, type SponsorshipData } from '@/lib/sponsorship-utils';
import { useTheme } from 'next-themes';

interface SponsorBadgeProps {
  sponsorData: SponsorshipData;
  variant?: 'card' | 'detail';
  className?: string;
}

/**
 * Gets the appropriate logo URL based on theme for known sponsors
 */
function getThemedLogoUrl(logoUrl: string | null, sponsorName: string | null, theme: string | undefined): string | null {
  // Handle NCTR Alliance theme-aware logos
  if (sponsorName?.toLowerCase().includes('nctr alliance') || logoUrl?.includes('nctr-alliance')) {
    return theme === 'dark' 
      ? '/brands/nctr-alliance-yellow.png' 
      : '/brands/nctr-alliance-grey.png';
  }
  
  // Return the provided logo URL if it exists
  if (logoUrl) return logoUrl;
  
  return null;
}

/**
 * Displays a subtle, premium "Sponsored by" badge for rewards
 * Only shows when sponsorship is active and within date range
 */
export function SponsorBadge({ sponsorData, variant = 'card', className }: SponsorBadgeProps) {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;
  const [imageError, setImageError] = useState(false);
  
  // Don't render if sponsorship shouldn't be visible
  if (!isSponsorshipVisible(sponsorData)) {
    return null;
  }

  const logoUrl = getThemedLogoUrl(sponsorData.sponsor_logo, sponsorData.sponsor_name, currentTheme);

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 transition-all',
        variant === 'card' 
          ? 'px-2.5 py-1.5 bg-background/95 backdrop-blur-sm rounded-full shadow-sm border border-border/50'
          : 'px-3 py-2 bg-muted/50 rounded-lg border border-border/30',
        sponsorData.sponsor_link && 'cursor-pointer hover:bg-muted/80 hover:border-primary/30',
        className
      )}
    >
      {/* Sponsor Logo */}
      {logoUrl && !imageError && (
        <img
          src={logoUrl}
          alt={sponsorData.sponsor_name || 'Sponsor'}
          className={cn(
            'object-contain',
            variant === 'card' ? 'h-5 w-auto max-w-[70px]' : 'h-8 w-auto max-w-[100px]'
          )}
          onError={() => setImageError(true)}
        />
      )}
      
      {/* Sponsored by text */}
      <span className={cn(
        'text-muted-foreground whitespace-nowrap',
        variant === 'card' ? 'text-[10px]' : 'text-xs'
      )}>
        Sponsored by{' '}
        <span className="font-medium text-foreground">
          {sponsorData.sponsor_name}
        </span>
      </span>

      {/* External link indicator */}
      {sponsorData.sponsor_link && variant === 'detail' && (
        <ExternalLink className="w-3 h-3 text-muted-foreground" />
      )}
    </div>
  );

  // Wrap in link if sponsor_link exists
  if (sponsorData.sponsor_link) {
    return (
      <a
        href={sponsorData.sponsor_link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-block"
      >
        {content}
      </a>
    );
  }

  return content;
}
