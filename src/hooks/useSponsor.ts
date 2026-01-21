import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import type {
  Sponsor,
  SponsorshipCampaign,
  SponsoredReward,
  SponsorApplication,
  SponsorStats,
  SponsorType,
  SponsorTier,
  ContributionModel,
  TierPricing,
} from '@/types/sponsorship';

interface UseSponsorReturn {
  sponsor: Sponsor | null;
  loading: boolean;
  error: Error | null;
  stats: SponsorStats | null;
  rewards: SponsoredReward[];
  campaigns: SponsorshipCampaign[];
  applications: SponsorApplication[];
  // Actions
  createSponsorProfile: (data: CreateSponsorData) => Promise<Sponsor | null>;
  updateSponsorProfile: (data: Partial<Sponsor>) => Promise<boolean>;
  createCampaign: (data: CreateCampaignData) => Promise<SponsorshipCampaign | null>;
  updateCampaign: (id: string, data: Partial<SponsorshipCampaign>) => Promise<boolean>;
  createSponsoredReward: (data: CreateSponsoredRewardData) => Promise<string | null>;
  updateSponsoredReward: (id: string, data: Partial<SponsoredReward>) => Promise<boolean>;
  submitApplication: (data: SubmitApplicationData) => Promise<boolean>;
  refresh: () => Promise<void>;
}

interface CreateSponsorData {
  type: SponsorType;
  name: string;
  slug?: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  website_url?: string;
  contact_email?: string;
  social_links?: Record<string, string>;
}

interface CreateCampaignData {
  name: string;
  description?: string;
  campaign_type?: 'ongoing' | 'limited_time' | 'event' | 'mission_aligned';
  budget_total?: number;
  start_date?: string;
  end_date?: string;
  target_tiers?: string[];
}

interface CreateSponsoredRewardData {
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url?: string;
  contribution_model: ContributionModel;
  campaign_id?: string;
  sponsor_message?: string;
  sponsor_cta_text?: string;
  sponsor_cta_url?: string;
  cost_per_claim?: number;
  revenue_share_percent?: number;
  status_tier_claims_cost?: TierPricing;
  stock_quantity?: number;
}

interface SubmitApplicationData {
  type: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  website_url?: string;
  description?: string;
  intended_contribution?: string;
}

