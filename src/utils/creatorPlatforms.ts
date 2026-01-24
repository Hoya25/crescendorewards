// Platform brand colors
export const PLATFORM_COLORS: Record<string, string> = {
  twitch: '#9146FF',
  youtube: '#FF0000',
  patreon: '#FF424D',
  substack: '#FF6719',
};

// Platform display names
export const PLATFORM_NAMES: Record<string, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  patreon: 'Patreon',
  substack: 'Substack',
};

// Platform icons (Lucide icon names)
export const PLATFORM_ICONS: Record<string, string> = {
  twitch: 'Twitch',
  youtube: 'Youtube',
  patreon: 'Heart',
  substack: 'Mail',
};

/**
 * Get the display name for a platform
 */
export function getPlatformName(platform: string | null): string {
  if (!platform) return '';
  return PLATFORM_NAMES[platform.toLowerCase()] || platform;
}

/**
 * Get the brand color for a platform
 */
export function getPlatformColor(platform: string | null): string {
  if (!platform) return '#888888';
  return PLATFORM_COLORS[platform.toLowerCase()] || '#888888';
}

/**
 * Get tailwind-compatible background class for platform
 * Note: These use approximate tailwind colors since exact brand colors 
 * may not be available as utility classes
 */
export function getPlatformBgClass(platform: string | null): string {
  const classes: Record<string, string> = {
    twitch: 'bg-purple-600',
    youtube: 'bg-red-600',
    patreon: 'bg-orange-500',
    substack: 'bg-orange-600',
  };
  if (!platform) return 'bg-muted';
  return classes[platform.toLowerCase()] || 'bg-muted';
}

/**
 * Get the URL for a creator's channel based on platform
 */
export function getCreatorChannelUrl(platform: string, channelId: string): string {
  const baseUrls: Record<string, string> = {
    twitch: 'https://twitch.tv/',
    youtube: 'https://youtube.com/',
    patreon: 'https://patreon.com/',
    substack: 'https://',
  };
  
  const base = baseUrls[platform.toLowerCase()];
  if (!base) return channelId;
  
  // If it's already a full URL, return as-is
  if (channelId.startsWith('http')) return channelId;
  
  return `${base}${channelId}`;
}

/**
 * Check if a platform is a valid creator platform
 */
export function isValidPlatform(platform: string | null): boolean {
  if (!platform) return false;
  return Object.keys(PLATFORM_COLORS).includes(platform.toLowerCase());
}
