import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BrandDetailPageProps {
  brandId: string;
  onBack: () => void;
}

interface EarnOpportunity {
  title: string;
  description: string;
  link: string;
}

interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  base_earning_rate: number;
  logo_emoji: string;
  logo_color: string;
  earn_opportunities: EarnOpportunity[];
}

export function BrandDetailPage({ brandId, onBack }: BrandDetailPageProps) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrand();
  }, [brandId]);

  const loadBrand = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();

      if (error) throw error;
      setBrand({ ...data, earn_opportunities: (data.earn_opportunities as any) || [] });
    } catch (error: any) {
      console.error('Error loading brand:', error);
      toast.error('Failed to load brand details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (link: string, title: string) => {
    window.open(link, '_blank');
    toast.success(`Opening ${title}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Brand not found</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Brands
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const opportunities = brand.earn_opportunities || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Brands
          </Button>
        </div>
      </header>

      {/* Brand Header */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div 
                className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl flex-shrink-0"
                style={{ backgroundColor: brand.logo_color }}
              >
                {brand.logo_emoji}
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{brand.name}</CardTitle>
                <CardDescription className="text-base">{brand.description}</CardDescription>
                <div className="flex gap-4 mt-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Category: </span>
                    <span className="font-medium">{brand.category}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Base Earning Rate: </span>
                    <span className="font-medium text-primary">{brand.base_earning_rate}% NCTR</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Earn Opportunities */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Earn Opportunities</h2>
          {opportunities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No earn opportunities available yet. Check back soon!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((opportunity, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                    <CardDescription>{opportunity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleOpenLink(opportunity.link, opportunity.title)}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Link
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
