import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

const brands = [
  { name: 'Nike', logo: '/brands/nike-logo.png' },
  { name: 'Apple', logo: '/brands/apple-logo.png' },
  { name: 'Sephora', logo: '/brands/sephora-logo.png' },
  { name: 'Spotify', logo: '/brands/spotify-logo.png' },
  { name: 'Chipotle', logo: '/brands/chipotle-logo.png' },
  { name: 'Whole Foods', logo: '/brands/wholefoods-logo.png' },
  { name: 'Delta', logo: '/brands/delta-logo.png' },
  { name: 'Urban Outfitters', logo: '/brands/urbanoutfitters-logo.png' },
];

export function BrandLogosSection() {
  const navigate = useNavigate();
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/brands');
    } else {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-foreground">
          Shop 6,000+ Brands. Earn Every Time.
        </h2>
        <p className="text-center text-muted-foreground max-w-xl mx-auto mb-10">
          Same prices you'd pay anywhere. But when you shop through The Garden, every dollar earns NCTR.
        </p>

        <div className="grid grid-cols-4 gap-4 md:gap-6 mb-8">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="aspect-square rounded-xl border bg-background flex items-center justify-center p-3 md:p-5 hover:shadow-md transition-shadow"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-xl p-4 md:p-6 text-center mb-8 border">
          <p className="text-sm md:text-base text-muted-foreground">
            <span className="font-semibold text-foreground">Example:</span> Spend $100 at Nike → Earn up to 500 NCTR → Lock it → Level up your status → Unlock premium rewards
          </p>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleCTA}
            className="rounded-full gap-2"
          >
            See All Brands <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
