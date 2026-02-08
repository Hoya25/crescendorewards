import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, ChevronRight, Play, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useNavigate } from 'react-router-dom';

interface SpotlightBrand {
  id: string;
  name: string;
  description: string;
  hero_video_url: string | null;
  image_url: string | null;
  logo_emoji: string;
  logo_color: string;
  shop_url: string;
  category: string;
  base_earning_rate: number;
}

interface BrandSpotlightProps {
  brand: SpotlightBrand;
}

export function BrandSpotlight({ brand }: BrandSpotlightProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        Partner Spotlight
      </h2>
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Visual half */}
          <div
            className="relative min-h-[200px] md:min-h-[280px] flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${brand.logo_color}22, hsl(var(--muted)))`,
            }}
          >
            {brand.image_url ? (
              <ImageWithFallback
                src={brand.image_url}
                alt={brand.name}
                className="w-32 h-32 object-contain"
              />
            ) : (
              <span className="text-[80px]">{brand.logo_emoji}</span>
            )}
            {brand.hero_video_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-foreground ml-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Content half */}
          <CardContent className="p-6 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-3">
              {brand.image_url ? (
                <ImageWithFallback
                  src={brand.image_url}
                  alt={brand.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span className="text-xl">{brand.logo_emoji}</span>
              )}
              <h3 className="text-xl font-bold">{brand.name}</h3>
            </div>

            <p className="text-sm text-muted-foreground">{brand.description}</p>

            <p className="text-xs text-muted-foreground italic">
              Earn {brand.base_earning_rate} NCTR per $1 spent
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => navigate(`/brands/${brand.id}`)}
              >
                See Rewards <ChevronRight className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => window.open(brand.shop_url, '_blank')}
              >
                Shop {brand.name} <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </section>
  );
}
