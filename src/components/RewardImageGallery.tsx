import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, X, GripVertical, Loader2, ImageIcon } from 'lucide-react';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { cn } from '@/lib/utils';

const MAX_IMAGES = 8;

export interface GalleryImage {
  id?: string; // DB id if persisted
  url: string;
  file?: File; // Only for new uploads not yet saved
  displayOrder: number;
  altText?: string;
}

interface RewardImageGalleryProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
  /** When true, shows a compact layout */
  compact?: boolean;
}

export function RewardImageGallery({
  images,
  onChange,
  maxImages = MAX_IMAGES,
  disabled = false,
  compact = false,
}: RewardImageGalleryProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const validateAndAdd = useCallback((files: File[]) => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast({ title: 'Maximum images reached', description: `Up to ${maxImages} images allowed`, variant: 'destructive' });
      return;
    }

    const toAdd = files.slice(0, remaining);
    const newImages: GalleryImage[] = [];

    toAdd.forEach((file) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast({ title: 'Invalid image', description: validation.error, variant: 'destructive' });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      newImages.push({
        url: previewUrl,
        file,
        displayOrder: images.length + newImages.length,
      });
    });

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  }, [images, maxImages, onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndAdd(files);
    e.target.value = '';
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // Only handle file drops (not reorder drops)
    if (e.dataTransfer.files.length > 0 && dragIndex === null) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      validateAndAdd(files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemove = (index: number) => {
    const img = images[index];
    // Revoke blob URL if it's a local preview
    if (img.file && img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url);
    }
    const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, displayOrder: i }));
    onChange(updated);
  };

  // Reorder via drag
  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...images];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    onChange(updated.map((img, i) => ({ ...img, displayOrder: i })));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleReorderDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const inputId = `gallery-upload-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Reward Images
        </span>
        <span className="text-xs text-muted-foreground">{images.length}/{maxImages}</span>
      </Label>

      {/* Image grid with reordering */}
      {images.length > 0 && (
        <div className={cn(
          "grid gap-2",
          compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"
        )}>
          {images.map((img, index) => (
            <div
              key={img.id || img.url}
              draggable={!disabled}
              onDragStart={(e) => handleReorderDragStart(e, index)}
              onDragOver={(e) => handleReorderDragOver(e, index)}
              onDrop={(e) => handleReorderDrop(e, index)}
              onDragEnd={handleReorderDragEnd}
              className={cn(
                "relative aspect-video rounded-lg overflow-hidden border group transition-all",
                dragOverIndex === index && dragIndex !== null && "ring-2 ring-primary",
                dragIndex === index && "opacity-40",
                !disabled && "cursor-grab active:cursor-grabbing"
              )}
            >
              <img
                src={img.url}
                alt={img.altText || `Image ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <div className="absolute top-1 left-1 flex items-center gap-1">
                {!disabled && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white drop-shadow" />
                  </div>
                )}
                <Badge variant="secondary" className="text-[10px] py-0 h-5">
                  {index === 0 ? 'Primary' : `#${index + 1}`}
                </Badge>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {img.file && (
                <div className="absolute bottom-1 right-1">
                  <Badge variant="outline" className="text-[10px] py-0 h-5 bg-background/80">
                    New
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload drop zone */}
      {!disabled && images.length < maxImages && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropFiles}
          className={cn(
            "w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
            compact ? "h-24" : "h-32",
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <Upload className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {images.length === 0 ? 'Drag & drop or click to upload' : 'Add more images'}
          </p>
          <p className="text-xs text-muted-foreground/70">PNG/JPG/WebP • Max 5MB • Up to {maxImages} images</p>
          <Input
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Uploads new gallery images to storage and saves all to reward_images table.
 * Returns the primary image URL for backwards compat with rewards.image_url.
 */
export async function saveGalleryImages(
  rewardId: string,
  images: GalleryImage[],
  uploadedBy?: string,
): Promise<{ primaryUrl: string | null; allUrls: string[] }> {
  const uploadedUrls: string[] = [];

  // Upload any new files first
  for (const img of images) {
    if (img.file) {
      const { file: compressed, originalSize, compressedSize, compressionRatio } =
        await compressImageWithStats(img.file);
      if (compressionRatio > 0.1) {
        toast({
          title: 'Image Compressed',
          description: `${formatBytes(originalSize)} → ${formatBytes(compressedSize)}`,
        });
      }
      const ext = compressed.name.split('.').pop();
      const fileName = `rewards/${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('reward-images')
        .upload(fileName, compressed, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('reward-images').getPublicUrl(fileName);
      uploadedUrls.push(publicUrl);
    } else {
      uploadedUrls.push(img.url);
    }
  }

  // Delete existing gallery rows for this reward, then insert fresh
  await supabase.from('reward_images').delete().eq('reward_id', rewardId);

  if (uploadedUrls.length > 0) {
    const rows = uploadedUrls.map((url, i) => ({
      reward_id: rewardId,
      image_url: url,
      display_order: i,
      uploaded_by: uploadedBy || null,
    }));
    const { error } = await supabase.from('reward_images').insert(rows);
    if (error) {
      console.error('Failed to save gallery images:', error);
      // Non-fatal — primary image is still set on the reward itself
    }
  }

  return {
    primaryUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
    allUrls: uploadedUrls,
  };
}

/**
 * Loads gallery images for a reward from the reward_images table.
 * Falls back to the reward's image_url if no gallery rows exist.
 */
export async function loadGalleryImages(
  rewardId: string,
  fallbackImageUrl?: string | null,
): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from('reward_images')
    .select('id, image_url, display_order, alt_text')
    .eq('reward_id', rewardId)
    .order('display_order', { ascending: true });

  if (error || !data || data.length === 0) {
    // Fall back to primary image
    if (fallbackImageUrl) {
      return [{ url: fallbackImageUrl, displayOrder: 0 }];
    }
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    url: row.image_url,
    displayOrder: row.display_order,
    altText: row.alt_text || undefined,
  }));
}