export function useSponsor(): UseSponsorReturn {
  const { profile } = useUnifiedUser();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<SponsorStats | null>(null);
  const [rewards, setRewards] = useState<SponsoredReward[]>([]);
  const [campaigns, setCampaigns] = useState<SponsorshipCampaign[]>([]);
  const [applications, setApplications] = useState<SponsorApplication[]>([]);

  const fetchSponsorData = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch sponsor profile
      const { data: sponsorData, error: sponsorError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (sponsorError) throw sponsorError;

      if (sponsorData) {
        setSponsor(sponsorData as Sponsor);

        // Fetch stats
        const { data: statsData } = await supabase.rpc('get_sponsor_stats', {
          p_sponsor_id: sponsorData.id,
        });
        if (statsData) {
          setStats(statsData as unknown as SponsorStats);
        }

        // Fetch rewards
        const { data: rewardsData } = await supabase
          .from('rewards')
          .select('*')
          .eq('linked_sponsor_id', sponsorData.id)
          .order('created_at', { ascending: false });
        
        if (rewardsData) {
          setRewards(rewardsData as unknown as SponsoredReward[]);
        }

        // Fetch campaigns
        const { data: campaignsData } = await supabase
          .from('sponsorship_campaigns')
          .select('*')
          .eq('sponsor_id', sponsorData.id)
          .order('created_at', { ascending: false });
        
        if (campaignsData) {
          setCampaigns(campaignsData as unknown as SponsorshipCampaign[]);
        }
      }

      // Fetch applications
      const { data: appsData } = await supabase
        .from('sponsor_applications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (appsData) {
        setApplications(appsData as SponsorApplication[]);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching sponsor data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchSponsorData();
  }, [fetchSponsorData]);

  const createSponsorProfile = async (data: CreateSponsorData): Promise<Sponsor | null> => {
    if (!profile?.id) {
      toast.error('You must be logged in to create a sponsor profile');
      return null;
    }

    try {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const { data: newSponsor, error } = await supabase
        .from('sponsors')
        .insert({
          ...data,
          user_id: profile.id,
          slug,
          tier: 'community' as SponsorTier,
          is_verified: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSponsor(newSponsor as Sponsor);
      toast.success('Sponsor profile created successfully!');
      return newSponsor as Sponsor;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sponsor profile';
      toast.error(errorMessage);
      return null;
    }
  };

  const updateSponsorProfile = async (data: Partial<Sponsor>): Promise<boolean> => {
    if (!sponsor?.id) {
      toast.error('No sponsor profile found');
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { settings, ...restData } = data;
      const updatePayload: Record<string, unknown> = {
        ...restData,
        updated_at: new Date().toISOString(),
      };
      if (settings !== undefined) {
        updatePayload.settings = settings as unknown;
      }
      
      const { error } = await supabase
        .from('sponsors')
        .update(updatePayload)
        .eq('id', sponsor.id);

      if (error) throw error;

      setSponsor((prev) => prev ? { ...prev, ...data } : null);
      toast.success('Profile updated successfully!');
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(errorMessage);
      return false;
    }
  };

  const createCampaign = async (data: CreateCampaignData): Promise<SponsorshipCampaign | null> => {
    if (!sponsor?.id) {
      toast.error('You must have a sponsor profile to create campaigns');
      return null;
    }

    try {
      const { data: newCampaign, error } = await supabase
        .from('sponsorship_campaigns')
        .insert({
          ...data,
          sponsor_id: sponsor.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns((prev) => [newCampaign as SponsorshipCampaign, ...prev]);
      toast.success('Campaign created successfully!');
      return newCampaign as SponsorshipCampaign;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      toast.error(errorMessage);
      return null;
    }
  };

  const updateCampaign = async (id: string, data: Partial<SponsorshipCampaign>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sponsorship_campaigns')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      toast.success('Campaign updated successfully!');
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign';
      toast.error(errorMessage);
      return false;
    }
  };

  const createSponsoredReward = async (data: CreateSponsoredRewardData): Promise<string | null> => {
    if (!sponsor?.id) {
      toast.error('You must have a sponsor profile to create rewards');
      return null;
    }

    try {
      const { data: newReward, error } = await supabase
        .from('rewards')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          cost: data.cost,
          image_url: data.image_url,
          contribution_model: data.contribution_model,
          linked_sponsor_id: sponsor.id,
          campaign_id: data.campaign_id,
          sponsor_message: data.sponsor_message,
          sponsor_cta_text: data.sponsor_cta_text,
          sponsor_cta_url: data.sponsor_cta_url,
          cost_per_claim: data.cost_per_claim,
          revenue_share_percent: data.revenue_share_percent,
          status_tier_claims_cost: data.status_tier_claims_cost,
          stock_quantity: data.stock_quantity,
          is_active: sponsor.is_verified, // Only auto-activate if verified
          is_sponsored: true,
          sponsor_enabled: true,
          sponsor_name: sponsor.name,
          sponsor_logo: sponsor.logo_url,
        })
        .select('id')
        .single();

      if (error) throw error;

      await fetchSponsorData();
      toast.success(sponsor.is_verified ? 'Reward published!' : 'Reward submitted for review!');
      return newReward.id;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reward';
      toast.error(errorMessage);
      return null;
    }
  };

  const updateSponsoredReward = async (id: string, data: Partial<SponsoredReward>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setRewards((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      );
      toast.success('Reward updated successfully!');
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reward';
      toast.error(errorMessage);
      return false;
    }
  };

  const submitApplication = async (data: SubmitApplicationData): Promise<boolean> => {
    try {
      const insertPayload = {
        type: data.type,
        company_name: data.company_name,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        website_url: data.website_url || null,
        description: data.description || null,
        intended_contribution: data.intended_contribution || null,
        status: 'pending' as const,
        user_id: profile?.id || null,
      };

      const { error } = await supabase
        .from('sponsor_applications')
        .insert(insertPayload);

      if (error) throw error;

      await fetchSponsorData();
      toast.success('Application submitted! We\'ll review it within 24-48 hours.');
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit application';
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    sponsor,
    loading,
    error,
    stats,
    rewards,
    campaigns,
    applications,
    createSponsorProfile,
    updateSponsorProfile,
    createCampaign,
    updateCampaign,
    createSponsoredReward,
    updateSponsoredReward,
    submitApplication,
    refresh: fetchSponsorData,
  };
}
