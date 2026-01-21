import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  Sponsor,
  SponsoredReward,
  MemberRewardPrice,
  SponsorType,
} from '@/types/sponsorship';

interface SponsorsFilters {
  type?: SponsorType;
  tier?: string;
  search?: string;
  verified?: boolean;
}

interface UseSponsorshipsReturn {
  sponsors: Sponsor[];
  featuredSponsors: Sponsor[];
  loading: boolean;
  error: Error | null;
  // Actions
  getSponsors: (filters?: SponsorsFilters) => Promise<Sponsor[]>;
  getSponsorBySlug: (slug: string) => Promise<Sponsor | null>;
  getSponsorRewards: (sponsorId: string) => Promise<SponsoredReward[]>;
  getSponsoredRewards: () => Promise<SponsoredReward[]>;
  getRewardPriceForMember: (rewardId: string, memberTier: string) => Promise<MemberRewardPrice | null>;
  refresh: () => Promise<void>;
}

export function useSponsorships(): UseSponsorshipsReturn {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [featuredSponsors, setFeaturedSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSponsors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('total_claims', { ascending: false });

      if (fetchError) throw fetchError;

      const sponsorsList = (data || []) as Sponsor[];
      setSponsors(sponsorsList);

      // Featured sponsors are platinum, gold, or mission tier
      const featured = sponsorsList.filter((s) =>
        ['platinum', 'gold', 'mission'].includes(s.tier)
      );
      setFeaturedSponsors(featured);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching sponsors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const getSponsors = async (filters?: SponsorsFilters): Promise<Sponsor[]> => {
    try {
      let query = supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true);

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.tier) {
        query = query.eq('tier', filters.tier);
      }
      if (filters?.verified !== undefined) {
        query = query.eq('is_verified', filters.verified);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('total_claims', { ascending: false });

      if (error) throw error;
      return (data || []) as Sponsor[];
    } catch (err) {
      console.error('Error getting sponsors:', err);
      return [];
    }
  };

  const getSponsorBySlug = async (slug: string): Promise<Sponsor | null> => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as Sponsor | null;
    } catch (err) {
      console.error('Error getting sponsor by slug:', err);
      return null;
    }
  };

  const getSponsorRewards = async (sponsorId: string): Promise<SponsoredReward[]> => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('linked_sponsor_id', sponsorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SponsoredReward[];
    } catch (err) {
      console.error('Error getting sponsor rewards:', err);
      return [];
    }
  };

  const getSponsoredRewards = async (): Promise<SponsoredReward[]> => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          sponsor:sponsors!linked_sponsor_id (
            id,
            name,
            slug,
            logo_url,
            tier,
            is_verified
          )
        `)
        .eq('is_active', true)
        .eq('is_sponsored', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SponsoredReward[];
    } catch (err) {
      console.error('Error getting sponsored rewards:', err);
      return [];
    }
  };

  const getRewardPriceForMember = async (
    rewardId: string,
    memberTier: string
  ): Promise<MemberRewardPrice | null> => {
    try {
      const { data, error } = await supabase.rpc('get_member_reward_price', {
        p_reward_id: rewardId,
        p_member_tier: memberTier.toLowerCase(),
      });

      if (error) throw error;
      return data as unknown as MemberRewardPrice;
    } catch (err) {
      console.error('Error getting member reward price:', err);
      return null;
    }
  };

  return {
    sponsors,
    featuredSponsors,
    loading,
    error,
    getSponsors,
    getSponsorBySlug,
    getSponsorRewards,
    getSponsoredRewards,
    getRewardPriceForMember,
    refresh: fetchSponsors,
  };
}

// Helper hook for admin sponsor management
export function useAdminSponsorships() {
  const [loading, setLoading] = useState(false);

  const getAllSponsors = async (): Promise<Sponsor[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Sponsor[];
    } catch (err) {
      console.error('Error getting all sponsors:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getApplications = async (status?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('sponsor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting applications:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateSponsor = async (id: string, updates: Partial<Sponsor>): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { settings, ...restUpdates } = updates;
      const updatePayload: Record<string, unknown> = {
        ...restUpdates,
        updated_at: new Date().toISOString(),
      };
      if (settings !== undefined) {
        updatePayload.settings = settings as unknown;
      }
      
      const { error } = await supabase
        .from('sponsors')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating sponsor:', err);
      return false;
    }
  };

  const approveSponsor = async (sponsorId: string): Promise<boolean> => {
    return updateSponsor(sponsorId, { is_verified: true });
  };

  const deactivateSponsor = async (sponsorId: string): Promise<boolean> => {
    return updateSponsor(sponsorId, { is_active: false });
  };

  const reviewApplication = async (
    applicationId: string,
    status: 'approved' | 'rejected' | 'more_info',
    adminNotes?: string,
    reviewerId?: string
  ): Promise<boolean> => {
    try {
      const updates: Record<string, unknown> = {
        status,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
      };
      
      if (reviewerId) {
        updates.reviewed_by = reviewerId;
      }

      const { error } = await supabase
        .from('sponsor_applications')
        .update(updates)
        .eq('id', applicationId);

      if (error) throw error;

      // If approved, create sponsor profile from application
      if (status === 'approved') {
        const { data: app } = await supabase
          .from('sponsor_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (app) {
          const slug = app.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          await supabase.from('sponsors').insert({
            user_id: app.user_id,
            type: app.type,
            name: app.company_name,
            slug,
            contact_email: app.contact_email,
            website_url: app.website_url,
            description: app.description,
            tier: 'community',
            is_verified: true,
            is_active: true,
          });
        }
      }

      return true;
    } catch (err) {
      console.error('Error reviewing application:', err);
      return false;
    }
  };

  return {
    loading,
    getAllSponsors,
    getApplications,
    updateSponsor,
    approveSponsor,
    deactivateSponsor,
    reviewApplication,
  };
}
