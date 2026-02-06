import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function SocialProofSection() {
  const [memberCount, setMemberCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count, error } = await supabase
          .from('unified_profiles')
          .select('id', { count: 'exact', head: true });

        if (!error && count) {
          setMemberCount(count);
        }
      } catch {
        // fail silently
      }
    };
    fetchCount();
  }, []);

  const displayCount = memberCount > 10 ? memberCount : null;

  return (
    <section className="py-12 md:py-16 px-4 md:px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Avatar circles */}
          <div className="flex -space-x-2">
            {['🟣', '🔵', '🟢', '🟠'].map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 border-2 border-background flex items-center justify-center text-xs"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
        <p className="text-lg md:text-xl font-semibold text-foreground">
          {displayCount ? (
            <>Join {displayCount.toLocaleString()}+ members already earning rewards</>
          ) : (
            <>Join members already earning rewards</>
          )}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          No credit card required. Start earning in minutes.
        </p>
      </div>
    </section>
  );
}
