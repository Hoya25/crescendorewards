import { Video, Image, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ContentFormat = 'video' | 'image' | 'written';

const FORMAT_OPTIONS: { value: ContentFormat; label: string; emoji: string; icon: typeof Video; description: string }[] = [
  { value: 'video', emoji: '🎬', label: 'Video', icon: Video, description: 'Product demo, tutorial, or behind the scenes' },
  { value: 'image', emoji: '📸', label: 'Images', icon: Image, description: 'Product photos, lifestyle shots' },
  { value: 'written', emoji: '📝', label: 'Written Content', icon: FileText, description: 'Tips, reviews, or guides' },
];

interface ContentTypeStepProps {
  format: ContentFormat | null;
  onSelect: (format: ContentFormat) => void;
}

export function ContentTypeStep({ format, onSelect }: ContentTypeStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What would you like to share?</CardTitle>
        <CardDescription>Choose the type of content you'd like to submit</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {FORMAT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-lg border transition-all text-center",
              format === opt.value
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <div>
              <p className="font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
