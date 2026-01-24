import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Sparkles, ChevronUp } from 'lucide-react';
import { PartnerBenefitCard, AlliancePartner } from './PartnerBenefitCard';
import { ActiveBenefitCard, MemberActiveBenefit } from './ActiveBenefitCard';
import { ActivateBenefitModal } from './ActivateBenefitModal';
import { cn } from '@/lib/utils';

// Categories for filtering
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'health', label: 'Health' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'learning', label: 'Learning' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'finance', label: 'Finance' },
  { id: 'travel', label: 'Travel' },
  { id: 'creator', label: 'Creator' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'exclusive', label: 'Exclusive' },
];

// Tier order for comparison
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export function BenefitsPage() {
  const { profile, tier } = useUnifiedUser();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activatePartner, setActivatePartner] = useState<AlliancePartner | null>(null);

  const userTier = tier?.tier_name?.toLowerCase() || 'bronze';
  const userTierDisplayName = tier?.display_name || 'Bronze';
  const userTierIndex = TIER_ORDER.indexOf(userTier);
  const unifiedProfileId = profile?.id;

  // Fetch user's tier benefit slots
  const { data: tierData } = useQuery({
    queryKey: ['tier-benefit-slots', userTier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_tiers')
        .select('benefit_slots')
        .eq('tier_name', userTier)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const totalSlots = tierData?.benefit_slots || 1;

  // Fetch all alliance partners
  const { data: partners, isLoading: partnersLoading } = useQuery({
    queryKey: ['alliance-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alliance_partners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('monthly_value', { ascending: false });

      if (error) throw error;
      return data as AlliancePartner[];
    },
  });

  // Fetch user's active benefits
  const { data: activeBenefits, isLoading: benefitsLoading, refetch: refetchBenefits } = useQuery({
    queryKey: ['member-active-benefits', unifiedProfileId],
    queryFn: async () => {
      if (!unifiedProfileId) return [];
      
      const { data, error } = await supabase
        .from('member_active_benefits')
        .select(`
          *,
          partner:alliance_partners(*)
        `)
        .eq('user_id', unifiedProfileId);

      if (error) throw error;
      return data as MemberActiveBenefit[];
    },
    enabled: !!unifiedProfileId,
  });

  // Calculate used slots
  const usedSlots = activeBenefits?.reduce((sum, b) => sum + (b.slots_used || 1), 0) || 0;
  const availableSlots = totalSlots - usedSlots;

  // Get set of activated partner IDs
  const activatedPartnerIds = new Set(activeBenefits?.map(b => b.partner_id) || []);

  // Filter and categorize partners
  const { availablePartners, lockedPartners } = useMemo(() => {
    if (!partners) return { availablePartners: [], lockedPartners: [] };

    const filtered = selectedCategory === 'all' 
      ? partners 
      : partners.filter(p => p.category === selectedCategory);

    const available: AlliancePartner[] = [];
    const locked: AlliancePartner[] = [];

    filtered.forEach(partner => {
      const requiredTierIndex = TIER_ORDER.indexOf(partner.min_tier.toLowerCase());
      if (userTierIndex >= requiredTierIndex) {
        available.push(partner);
      } else {
        locked.push(partner);
      }
    });

    return { availablePartners: available, lockedPartners: locked };
  }, [partners, selectedCategory, userTierIndex]);

  const handleManageBenefit = (benefit: MemberActiveBenefit) => {
    // TODO: Implement manage modal
    console.log('Manage benefit:', benefit);
  };

  const handleActivationSuccess = () => {
    refetchBenefits();
  };

  const isLoading = partnersLoading || benefitsLoading;

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Alliance Partner Benefits</h1>
        <p className="text-muted-foreground">Exclusive perks and subscriptions included with your membership</p>
      </div>

      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border">
          <div className="flex items-center gap-4">
            <StatusBadge tier={tier} showName={false} size="lg" />
            <div>
              <h2 className="text-lg font-semibold">{userTierDisplayName} Member</h2>
              <p className="text-sm text-muted-foreground">
                {usedSlots} of {totalSlots} benefit slots used
              </p>
            </div>
          </div>

          {/* Slots indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSlots }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-colors",
                  i < usedSlots 
                    ? "bg-primary border-primary" 
                    : "bg-background border-muted-foreground/30"
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {availableSlots} available
            </span>
          </div>
        </div>

        {/* Active Benefits Section */}
        {activeBenefits && activeBenefits.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">Your Active Benefits</h2>
              <Badge variant="secondary">{activeBenefits.length}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeBenefits.map(benefit => (
                <ActiveBenefitCard 
                  key={benefit.id} 
                  benefit={benefit}
                  onManage={handleManageBenefit}
                />
              ))}
            </div>
          </section>
        )}

        {/* Browse Benefits Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Browse Benefits</h2>
          
          {/* Category Tabs */}
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="inline-flex h-9 w-max">
                {CATEGORIES.map(cat => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="text-xs px-3"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          )}

          {/* Available benefits grid */}
          {!isLoading && availablePartners.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availablePartners.map(partner => (
                <PartnerBenefitCard
                  key={partner.id}
                  partner={partner}
                  userTier={userTier}
                  isActivated={activatedPartnerIds.has(partner.id)}
                  onActivate={setActivatePartner}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && availablePartners.length === 0 && lockedPartners.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No benefits found in this category.
            </div>
          )}
        </section>

        {/* Locked Benefits Section */}
        {!isLoading && lockedPartners.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-muted-foreground">
                Unlock More Benefits
              </h2>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 mb-4">
                <ChevronUp className="w-4 h-4 text-primary" />
                <p className="text-sm">
                  <span className="font-medium">Upgrade your tier</span> to unlock these {lockedPartners.length} additional benefits
                </p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lockedPartners.map(partner => (
                  <PartnerBenefitCard
                    key={partner.id}
                    partner={partner}
                    userTier={userTier}
                    isActivated={false}
                    onActivate={() => {}}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Activation Modal */}
      <ActivateBenefitModal
        open={!!activatePartner}
        onOpenChange={(open) => !open && setActivatePartner(null)}
        partner={activatePartner}
        userId={unifiedProfileId || ''}
        availableSlots={availableSlots}
        totalSlots={totalSlots}
        onSuccess={handleActivationSuccess}
      />
    </PageContainer>
  );
}

export default BenefitsPage;
