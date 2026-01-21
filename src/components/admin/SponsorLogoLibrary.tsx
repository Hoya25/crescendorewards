import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SponsorLogoLibraryProps {
  onSelect: (url: string) => void;
  currentLogo: string | null;
}

interface StoredLogo {
  name: string;
  url: string;
  created_at: string;
}

/**
 * Displays previously uploaded sponsor logos for quick reuse
 */
export function SponsorLogoLibrary({ onSelect, currentLogo }: SponsorLogoLibraryProps) {
  const [logos, setLogos] = useState<StoredLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: listError } = await supabase.storage
        .from('sponsor-logos')
        .list('', {
          limit: 50,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) throw listError;

      if (!data || data.length === 0) {
        setLogos([]);
        return;
      }

      // Filter out placeholder files and get URLs
      const logoFiles = data
        .filter(file => file.name && !file.name.startsWith('.'))
        .map(file => {
          const { data: urlData } = supabase.storage
            .from('sponsor-logos')
            .getPublicUrl(file.name);
          
          return {
            name: file.name,
            url: urlData.publicUrl,
            created_at: file.created_at || ''
          };
        });

      setLogos(logoFiles);
    } catch (err) {
      console.error('Error fetching logos:', err);
      setError('Failed to load logo library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Library className="w-3 h-3" />
          <span>Logo Library</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="aspect-square rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Library className="w-3 h-3" />
            <span>Logo Library</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={fetchLogos}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-destructive">{error}</p>
      </div>
    );
  }

  if (logos.length === 0) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Library className="w-3 h-3" />
          <span>Logo Library</span>
        </div>
        <p className="text-xs text-muted-foreground italic">No logos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Library className="w-3 h-3" />
          <span>Logo Library ({logos.length})</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={fetchLogos}
          title="Refresh library"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="h-24">
        <div className="grid grid-cols-5 gap-1.5">
          {logos.map((logo) => {
            const isSelected = currentLogo === logo.url;
            return (
              <button
                key={logo.name}
                type="button"
                onClick={() => onSelect(logo.url)}
                className={cn(
                  "relative aspect-square rounded border p-1.5 bg-muted/50 hover:bg-muted transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  isSelected && "ring-2 ring-primary bg-primary/10"
                )}
                title={logo.name}
              >
                <img
                  src={logo.url}
                  alt={logo.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
