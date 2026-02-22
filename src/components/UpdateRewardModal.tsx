import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RewardImageGallery, type GalleryImage, saveGalleryImages, loadGalleryImages } from '@/components/RewardImageGallery';

interface UpdateRewardModalProps {
  open: boolean;
  onClose: () => void;
  submission: {
    id: string;
    title: string;
    description: string;
    category: string;
    brand: string | null;
    reward_type: string;
    lock_rate: string;
    nctr_value: number;
    claim_passes_required: number;
    stock_quantity: number | null;
    image_url: string | null;
    version: number;
  };
  onSuccess: () => void;
}

export function UpdateRewardModal({ open, onClose, submission, onSuccess }: UpdateRewardModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: submission.title,
    description: submission.description,
    category: submission.category,
    brand: submission.brand || '',
    nctr_value: submission.nctr_value,
    claim_passes_required: submission.claim_passes_required,
    stock_quantity: submission.stock_quantity || 0,
    image_url: submission.image_url || '',
    version_notes: '',
  });
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // Load gallery images on mount
  useEffect(() => {
    if (submission.id && open) {
      loadGalleryImages(submission.id, submission.image_url).then(setGalleryImages);
    }
  }, [submission.id, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.version_notes.trim()) {
      toast.error('Please describe what changes you made');
      return;
    }

    setLoading(true);
    try {
      // Upload any new gallery images and get primary URL
      let primaryImageUrl = formData.image_url || null;
      if (galleryImages.some(g => g.file)) {
        const { primaryUrl } = await saveGalleryImages(submission.id, galleryImages);
        if (primaryUrl) primaryImageUrl = primaryUrl;
      }

      const { data, error } = await supabase.rpc('submit_reward_version', {
        p_parent_submission_id: submission.id,
        p_title: formData.title,
        p_description: formData.description,
        p_category: formData.category,
        p_brand: formData.brand || null,
        p_reward_type: submission.reward_type,
        p_lock_rate: submission.lock_rate,
        p_nctr_value: formData.nctr_value,
        p_claim_passes_required: formData.claim_passes_required,
        p_stock_quantity: formData.stock_quantity || null,
        p_image_url: primaryImageUrl,
        p_version_notes: formData.version_notes,
      }) as { data: any; error: any };

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit update');
      }

      toast.success('Update submitted successfully! It will be reviewed by our team.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting update:', error);
      toast.error(error.message || 'Failed to submit update');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = 
    formData.title !== submission.title ||
    formData.description !== submission.description ||
    formData.category !== submission.category ||
    formData.brand !== (submission.brand || '') ||
    formData.nctr_value !== submission.nctr_value ||
    formData.claim_passes_required !== submission.claim_passes_required ||
    formData.stock_quantity !== (submission.stock_quantity || 0) ||
    galleryImages.some(g => g.file) || // New images added
    galleryImages.length !== (submission.image_url ? 1 : 0); // Images changed

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Reward - Version {submission.version + 1}</DialogTitle>
          <DialogDescription>
            Submit improvements to your approved reward. Changes will be reviewed before going live.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!hasChanges && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You haven't made any changes yet. Modify the fields below to submit an update.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Reward Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alliance_tokens">Alliance Tokens</SelectItem>
                  <SelectItem value="experiences">Experiences</SelectItem>
                  <SelectItem value="merch">Merch</SelectItem>
                  <SelectItem value="gift_cards">Gift Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand (Optional)</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="e.g., Nike, Apple"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nctr">NCTR Value *</Label>
              <Input
                id="nctr"
                type="number"
                value={formData.nctr_value}
                onChange={(e) => setFormData(prev => ({ ...prev, nctr_value: parseInt(e.target.value) }))}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claims">Claim Passes *</Label>
              <Input
                id="claims"
                type="number"
                value={formData.claim_passes_required}
                onChange={(e) => setFormData(prev => ({ ...prev, claim_passes_required: parseInt(e.target.value) }))}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) }))}
                min="0"
              />
            </div>
          </div>

          <RewardImageGallery
            images={galleryImages}
            onChange={setGalleryImages}
            compact
          />

          <div className="space-y-2">
            <Label htmlFor="notes">What Changed? *</Label>
            <Textarea
              id="notes"
              value={formData.version_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, version_notes: e.target.value }))}
              placeholder="Describe the changes you made (e.g., 'Updated image for better quality', 'Increased stock quantity', 'Improved description')"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              This helps reviewers understand your updates
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !hasChanges}>
              {loading ? 'Submitting...' : 'Submit Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
