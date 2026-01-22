import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EarningOpportunity, EarningCategory, EarnType } from '@/types/earning';

export function useEarningOpportunities() {
  const [opportunities, setOpportunities] = useState<EarningOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function fetchOpportunities() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('earning_opportunities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const transformed: EarningOpportunity[] = (data || []).map(opp => ({
        id: opp.id,
        name: opp.name,
        slug: opp.slug,
        description: opp.description,
        shortDescription: opp.short_description,
        iconName: opp.icon_name,
        iconUrl: opp.icon_url,
        backgroundColor: opp.background_color,
        category: opp.category as EarningCategory,
        earnType: opp.earn_type as EarnType,
        earnPotential: opp.earn_potential,
        ctaText: opp.cta_text,
        ctaUrl: opp.cta_url,
        opensInNewTab: opp.opens_in_new_tab,
        isFeatured: opp.is_featured,
        isActive: opp.is_active,
        isComingSoon: opp.is_coming_soon,
        comingSoonText: opp.coming_soon_text,
        sortOrder: opp.sort_order,
        requirements: opp.requirements as string[] | undefined,
        tags: opp.tags,
        stats: opp.stats as EarningOpportunity['stats'],
      }));

      setOpportunities(transformed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setIsLoading(false);
    }
  }

  const featured = opportunities.filter(o => o.isFeatured && !o.isComingSoon);
  const comingSoon = opportunities.filter(o => o.isComingSoon);
  const active = opportunities.filter(o => !o.isComingSoon);
  const byCategory = (category: EarningCategory) => opportunities.filter(o => o.category === category && !o.isComingSoon);

  return {
    opportunities,
    featured,
    comingSoon,
    active,
    byCategory,
    isLoading,
    error,
    refresh: fetchOpportunities,
  };
}
