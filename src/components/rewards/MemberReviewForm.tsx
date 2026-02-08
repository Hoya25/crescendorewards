import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Star, Upload, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberReviewFormProps {
  open: boolean;
  onClose: () => void;
  rewardId: string;
  rewardTitle: string;
  mode?: 'review' | 'tip';
}

export function MemberReviewForm({ open, onClose, rewardId, rewardTitle, mode = 'review' }: MemberReviewFormProps) {
  const { profile } = useUnifiedUser();
  const queryClient = useQueryClient();
  const userId = profile?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setTitle('');
    setContent('');
    setMediaUrl('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }

    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('review-images').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(path);
      setMediaUrl(publicUrl);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setImageUploading(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const userName = profile?.display_name || profile?.email || 'Member';

      const { error } = await supabase.from('content_submissions').insert({
        title: mode === 'tip' ? content.slice(0, 60) : title,
        description: content,
        content_type: mode === 'tip' ? 'tip' : 'review',
        media_url: mediaUrl || null,
        thumbnail_url: mediaUrl || null,
        source_type: 'member' as const,
        source_id: userId,
        source_name: userName,
        reward_id: rewardId,
        status: 'pending',
        rating: mode === 'review' ? rating || null : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-reviews', rewardId] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      toast({
        title: mode === 'tip' ? 'Tip shared!' : 'Review submitted!',
        description: 'Your content will appear after a quick review.',
      });
      resetForm();
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to submit', description: err.message, variant: 'destructive' });
    },
  });

  const isTip = mode === 'tip';
  const canSubmit = isTip
    ? content.length >= 10 && content.length <= 280
    : rating > 0 && title.length > 0 && content.length >= 50 && content.length <= 500;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isTip ? '💡 Share a Tip' : '⭐ Write a Review'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">About: {rewardTitle}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Star Rating (review only) */}
          {!isTip && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        (hoverRating || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title (review only) */}
          {!isTip && (
            <div className="space-y-2">
              <Label>Sum it up in a few words</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Absolutely love this!"
                maxLength={100}
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label>{isTip ? 'Share a quick tip' : 'Tell us about your experience'}</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={isTip ? "e.g., Best used in the morning with coffee..." : "What did you like? How was your experience?"}
              className="min-h-[100px]"
              maxLength={isTip ? 280 : 500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/{isTip ? 280 : 500}
            </p>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Add photo (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {mediaUrl ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setMediaUrl('')}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {imageUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            )}
          </div>

          <Button
            className="w-full"
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : isTip ? 'Share Tip' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
