/**
 * Extract a thumbnail URL from a video URL (YouTube supported).
 */
export function getThumbnailFromUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/embed\/([^?]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/v\/([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
  } catch (e) {
    console.error('Error extracting thumbnail:', e);
  }

  return null;
}
