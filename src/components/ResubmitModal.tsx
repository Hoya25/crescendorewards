import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { useClaimValue } from '@/hooks/useClaimValue';

interface ResubmitModalProps {
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
    admin_notes: string | null;
    floor_usd_amount?: number | null;
    lock_option?: string | null;
  };
  onSuccess: () => void;
}

// Extract rejection reason from admin notes
function extractRejectionReason(adminNotes: string | null): string {
  if (!adminNotes) return 'No specific reason provided';
  // Look for rejection patterns
  const patterns = [
    /rejected.*?:\s*(.+)/i,
    /reason:\s*(.+)/i,
  ];
  for (const pattern of patterns) {
    const match = adminNotes.match(pattern);
    if (match) return match[1].trim();
  }
  return adminNotes;
}

export function ResubmitModal({ open, onClose, submission, onSuccess }: ResubmitModalProps) {
  const [loading, setLoading] = useState(false);
  const { claimValue, getClaimsRequired } = useClaimValue();
  
  const [formData, setFormData] = useState({
    title: submission.title,
    description: submission.description,
    category: submission.category,
    brand: submission.brand || '',
    nctr_value: submission.nctr_value,
    floor_usd_amount: submission.floor_usd_amount || 0,
    stock_quantity: submission.stock_quantity || 0,
    image_url: submission.image_url || '',
    version_notes: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const rejectionReason = extractRejectionReason(submission.admin_notes);
  const claimsRequired = getClaimsRequired(formData.floor_usd_amount);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = '';
      return;
    }

    try {
      setUploadingImage(true);

      const { file: compressedFile, originalSize, compressedSize, compressionRatio } = 
        await compressImageWithStats(file);

      if (compressionRatio > 0.1) {
        toast.success(
          `Image compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${(compressionRatio * 100).toFixed(0)}% reduction)`
        );
      }

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reward-images')
        .upload(filePath, compressedFile);

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
      toast.error('Please describe what changes you made to address the rejection');
      return;
    }

    setLoading(true);
    try {
      // Create a new submission linked to the original via parent_submission_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reward_submissions')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          brand: formData.brand || null,
          reward_type: submission.reward_type,
          lock_rate: submission.lock_rate,
          lock_option: submission.lock_option,
          nctr_value: formData.nctr_value,
          floor_usd_amount: formData.floor_usd_amount,
          claims_required: claimsRequired,
          claim_passes_required: claimsRequired,
          claim_value_at_submission: claimValue,
          stock_quantity: formData.stock_quantity || null,
          image_url: formData.image_url || null,
          status: 'pending',
          version: (submission as any).version ? (submission as any).version + 1 : 2,
          parent_submission_id: submission.id,
          is_latest_version: true,
          version_notes: `Resubmission: ${formData.version_notes}`,
        });

      if (error) throw error;

      // Mark original as not latest version
      await supabase
        .from('reward_submissions')
        .update({ is_latest_version: false })
        .eq('id', submission.id);

      toast.success('Resubmission sent for review!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error resubmitting:', error);
      toast.error(error.message || 'Failed to resubmit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resubmit with Changes</DialogTitle>
          <DialogDescription>
            Address the feedback below and submit an updated version for review.
          </DialogDescription>
        </DialogHeader>

        {/* Rejection Reason Alert */}
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>This submission was rejected</AlertTitle>
          <AlertDescription className="mt-2">
            <span className="font-medium">Reason:</span> {rejectionReason}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="subscriptions">Subscriptions</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor Amount (USD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="floor"
                  type="number"
                  className="pl-7"
                  value={formData.floor_usd_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor_usd_amount: parseInt(e.target.value) || 0 }))}
                  min="1"
                  required
                />
              </div>
              {formData.floor_usd_amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  = {claimsRequired} Claims required (at ${claimValue} each)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) }))}
                min="0"
                placeholder="0 = unlimited"
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
                  {uploadingImage ? 'Uploading...' : 'Upload a new image if needed'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">What Did You Change? *</Label>
            <Textarea
              id="notes"
              value={formData.version_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, version_notes: e.target.value }))}
              placeholder="Describe how you addressed the rejection feedback (e.g., 'Added more detail to description', 'Updated image quality')"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Explain what you changed to address the rejection reason
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingImage}>
              {loading ? 'Submitting...' : 'Resubmit for Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
