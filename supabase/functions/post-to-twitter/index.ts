import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// OAuth 1.0a implementation for Twitter API
// Twitter API endpoint is https://api.x.com/2/tweets

const TWITTER_API_URL = 'https://api.x.com/2/tweets';

interface PostRequest {
  reward_id?: string;
  social_post_id?: string;
  custom_content?: string;
}

// Generate random nonce
function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Percent encode a string per OAuth 1.0a spec
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

// Generate OAuth 1.0a signature
async function generateOAuthSignature(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): Promise<string> {
  // Sort and encode parameters
  const sortedParams = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&');

  // Create signature base string
  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;

  // Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(signatureBase);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return signatureBase64;
}

// Build Authorization header for OAuth 1.0a
async function buildOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  // OAuth parameters (excluding body parameters for POST with JSON)
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // Generate signature
  const signature = await generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    accessTokenSecret
  );

  // Add signature to params
  oauthParams.oauth_signature = signature;

  // Build header string
  const headerParts = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// Generate engaging post content
function generatePostContent(reward: {
  title: string;
  description: string;
  category: string;
  id: string;
}, mentions: string[], hashtags: string[]): string {
  const baseUrl = 'https://crescendo.nctr.live/rewards';
  const rewardSlug = reward.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const rewardUrl = `${baseUrl}/${rewardSlug}`;

  // Category-specific hooks
  const hooks: Record<string, string[]> = {
    gaming: ['🎮', 'Level up your rewards game!', 'Gamers, this one is for you!'],
    entertainment: ['📺', 'Entertainment unlocked!', 'Your next binge is waiting!'],
    experiences: ['✨', 'Experiences money can not buy!', 'Create memories, not transactions!'],
    subscriptions: ['🔄', 'Subscribe without spending!', 'Premium access, no purchase needed!'],
    merch: ['👕', 'Fresh merch alert!', 'Rep your favorites!'],
    gift_cards: ['🎁', 'Gift yourself something nice!', 'Turn loyalty into spending power!'],
    wellness: ['💪', 'Invest in yourself!', 'Your wellness journey starts here!'],
    crypto: ['🪙', 'Earn your way into Web3!', 'Crypto rewards, no wallet required!'],
    alliance_tokens: ['🌟', 'Exclusive NCTR rewards!', 'Alliance benefits unlocked!'],
    opportunity: ['🚀', 'Opportunity knocks!', 'Your next big break awaits!'],
  };

  const categoryHooks = hooks[reward.category] || ['🎯', 'New reward available!'];
  const emoji = categoryHooks[0];
  const hook = categoryHooks[Math.floor(Math.random() * (categoryHooks.length - 1)) + 1];

  // Build mention string
  const mentionStr = mentions.length > 0 ? ` ${mentions.slice(0, 3).join(' ')}` : '';

  // Build hashtag string
  const hashtagStr = hashtags.length > 0 ? ` ${hashtags.slice(0, 3).join(' ')}` : '';

  // Always add Crescendo and NCTR hashtags
  const crescendoHashtags = ' #Crescendo #EarnDontBuy';

  // Calculate available space for title
  // 280 max - emoji(2) - hook(~40) - url(~50) - mentions(~40) - hashtags(~50) - crescendoHashtags(~25) - spaces(~10)
  const reservedChars = 2 + hook.length + rewardUrl.length + mentionStr.length + hashtagStr.length + crescendoHashtags.length + 20;
  const maxTitleLength = Math.min(280 - reservedChars, 60);
  const truncatedTitle = reward.title.length > maxTitleLength
    ? reward.title.slice(0, maxTitleLength - 3) + '...'
    : reward.title;

  // Construct the tweet
  let tweet = `${emoji} ${truncatedTitle} is now available on Crescendo! ${hook}${mentionStr} ${rewardUrl}${hashtagStr}${crescendoHashtags}`;

  // Ensure we don't exceed 280 chars
  if (tweet.length > 280) {
    // Trim hashtags first
    tweet = `${emoji} ${truncatedTitle} is now available on Crescendo!${mentionStr} ${rewardUrl}${crescendoHashtags}`;
    if (tweet.length > 280) {
      // Remove mentions if still too long
      tweet = `${emoji} ${truncatedTitle} is now available on Crescendo! ${rewardUrl}${crescendoHashtags}`;
    }
    if (tweet.length > 280) {
      // Final fallback
      tweet = `${emoji} New reward: ${truncatedTitle} ${rewardUrl} #Crescendo`;
    }
  }

  return tweet.slice(0, 280);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Twitter credentials
    const twitterApiKey = Deno.env.get('TWITTER_API_KEY');
    const twitterApiSecret = Deno.env.get('TWITTER_API_SECRET');
    const twitterAccessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
    const twitterAccessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');

    if (!twitterApiKey || !twitterApiSecret || !twitterAccessToken || !twitterAccessTokenSecret) {
      return new Response(JSON.stringify({ error: 'Twitter credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: PostRequest = await req.json();
    const { reward_id, social_post_id, custom_content } = body;

    let postContent: string;
    let rewardId: string;
    let mentions: string[] = [];
    let hashtags: string[] = [];

    if (social_post_id) {
      // Use existing social post
      const { data: socialPost, error: postError } = await supabase
        .from('reward_social_posts')
        .select('*, rewards(id, title, description, category)')
        .eq('id', social_post_id)
        .single();

      if (postError || !socialPost) {
        return new Response(JSON.stringify({ error: 'Social post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      postContent = socialPost.post_content;
      rewardId = socialPost.reward_id;
      mentions = socialPost.mentions || [];
      hashtags = socialPost.hashtags || [];
    } else if (reward_id) {
      rewardId = reward_id;

      // Fetch reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('id, title, description, category')
        .eq('id', reward_id)
        .single();

      if (rewardError || !reward) {
        return new Response(JSON.stringify({ error: 'Reward not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch category defaults
      const { data: defaults } = await supabase
        .from('social_mention_defaults')
        .select('default_mentions, default_hashtags')
        .eq('category', reward.category)
        .maybeSingle();

      if (defaults) {
        mentions = defaults.default_mentions || [];
        hashtags = defaults.default_hashtags || [];
      }

      if (custom_content) {
        postContent = custom_content;
      } else {
        postContent = generatePostContent(reward, mentions, hashtags);
      }
    } else {
      return new Response(JSON.stringify({ error: 'Either reward_id or social_post_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build OAuth header
    const oauthHeader = await buildOAuthHeader(
      'POST',
      TWITTER_API_URL,
      twitterApiKey,
      twitterApiSecret,
      twitterAccessToken,
      twitterAccessTokenSecret
    );

    // Post to Twitter
    const twitterResponse = await fetch(TWITTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: postContent }),
    });

    const twitterData = await twitterResponse.json();

    if (!twitterResponse.ok) {
      console.error('Twitter API error:', twitterData);

      // Update or create social post with error
      if (social_post_id) {
        await supabase
          .from('reward_social_posts')
          .update({
            status: 'failed',
            error_message: twitterData.detail || twitterData.title || JSON.stringify(twitterData),
          })
          .eq('id', social_post_id);
      } else {
        await supabase
          .from('reward_social_posts')
          .insert({
            reward_id: rewardId,
            post_content: postContent,
            mentions,
            hashtags,
            status: 'failed',
            error_message: twitterData.detail || twitterData.title || JSON.stringify(twitterData),
          });
      }

      return new Response(JSON.stringify({
        success: false,
        error: twitterData.detail || twitterData.title || 'Failed to post to Twitter',
        twitter_error: twitterData,
      }), {
        status: twitterResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tweetId = twitterData.data?.id;
    const postUrl = tweetId ? `https://x.com/crescendoreward/status/${tweetId}` : null;

    // Update or create social post record
    if (social_post_id) {
      await supabase
        .from('reward_social_posts')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          post_url: postUrl,
          error_message: null,
        })
        .eq('id', social_post_id);

      // Update reward with twitter_post_id
      await supabase
        .from('rewards')
        .update({ twitter_post_id: social_post_id })
        .eq('id', rewardId);
    } else {
      // Create new social post
      const { data: newPost } = await supabase
        .from('reward_social_posts')
        .insert({
          reward_id: rewardId,
          post_content: postContent,
          post_url: postUrl,
          mentions,
          hashtags,
          status: 'posted',
          posted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (newPost) {
        await supabase
          .from('rewards')
          .update({ twitter_post_id: newPost.id })
          .eq('id', rewardId);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tweet_id: tweetId,
      post_url: postUrl,
      content: postContent,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error posting to Twitter:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
