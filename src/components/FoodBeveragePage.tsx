import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coffee, UtensilsCrossed, IceCream, Pizza } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
}

interface FoodBeveragePageProps {
  claimBalance: number;
}

const categoryIcons = {
  coffee: Coffee,
  restaurant: UtensilsCrossed,
  dessert: IceCream,
  fastfood: Pizza,
};

export function FoodBeveragePage({ claimBalance }: FoodBeveragePageProps) {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchFoodBeverageRewards();
  }, []);

  const fetchFoodBeverageRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'gift_cards')
        .order('is_featured', { ascending: false })
        .order('cost', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load food & beverage rewards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8" />
            Food & Beverage
          </h1>
          <p className="text-muted-foreground mt-1">
            Gift cards and rewards from your favorite food spots
          </p>
        </div>

        {rewards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Coffee className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Food & Beverage Rewards</h3>
              <p className="text-muted-foreground">Check back later for tasty rewards!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card 
                key={reward.id} 
                className="cursor-pointer hover:border-violet-300 transition-colors"
                onClick={() => navigate(`/rewards/${reward.id}`)}
              >
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <ImageWithFallback
                    src={reward.image_url || '/placeholder.svg'}
                    alt={reward.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    {reward.is_featured && (
                      <Badge className="bg-amber-100 text-amber-700">Featured</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {reward.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <Badge variant="secondary">{reward.cost} Claims</Badge>
                  {reward.stock_quantity !== null && (
                    <span className="text-sm text-muted-foreground">
                      {reward.stock_quantity} left
                    </span>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
