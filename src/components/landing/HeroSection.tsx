import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroSectionProps {
  onJoin: () => void;
}

export function HeroSection({ onJoin }: HeroSectionProps) {
  const [memberCount, setMemberCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from('unified_profiles')
          .select('id', { count: 'exact', head: true });
        if (count) setMemberCount(count);
      } catch {
        // fail silently
      }
    };
    fetchCount();
  }, []);

  const displayCount = memberCount > 10 ? memberCount : null;

  return (
    <section className="relative pt-20 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cta/5 via-background to-background -z-10" />
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 text-foreground leading-[1.1]">
          Get Rewarded for the Things You Already Do
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Shop at 6,000+ brands. Create content. Rep the community.
          Earn real rewards that grow the more you commit.
        </p>
        <Button
          size="lg"
          onClick={onJoin}
          className="bg-cta hover:bg-cta/90 text-cta-foreground font-bold text-lg px-10 py-6 rounded-full shadow-lg shadow-cta/25 transition-all hover:shadow-xl hover:shadow-cta/30 hover:scale-[1.02]"
        >
          Join Crescendo — It's Free <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="mt-5 text-sm text-muted-foreground">
          {displayCount
            ? `Join ${displayCount.toLocaleString()}+ members already earning`
            : 'Join our growing community of earners'}
        </p>
      </div>
    </section>
  );
}
