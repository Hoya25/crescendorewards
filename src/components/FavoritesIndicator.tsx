import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function FavoritesIndicator() {
  const navigate = useNavigate();
  const { favoritesCount, loading } = useFavorites();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/favorites')}
          >
            <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'text-red-500' : ''}`} />
            {!loading && favoritesCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs bg-red-500 hover:bg-red-500 text-white border-0"
              >
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{favoritesCount} {favoritesCount === 1 ? 'favorite' : 'favorites'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
