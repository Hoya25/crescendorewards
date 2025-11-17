import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { validateImageFile } from '@/lib/image-validation';

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
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = ''; // Reset file input
      return;
    }

    try {
      setUploadingImage(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reward-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reward-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.version_notes.trim()) {
      toast.error('Please describe what changes you made');
      return;
    }

    setLoading(true);
    try {
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
        p_image_url: formData.image_url || null,
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
    formData.image_url !== (submission.image_url || '');

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

          <div className="space-y-2">
            <Label>Reward Image</Label>
            <div className="flex gap-4 items-start">
              {formData.image_url && (
                <ImageWithFallback
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  {uploadingImage ? 'Uploading...' : 'Upload a new image to replace the current one'}
                </p>
              </div>
            </div>
          </div>

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
            <Button type="submit" disabled={loading || !hasChanges || uploadingImage}>
              {loading ? 'Submitting...' : 'Submit Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
