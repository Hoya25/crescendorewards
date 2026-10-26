import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ImageWithFallback';

interface StatusPerk {
  id: string;
  title: string;
  image_url: string | null;
  min_tier_required: string | null;
  stock_quantity: number | null;
}

export function StatusPerksSection() {
  const navigate = useNavigate();
  const [perks, setPerks] = useState<StatusPerk[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, image_url, min_tier_required, stock_quantity')
        .eq('is_active', true)
        .eq('cost', 0)
        .not('min_tier_required', 'is', null)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('Error loading status perks:', error);
        return;
      }
      setPerks(data || []);
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  if (perks.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pt-6 pb-2 max-w-full">
      <div className="flex items-center gap-2.5 mb-4">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Status Perks</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {perks.map(perk => (
          <Card key={perk.id} className="overflow-hidden rounded-none bg-card border-border">
            <div className="relative aspect-[4/3] bg-muted">
              <ImageWithFallback src={perk.image_url || ''} alt={perk.title} className="w-full h-full object-cover object-center" />
            </div>
            <div className="p-4 space-y-3">
              <Badge variant="secondary">✦ Status Perk</Badge>
              <h3 className="font-semibold text-foreground">{perk.title}</h3>
              <p className="text-sm capitalize text-muted-foreground">{perk.min_tier_required}+</p>
              {perk.stock_quantity !== null && (
                <p className="text-xs text-muted-foreground">{perk.stock_quantity} remaining</p>
              )}
              <Button className="w-full rounded-none" onClick={() => navigate(`/rewards/${perk.id}`)}>View Perk</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
