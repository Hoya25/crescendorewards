/**
 * Utility functions for reward sponsorship management
 */

export type SponsorshipStatus = 'none' | 'scheduled' | 'active' | 'expiring-soon' | 'expired';

export interface SponsorshipData {
  sponsor_enabled: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  sponsor_link: string | null;
  sponsor_start_date: string | null;
  sponsor_end_date: string | null;
}

/**
 * Determines the current sponsorship status based on dates and enabled flag
 */
export function getSponsorshipStatus(data: SponsorshipData): SponsorshipStatus {
  if (!data.sponsor_enabled || !data.sponsor_name) {
    return 'none';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = data.sponsor_start_date ? new Date(data.sponsor_start_date) : null;
  const endDate = data.sponsor_end_date ? new Date(data.sponsor_end_date) : null;

  // If no dates set but enabled, consider it always active
  if (!startDate && !endDate) {
    return 'active';
  }

  // Not yet started
  if (startDate && today < startDate) {
    return 'scheduled';
  }

  // Already ended
  if (endDate && today > endDate) {
    return 'expired';
  }

  // Expiring within 7 days
  if (endDate) {
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    if (endDate <= sevenDaysFromNow) {
      return 'expiring-soon';
    }
  }

  return 'active';
}

/**
 * Checks if a sponsorship should be displayed to users
 */
export function isSponsorshipVisible(data: SponsorshipData): boolean {
  const status = getSponsorshipStatus(data);
  return status === 'active' || status === 'expiring-soon';
}

/**
 * Formats the sponsorship status for display
 */
export function formatSponsorshipStatus(status: SponsorshipStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'default', className: 'bg-green-500' };
    case 'expiring-soon':
      return { label: 'Expiring Soon', variant: 'destructive', className: 'bg-amber-500' };
    case 'scheduled':
      return { label: 'Scheduled', variant: 'secondary' };
    case 'expired':
      return { label: 'Expired', variant: 'outline', className: 'text-muted-foreground' };
    default:
      return { label: 'None', variant: 'outline' };
  }
}
