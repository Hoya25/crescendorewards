import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

function getEmbedUrl(url: string): { type: 'embed' | 'direct'; src: string } {
  try {
    const u = new URL(url);

    // YouTube
    const ytMatch = u.hostname.includes('youtube.com')
      ? u.searchParams.get('v')
      : u.hostname === 'youtu.be'
        ? u.pathname.slice(1)
        : null;
    if (ytMatch) return { type: 'embed', src: `https://www.youtube.com/embed/${ytMatch}?autoplay=1` };

    // Vimeo
    const vimeoMatch = u.hostname.includes('vimeo.com') ? u.pathname.split('/').filter(Boolean).pop() : null;
    if (vimeoMatch && /^\d+$/.test(vimeoMatch))
      return { type: 'embed', src: `https://player.vimeo.com/video/${vimeoMatch}?autoplay=1` };

    // TikTok
    if (u.hostname.includes('tiktok.com')) return { type: 'embed', src: url };

    // Direct video file
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'direct', src: url };
  } catch {
    // ignore
  }
  return { type: 'embed', src: url };
}

export function VideoPlayerModal({ open, onClose, videoUrl, title }: VideoPlayerModalProps) {
  const { type, src } = getEmbedUrl(videoUrl);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-none [&>button]:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-50 text-white hover:bg-white/20 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="aspect-video w-full">
          {type === 'direct' ? (
            <video src={src} controls autoPlay className="w-full h-full object-contain" />
          ) : (
            <iframe
              src={src}
              title={title || 'Video'}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
