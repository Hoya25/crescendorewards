import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link as LinkIcon, Upload } from 'lucide-react';
import type { ContentFormat } from './ContentTypeStep';

const VIDEO_CATEGORIES = [
  'Product Demo / Tutorial',
  'Behind the Scenes',
  'Testimonial / Review',
  'Unboxing',
  'Tips & Tricks',
  'Brand Story',
  'Other',
];

const IMAGE_CATEGORIES = ['Product Photos', 'Lifestyle', 'Infographic'];
const WRITTEN_CATEGORIES = ['Review', 'Tip', 'Guide', 'Story'];

function getVideoThumbnail(url: string): string | null {
  try {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  } catch {}
  return null;
}

interface ContentDetailsStepProps {
  format: ContentFormat;
  title: string;
  description: string;
  mediaUrl: string;
  contentType: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onMediaUrlChange: (v: string) => void;
  onContentTypeChange: (v: string) => void;
}

export function ContentDetailsStep({
  format, title, description, mediaUrl, contentType,
  onTitleChange, onDescriptionChange, onMediaUrlChange, onContentTypeChange,
}: ContentDetailsStepProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (format === 'video' && mediaUrl) {
      setThumbnail(getVideoThumbnail(mediaUrl));
    } else {
      setThumbnail(null);
    }
  }, [mediaUrl, format]);

  const categories = format === 'video' ? VIDEO_CATEGORIES : format === 'image' ? IMAGE_CATEGORIES : WRITTEN_CATEGORIES;
  const maxDesc = format === 'written' ? 2000 : 500;
  const minDesc = format === 'written' ? 50 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {format === 'video' && (
          <div className="space-y-2">
            <Label>Video URL <span className="text-destructive">*</span></Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={mediaUrl}
                onChange={e => onMediaUrlChange(e.target.value)}
                placeholder="Paste YouTube, Vimeo, or TikTok URL"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">We support YouTube, Vimeo, TikTok, and Instagram video links</p>
            {thumbnail && (
              <div className="mt-2 rounded-lg overflow-hidden border max-w-xs">
                <img src={thumbnail} alt="Video preview" className="w-full h-auto" />
              </div>
            )}
          </div>
        )}

        {format === 'image' && (
          <div className="space-y-2">
            <Label>Image URL</Label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={mediaUrl}
                onChange={e => onMediaUrlChange(e.target.value)}
                placeholder="Paste image URL (jpg, png, webp)"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">Accepted: jpg, png, webp — max 5MB</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>{format === 'image' ? 'Caption' : 'Title'} <span className="text-destructive">*</span></Label>
          <Input
            value={title}
            onChange={e => onTitleChange(e.target.value.slice(0, 100))}
            placeholder="Give your content a title"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
        </div>

        <div className="space-y-2">
          <Label>{format === 'written' ? 'Content' : 'Description'} {format === 'written' && <span className="text-destructive">*</span>}</Label>
          <Textarea
            value={description}
            onChange={e => onDescriptionChange(e.target.value.slice(0, maxDesc))}
            placeholder={format === 'written' ? 'Write your review, tip, or guide...' : 'Tell viewers what this is about'}
            className="min-h-[120px]"
            maxLength={maxDesc}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {minDesc > 0 && <span>{description.length < minDesc ? `Min ${minDesc} characters` : ''}</span>}
            <span className="ml-auto">{description.length}/{maxDesc}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category <span className="text-destructive">*</span></Label>
          <Select value={contentType} onValueChange={onContentTypeChange}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
