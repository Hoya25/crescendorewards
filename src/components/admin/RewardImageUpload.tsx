import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2, ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImageFile } from '@/lib/image-validation';

const BUCKET = 'reward-assets';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface RewardImageUploadProps {
  rewardId: string;
  currentImageUrl: string | null;
  onUploaded: (url: string) => void;
  /** Compact mode for inline table use */
  compact?: boolean;
}

export function RewardImageUpload({ rewardId, currentImageUrl, onUploaded, compact = false }: RewardImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({ title: 'Invalid image', description: validation.error, variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `rewards/${rewardId}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (error) throw error;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

      // Update reward record
      const { error: updateErr } = await supabase
        .from('rewards')
        .update({ image_url: publicUrl })
        .eq('id', rewardId);
      if (updateErr) throw updateErr;

      onUploaded(publicUrl);
      toast({ title: 'Image uploaded', description: 'Reward image updated successfully' });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  if (compact) {
    return (
      <div
        className="relative group cursor-pointer"
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt=""
            className="w-10 h-10 object-cover rounded-lg border"
          />
        ) : (
          <div className="w-10 h-10 bg-muted rounded-lg border flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className={cn(
          "absolute inset-0 rounded-lg flex items-center justify-center transition-opacity",
          uploading ? "bg-black/50 opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"
        )}>
          {uploading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Upload className="w-4 h-4 text-white" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {currentImageUrl && (
        <div className="relative aspect-video w-full max-w-[200px] rounded-lg overflow-hidden border">
          <img src={currentImageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 flex items-center gap-3 cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">{currentImageUrl ? 'Replace image' : 'Upload image'}</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP • Max 5MB</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
