import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coffee, UtensilsCrossed, IceCream, Pizza } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from '@/hooks/use-toast';

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
  onBack: () => void;
  onViewRewardDetail?: (rewardId: string) => void;
  claimBalance: number;
}

const categoryIcons = {
  coffee: Coffee,
  restaurant: UtensilsCrossed,
  dessert: IceCream,
  fastfood: Pizza,
};

export function FoodBeveragePage({ onBack, onViewRewardDetail, claimBalance }: FoodBeveragePageProps) {
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter for food & beverage related rewards
      const foodBevRewards = data?.filter(reward => 
        reward.title.toLowerCase().includes('cafe') ||
        reward.title.toLowerCase().includes('coffee') ||
        reward.title.toLowerCase().includes('bros') ||
        reward.title.toLowerCase().includes('restaurant') ||
        reward.title.toLowerCase().includes('food')
      ) || [];

      setRewards(foodBevRewards);
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

  const getCategoryFromTitle = (title: string): keyof typeof categoryIcons => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('coffee') || lowerTitle.includes('cafe') || lowerTitle.includes('bros')) return 'coffee';
    if (lowerTitle.includes('dessert') || lowerTitle.includes('ice cream')) return 'dessert';
    if (lowerTitle.includes('pizza') || lowerTitle.includes('burger')) return 'fastfood';
    return 'restaurant';
  };

  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards.filter(r => getCategoryFromTitle(r.title) === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Food & Beverage
              </h1>
              <p className="text-muted-foreground mt-1">
                Delicious rewards from your favorite restaurants and cafes
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size="sm"
          >
            All Items
          </Button>
          <Button
            variant={selectedCategory === 'coffee' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('coffee')}
            size="sm"
            className="gap-2"
          >
            <Coffee className="h-4 w-4" />
            Coffee & Cafes
          </Button>
          <Button
            variant={selectedCategory === 'restaurant' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('restaurant')}
            size="sm"
            className="gap-2"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Restaurants
          </Button>
          <Button
            variant={selectedCategory === 'fastfood' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('fastfood')}
            size="sm"
            className="gap-2"
          >
            <Pizza className="h-4 w-4" />
            Fast Food
          </Button>
          <Button
            variant={selectedCategory === 'dessert' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('dessert')}
            size="sm"
            className="gap-2"
          >
            <IceCream className="h-4 w-4" />
            Desserts
          </Button>
        </div>

        {/* Claim Balance Display */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Claim Balance</p>
                <p className="text-3xl font-bold">{claimBalance} Claims</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        {filteredRewards.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Rewards Available</h3>
              <p className="text-muted-foreground">
                Check back soon for delicious food & beverage rewards!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => {
              const categoryKey = getCategoryFromTitle(reward.title);
              const CategoryIcon = categoryIcons[categoryKey];
              const canAfford = claimBalance >= reward.cost;
              const isOutOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;

              return (
                <Card key={reward.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <ImageWithFallback
                      src={reward.image_url || '/placeholder.svg'}
                      alt={reward.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {reward.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
                        Featured
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CategoryIcon className="h-5 w-5 text-primary mt-1" />
                      <Badge variant="secondary" className="ml-auto">
                        {reward.cost} Claims
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{reward.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {reward.description}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={canAfford && !isOutOfStock ? 'default' : 'secondary'}
                      disabled={!canAfford || isOutOfStock}
                      onClick={() => onViewRewardDetail?.(reward.id)}
                    >
                      {isOutOfStock ? 'Out of Stock' : canAfford ? 'View Details' : 'Insufficient Claims'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
