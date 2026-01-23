import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SlugAvailability {
  available: boolean;
  error?: string;
  slug: string;
}

interface SaveSlugResult {
  success: boolean;
  error?: string;
  slug?: string;
}

/**
 * Generate slug suggestions from a display name
 */
export function generateSlugSuggestions(displayName: string | null | undefined): string[] {
  if (!displayName) return [];
  
  const name = displayName.toLowerCase().trim();
  const parts = name.split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 0) return [];
  
  const suggestions: string[] = [];
  
  // First name only: anderson
  if (parts[0].length >= 3) {
    suggestions.push(parts[0].replace(/[^a-z0-9]/g, ''));
  }
  
  // Full name with hyphen: anderson-bell
  if (parts.length > 1) {
    const fullName = parts.map(p => p.replace(/[^a-z0-9]/g, '')).join('-');
    if (fullName.length >= 3 && fullName.length <= 30) {
      suggestions.push(fullName);
    }
  }
  
  // First name + last initial: anderson-b
  if (parts.length > 1 && parts[parts.length - 1].length > 0) {
    const firstLastInitial = `${parts[0].replace(/[^a-z0-9]/g, '')}-${parts[parts.length - 1][0]}`;
    if (firstLastInitial.length >= 3) {
      suggestions.push(firstLastInitial);
    }
  }
  
  // First name + random numbers: anderson123
  const firstName = parts[0].replace(/[^a-z0-9]/g, '');
  if (firstName.length >= 2) {
    suggestions.push(`${firstName}${Math.floor(Math.random() * 899) + 100}`);
  }
  
  // Filter valid slugs and deduplicate
  return [...new Set(
    suggestions
      .filter(s => s.length >= 3 && s.length <= 30)
      .filter(s => /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s) || (s.length === 3 && /^[a-z0-9]+$/.test(s)))
  )];
}

/**
 * Validate slug format on the client side
 */
export function validateSlugFormat(slug: string): { valid: boolean; error?: string } {
  const normalized = slug.toLowerCase().trim();
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Must be at least 3 characters' };
  }
  
  if (normalized.length > 30) {
    return { valid: false, error: 'Must be 30 characters or less' };
  }
  
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
  }
  
  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    return { valid: false, error: 'Cannot start or end with a hyphen' };
  }
  
  if (normalized.includes('--')) {
    return { valid: false, error: 'Cannot have consecutive hyphens' };
  }
  
  const reservedWords = [
    'admin', 'support', 'help', 'signup', 'login', 'join', 'invite',
    'api', 'app', 'www', 'dashboard', 'settings', 'profile', 'rewards',
    'earn', 'claim', 'claims', 'status', 'nctr', 'crescendo', 'test'
  ];
  
  if (reservedWords.includes(normalized)) {
    return { valid: false, error: 'This name is reserved' };
  }
  
  return { valid: true };
}

/**
 * Hook to manage user's referral slug
 */
export function useReferralSlug() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [checkingSlug, setCheckingSlug] = useState<string | null>(null);

  // Fetch current user's slug
  const { data: currentSlug, isLoading: isLoadingSlug } = useQuery({
    queryKey: ['referral-slug', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_slug')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.referral_slug || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Check slug availability
  const checkAvailability = useCallback(async (slug: string): Promise<SlugAvailability> => {
    // Client-side validation first
    const validation = validateSlugFormat(slug);
    if (!validation.valid) {
      return { available: false, error: validation.error, slug: slug.toLowerCase() };
    }
    
    setCheckingSlug(slug);
    
    try {
      const { data, error } = await supabase.rpc('check_slug_availability', {
        p_slug: slug,
        p_user_id: user?.id || null
      });
      
      if (error) throw error;
      
      const result = data as unknown as SlugAvailability;
      return result;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return { available: false, error: 'Failed to check availability', slug };
    } finally {
      setCheckingSlug(null);
    }
  }, [user?.id]);

  // Save slug mutation
  const saveSlugMutation = useMutation({
    mutationFn: async (slug: string): Promise<SaveSlugResult> => {
      const { data, error } = await supabase.rpc('save_referral_slug', {
        p_slug: slug
      });
      
      if (error) throw error;
      return data as unknown as SaveSlugResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['referral-slug'] });
        toast.success('Your personalized link has been saved!');
      } else {
        toast.error(result.error || 'Failed to save slug');
      }
    },
    onError: (error) => {
      console.error('Error saving slug:', error);
      toast.error('Failed to save your personalized link');
    },
  });

  return {
    currentSlug,
    isLoadingSlug,
    checkAvailability,
    checkingSlug,
    saveSlug: saveSlugMutation.mutateAsync,
    isSaving: saveSlugMutation.isPending,
  };
}

/**
 * Hook to look up a referral code by slug (for /join/:slug route)
 */
export function useSlugLookup(slug: string | undefined) {
  return useQuery({
    queryKey: ['slug-lookup', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase.rpc('get_referral_code_by_slug', {
        p_slug: slug
      });
      
      if (error) throw error;
      
      return data as { found: boolean; referral_code?: string; user_id?: string };
    },
    enabled: !!slug && slug.length >= 3,
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}
