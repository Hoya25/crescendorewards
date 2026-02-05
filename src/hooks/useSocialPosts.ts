import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface SocialPost {
  id: string;
  reward_id: string | null;
  platform: string;
  post_content: string;
  post_url: string | null;
  status: string;
  scheduled_for: string | null;
  posted_at: string | null;
  auto_post: boolean;
  mentions: string[];
  hashtags: string[];
  reach_metrics: unknown | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  reward?: {
    id: string;
    title: string;
    category: string;
    image_url: string | null;
    is_active: boolean;
  } | null;
}

export interface MentionDefault {
  id: string;
  category: string;
  subcategory: string | null;
  default_mentions: string[];
  default_hashtags: string[];
}

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [mentionDefaults, setMentionDefaults] = useState<MentionDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_social_posts')
        .select(`
          *,
          reward:rewards(id, title, category, image_url, is_active)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Transform data to match interface
      const transformed: SocialPost[] = (data || []).map((p) => ({
        ...p,
        mentions: (p.mentions as string[]) || [],
        hashtags: (p.hashtags as string[]) || [],
        reward: p.reward as SocialPost['reward'],
      }));
      setPosts(transformed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load social posts';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadMentionDefaults = async () => {
    try {
      const { data, error } = await supabase
        .from('social_mention_defaults')
        .select('*')
        .order('category');

      if (error) throw error;
      // Transform data to match interface
      const transformed: MentionDefault[] = (data || []).map((d) => ({
        ...d,
        default_mentions: (d.default_mentions as string[]) || [],
        default_hashtags: (d.default_hashtags as string[]) || [],
      }));
      setMentionDefaults(transformed);
    } catch (error: unknown) {
      console.error('Failed to load mention defaults:', error);
    }
  };

  useEffect(() => {
    loadPosts();
    loadMentionDefaults();
  }, []);

  const createDraft = async (rewardId: string, content: string, mentions: string[] = [], hashtags: string[] = []) => {
    try {
      const { data, error } = await supabase
        .from('reward_social_posts')
        .insert({
          reward_id: rewardId,
          post_content: content,
          mentions,
          hashtags,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      await loadPosts();
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create draft';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return null;
    }
  };

  const updatePost = async (id: string, updates: { post_content?: string; mentions?: string[]; hashtags?: string[] }) => {
    try {
      const { error } = await supabase
        .from('reward_social_posts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadPosts();
      toast({ title: 'Success', description: 'Post updated' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update post';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reward_social_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPosts();
      toast({ title: 'Success', description: 'Post deleted' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete post';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const postNow = async (socialPostId?: string, rewardId?: string, customContent?: string) => {
    setPosting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-to-twitter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            social_post_id: socialPostId,
            reward_id: rewardId,
            custom_content: customContent,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to post to Twitter');
      }

      await loadPosts();
      toast({
        title: '🎉 Posted to X!',
        description: 'Your reward has been announced to followers.',
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to post';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return null;
    } finally {
      setPosting(false);
    }
  };

  const generatePostContent = async (rewardId: string): Promise<string | null> => {
    try {
      // Fetch reward
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('id, title, description, category')
        .eq('id', rewardId)
        .single();

      if (rewardError || !reward) return null;

      // Get category defaults
      const defaults = mentionDefaults.find(d => d.category === reward.category);
      const mentions = defaults?.default_mentions || [];
      const hashtags = defaults?.default_hashtags || [];

      // Generate content locally
      const baseUrl = 'https://crescendo.nctr.live/rewards';
      const rewardSlug = reward.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const rewardUrl = `${baseUrl}/${rewardSlug}`;

      const categoryEmojis: Record<string, string> = {
        gaming: '🎮',
        entertainment: '📺',
        experiences: '✨',
        subscriptions: '🔄',
        merch: '👕',
        gift_cards: '🎁',
        wellness: '💪',
        crypto: '🪙',
        alliance_tokens: '🌟',
        opportunity: '🚀',
      };

      const emoji = categoryEmojis[reward.category] || '🎯';
      const mentionStr = mentions.slice(0, 3).join(' ');
      const hashtagStr = hashtags.slice(0, 3).join(' ');

      let content = `${emoji} ${reward.title} is now available on Crescendo! ${mentionStr} ${rewardUrl} ${hashtagStr} #Crescendo #EarnDontBuy`;

      // Trim if too long
      if (content.length > 280) {
        content = `${emoji} ${reward.title} is now on Crescendo! ${rewardUrl} #Crescendo #EarnDontBuy`;
      }

      return content.slice(0, 280);
    } catch (error) {
      console.error('Error generating post content:', error);
      return null;
    }
  };

  const updateMentionDefault = async (id: string, updates: Partial<MentionDefault>) => {
    try {
      const { error } = await supabase
        .from('social_mention_defaults')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadMentionDefaults();
      toast({ title: 'Success', description: 'Defaults updated' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update defaults';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const createMentionDefault = async (data: {
    category: string;
    subcategory: string | null;
    default_mentions: string[];
    default_hashtags: string[];
  }) => {
    try {
      const { error } = await supabase
        .from('social_mention_defaults')
        .insert(data);

      if (error) throw error;
      await loadMentionDefaults();
      toast({ title: 'Success', description: 'Category defaults created' });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create defaults';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return false;
    }
  };

  const deleteMentionDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_mention_defaults')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadMentionDefaults();
      toast({ title: 'Success', description: 'Category defaults deleted' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete defaults';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return {
    posts,
    mentionDefaults,
    loading,
    posting,
    loadPosts,
    createDraft,
    updatePost,
    deletePost,
    postNow,
    generatePostContent,
    updateMentionDefault,
    createMentionDefault,
    deleteMentionDefault,
    loadMentionDefaults,
  };
}
