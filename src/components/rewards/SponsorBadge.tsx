import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSponsorshipVisible, type SponsorshipData } from '@/lib/sponsorship-utils';

interface SponsorBadgeProps {
  sponsorData: SponsorshipData;
  variant?: 'card' | 'detail';
  className?: string;
}

/**
 * Gets the appropriate logo URL for the sponsor
 * NCTR Alliance always uses yellow logo for brand consistency on dark backgrounds
 */
function getLogoUrl(logoUrl: string | null, sponsorName: string | null): string | null {
  // NCTR Alliance always uses yellow logo on gunmetal background
  if (sponsorName?.toLowerCase().includes('nctr alliance') || logoUrl?.includes('nctr-alliance')) {
    return '/brands/nctr-alliance-yellow.png';
  }
  
  return logoUrl || null;
}

/**
 * Displays an elegant, premium "Sponsored by" badge with gunmetal styling
 * Only shows when sponsorship is active and within date range
 */
export function SponsorBadge({ sponsorData, variant = 'card', className }: SponsorBadgeProps) {
  const [imageError, setImageError] = useState(false);
  
  // Don't render if sponsorship shouldn't be visible
  if (!isSponsorshipVisible(sponsorData)) {
    return null;
  }

  const logoUrl = getLogoUrl(sponsorData.sponsor_logo, sponsorData.sponsor_name);

  const content = (
    <div
      className={cn(
        'flex items-center gap-2.5 transition-all duration-200',
        // Gunmetal grey background with subtle gradient and premium styling
        'bg-gradient-to-r from-[#2a2d32] via-[#373b42] to-[#2a2d32]',
        'border border-[#4a4f58]/50',
        'shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
        variant === 'card' 
          ? 'px-3 py-1.5 rounded-full'
          : 'px-4 py-2.5 rounded-lg',
        sponsorData.sponsor_link && 'cursor-pointer hover:from-[#32363c] hover:via-[#3f444c] hover:to-[#32363c] hover:border-amber-500/30 hover:shadow-[0_2px_12px_rgba(251,191,36,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]',
        className
      )}
    >
      {/* Sponsor Logo */}
      {logoUrl && !imageError && (
        <img
          src={logoUrl}
          alt={sponsorData.sponsor_name || 'Sponsor'}
          className={cn(
            'object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
            variant === 'card' ? 'h-4 w-auto max-w-[60px]' : 'h-6 w-auto max-w-[80px]'
          )}
          onError={() => setImageError(true)}
        />
      )}
      
      {/* Divider */}
      <div className={cn(
        'w-px bg-gradient-to-b from-transparent via-amber-500/40 to-transparent',
        variant === 'card' ? 'h-3' : 'h-4'
      )} />
      
      {/* Sponsored by text */}
      <span className={cn(
        'whitespace-nowrap tracking-wide',
        variant === 'card' ? 'text-[10px]' : 'text-xs'
      )}>
        <span className="text-[#9ca3af] font-light">Sponsored by</span>
        {' '}
        <span className="font-semibold text-amber-400/90">
          {sponsorData.sponsor_name}
        </span>
      </span>

      {/* External link indicator */}
      {sponsorData.sponsor_link && variant === 'detail' && (
        <ExternalLink className="w-3 h-3 text-amber-500/60 ml-0.5" />
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
