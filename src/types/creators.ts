export interface FeaturedCreator {
  id: string;
  user_id?: string | null;
  name: string;
  handle: string | null;
  platform: string;
  profile_url: string | null;
  image_url: string;
  category: string | null;
  bio: string | null;
  follower_count: number | null;
  is_verified: boolean;
  is_active: boolean;
  display_priority: number;
  created_at: string;
}

export interface RewardFeaturedCreator {
  id: string;
  reward_id: string;
  creator_id: string;
  display_order: number;
  created_at: string;
  creator?: FeaturedCreator;
}
