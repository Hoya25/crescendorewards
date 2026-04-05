/**
 * NCTR Alliance MCP Server
 * ========================
 * Model Context Protocol server for AI agents to discover and interact
 * with the NCTR rewards program, bounties, and Impact Engines.
 *
 * Deployment: Supabase Edge Functions
 * Transport: Streamable HTTP (MCP specification standard)
 * Auth: Public (no authentication required)
 *
 * Tools:
 *   1. search_bounties     — Search and filter available bounties
 *   2. get_earning_rates   — Get earning rates by Crescendo tier
 *   3. check_tier_requirements — Check requirements for each tier
 *   4. get_active_promotions  — Get current promotions and limited offers
 *   5. get_onboarding_link    — Generate a member onboarding link
 *   6. get_ecosystem_funding  — Discover how the rewards pool is funded (Torus, DeFi, etc.)
 *   7. get_impact_engines     — Discover NCTR Impact Engine communities
 *
 * NCTR Alliance — https://nctr.live
 * The Garden — https://thegarden.nctr.live
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'

// ─────────────────────────────────────────────────────────────
// DATA: Bounties
// ─────────────────────────────────────────────────────────────

interface Bounty {
  id: string
  name: string
  category: 'entry' | 'revenue' | 'merch' | 'referral' | 'engagement'
  description: string
  amount: number
  currency: string
  lock_period: string
  lock_days: number
  repeatable: boolean
  requirements: string[]
  tags: string[]
}

const BOUNTIES: Bounty[] = [
  // ── Entry Bounties ──
  {
    id: 'bounty-signup',
    name: 'Sign-Up Bounty',
    category: 'entry',
    description: 'Create your NCTR account and complete onboarding. Earn 625 NCTR just for joining.',
    amount: 625,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Create account', 'Verify email', 'Complete profile'],
    tags: ['new-member', 'onboarding', 'easy']
  },
  {
    id: 'bounty-early-adopter',
    name: 'Early Adopter Bonus',
    category: 'entry',
    description: 'Launch period only — earn 1,250 NCTR as an early adopter. Available during launch period.',
    amount: 1250,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Join during launch period'],
    tags: ['limited-time', 'launch', 'bonus']
  },
  {
    id: 'bounty-profile-complete',
    name: 'Profile Completion Bounty',
    category: 'entry',
    description: 'Fill out your full profile including avatar, bio, and preferences. Earn 375 NCTR.',
    amount: 375,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Upload avatar', 'Write bio', 'Set preferences'],
    tags: ['onboarding', 'profile', 'easy']
  },
  // ── Revenue Bounties ──
  {
    id: 'bounty-first-purchase',
    name: 'First Purchase Bounty',
    category: 'revenue',
    description: 'Make your first purchase through The Garden and earn 2,500 NCTR.',
    amount: 2500,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Complete first purchase through The Garden'],
    tags: ['shopping', 'first-time', 'the-garden']
  },
  {
    id: 'bounty-shop-and-earn',
    name: 'Shop & Earn',
    category: 'revenue',
    description: 'Earn 250 NCTR per qualifying purchase through The Garden. No cap — earn every time you shop.',
    amount: 250,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Make a qualifying purchase through The Garden'],
    tags: ['shopping', 'recurring', 'the-garden', 'uncapped']
  },
  {
    id: 'bounty-quarterly-spend',
    name: 'Quarterly Spend Bounty',
    category: 'revenue',
    description: 'Hit the quarterly spend threshold and earn 5,000 NCTR. Resets each quarter.',
    amount: 5000,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Reach quarterly spend threshold'],
    tags: ['shopping', 'quarterly', 'milestone']
  },
  {
    id: 'bounty-annual-member',
    name: 'Annual Member Bounty',
    category: 'revenue',
    description: 'Maintain active membership for a full year and earn 10,000 NCTR.',
    amount: 10000,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Maintain active membership for 12 months'],
    tags: ['loyalty', 'annual', 'milestone']
  },
  {
    id: 'bounty-whale-spend',
    name: 'Whale Spend Bounty',
    category: 'revenue',
    description: 'Reach the top-tier annual spend level and earn 25,000 NCTR.',
    amount: 25000,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Reach top-tier annual spend threshold'],
    tags: ['premium', 'annual', 'high-value']
  },
  // ── Merch Bounties ──
  {
    id: 'bounty-merch-collection',
    name: 'Merch Collection Bounty',
    category: 'merch',
    description: 'Purchase from an NCTR merch collection and earn 5,000 NCTR.',
    amount: 5000,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Purchase from official NCTR merch collection'],
    tags: ['merch', 'collection', 'branded']
  },
  {
    id: 'bounty-merch-repeat',
    name: 'Merch Repeat Bounty',
    category: 'merch',
    description: 'Earn 500 NCTR for each additional merch purchase.',
    amount: 500,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Purchase additional merch items'],
    tags: ['merch', 'recurring']
  },
  // ── Referral Bounties ──
  {
    id: 'bounty-referral-signup',
    name: 'Referral Sign-Up Bounty',
    category: 'referral',
    description: 'Refer a friend who creates an account. Earn 625 NCTR per referral.',
    amount: 625,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Referred friend creates account'],
    tags: ['referral', 'friend', 'recurring']
  },
  {
    id: 'bounty-referral-purchase',
    name: 'Referral Purchase Bounty',
    category: 'referral',
    description: 'Earn 2,500 NCTR when your referral makes their first purchase.',
    amount: 2500,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Referred friend completes first purchase'],
    tags: ['referral', 'purchase', 'recurring']
  },
  {
    id: 'bounty-early-referral',
    name: 'Early Referral Bonus',
    category: 'referral',
    description: 'Launch period referral bonus — earn 500 NCTR per referral during early access.',
    amount: 500,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Refer during launch period'],
    tags: ['referral', 'launch', 'limited-time']
  },
  {
    id: 'bounty-referral-milestone-5',
    name: 'Referral Milestone — 5 Friends',
    category: 'referral',
    description: 'Refer 5 friends who all sign up. Earn a 2,500 NCTR milestone bonus.',
    amount: 2500,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['5 referred friends create accounts'],
    tags: ['referral', 'milestone']
  },
  {
    id: 'bounty-referral-milestone-20',
    name: 'Referral Milestone — 20 Friends',
    category: 'referral',
    description: 'Refer 20 friends who all sign up. Earn a 5,000 NCTR milestone bonus.',
    amount: 5000,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['20 referred friends create accounts'],
    tags: ['referral', 'milestone', 'ambassador']
  },
  // ── Engagement Bounties ──
  {
    id: 'bounty-social-share',
    name: 'Social Share Bounty',
    category: 'engagement',
    description: 'Share NCTR on social media and earn 500 NCTR.',
    amount: 500,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Share NCTR content on social media', 'Tag @NCTRAlliance'],
    tags: ['social', 'sharing', 'easy']
  },
  {
    id: 'bounty-monthly-engagement',
    name: 'Monthly Engagement Bounty',
    category: 'engagement',
    description: 'Stay active each month — earn 250 NCTR per month, up to 4 months.',
    amount: 250,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: true,
    requirements: ['Log in and complete qualifying activity each month'],
    tags: ['monthly', 'activity', 'recurring']
  },
  {
    id: 'bounty-community-contributor',
    name: 'Community Contributor Bounty',
    category: 'engagement',
    description: 'Make a meaningful contribution to the NCTR community and earn 2,000 NCTR.',
    amount: 2000,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Submit approved community contribution'],
    tags: ['community', 'contribution']
  },
  {
    id: 'bounty-impact-engine-join',
    name: 'Impact Engine Join Bounty',
    category: 'engagement',
    description: 'Join an Impact Engine community and earn 5,000 NCTR.',
    amount: 5000,
    currency: 'NCTR',
    lock_period: '360LOCK',
    lock_days: 360,
    repeatable: false,
    requirements: ['Join any Impact Engine community'],
    tags: ['impact-engine', 'community', 'joining']
  }
]

// ─────────────────────────────────────────────────────────────
// DATA: Crescendo Status Tiers
// ─────────────────────────────────────────────────────────────

interface Tier {
  name: string
  threshold: number
  multiplier: number
  description: string
  perks: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Bronze',
    threshold: 1000,
    multiplier: 1.0,
    description: 'Starting tier — members with 1,000+ NCTR locked. Base earning rate on all bounties.',
    perks: ['Access to all standard bounties', 'The Garden shopping', 'Community access']
  },
  {
    name: 'Silver',
    threshold: 5000,
    multiplier: 1.25,
    description: 'Committed members with 5,000+ NCTR locked. 1.25x earning multiplier.',
    perks: ['1.25x earning multiplier', 'Early access to new bounties', 'Silver badge']
  },
  {
    name: 'Gold',
    threshold: 15000,
    multiplier: 1.5,
    description: 'Active members with 15,000+ NCTR locked. 1.5x earning multiplier.',
    perks: ['1.5x earning multiplier', 'Exclusive Gold bounties', 'Priority support', 'Gold badge']
  },
  {
    name: 'Platinum',
    threshold: 40000,
    multiplier: 1.8,
    description: 'Power members with 40,000+ NCTR locked. 1.8x earning multiplier.',
    perks: ['1.8x earning multiplier', 'VIP experiences', 'Platinum-only drops', 'Platinum badge']
  },
  {
    name: 'Diamond',
    threshold: 100000,
    multiplier: 2.5,
    description: 'Top-tier members with 100,000+ NCTR locked. 2.5x earning multiplier.',
    perks: ['2.5x earning multiplier', 'Founding member recognition', 'Diamond-exclusive events', 'Diamond badge', 'Direct team access']
  }
]

// ─────────────────────────────────────────────────────────────
// DATA: Impact Engines
// ─────────────────────────────────────────────────────────────

interface ImpactEngine {
  name: string
  slug: string
  category: string
  description: string
  status: string
}

const IMPACT_ENGINES: ImpactEngine[] = [
  {
    name: 'THROTTLE',
    slug: 'throttle',
    category: 'Powersports',
    description: 'The powersports community within NCTR. Connecting riders, racers, and off-road enthusiasts through shared rewards.',
    status: 'active'
  },
  {
    name: 'GROUNDBALL',
    slug: 'groundball',
    category: 'Lacrosse',
    description: 'The lacrosse community within NCTR. Uniting players, coaches, and fans at every level of the sport.',
    status: 'active'
  },
  {
    name: 'STARDUST',
    slug: 'stardust',
    category: 'Entertainment',
    description: 'The entertainment community within NCTR. Connecting creators, performers, and fans across music, film, and live events.',
    status: 'active'
  },
  {
    name: 'SWEAT',
    slug: 'sweat',
    category: 'Skilled Trades',
    description: 'The skilled trades community within NCTR. Supporting tradespeople, apprentices, and craftworkers.',
    status: 'active'
  },
  {
    name: 'SISU',
    slug: 'sisu',
    category: 'Recovery',
    description: 'The recovery community within NCTR. A judgment-free space for people on recovery journeys.',
    status: 'active'
  },
  {
    name: 'INSPIRATION',
    slug: 'inspiration',
    category: 'Wellness',
    description: 'The wellness community within NCTR. Focused on mindfulness, fitness, nutrition, and holistic well-being.',
    status: 'active'
  }
]

// ─────────────────────────────────────────────────────────────
// DATA: Active Promotions
// ─────────────────────────────────────────────────────────────

interface Promotion {
  name: string
  description: string
  type: string
  bounty_id: string | null
  active: boolean
  details: string
}

const PROMOTIONS: Promotion[] = [
  {
    name: 'Early Adopter Bonus',
    description: 'Earn 1,250 NCTR just for joining during the launch period. No counter, no slot limit — available while the launch window is open.',
    type: 'launch-bonus',
    bounty_id: 'bounty-early-adopter',
    active: true,
    details: 'Launch period only. 1,250 NCTR with 360LOCK. Open to all new members.'
  },
  {
    name: 'Early Referral Bonus',
    description: 'During the launch period, earn 500 NCTR for each friend you refer (instead of standard 100 NCTR post-launch).',
    type: 'referral-boost',
    bounty_id: 'bounty-early-referral',
    active: true,
    details: 'Launch period only. 5x the standard referral rate. No cap on referrals.'
  }
]

// ─────────────────────────────────────────────────────────────
// MCP SERVER
// ─────────────────────────────────────────────────────────────

const app = new Hono()

const server = new McpServer({
  name: 'nctr-alliance',
  version: '1.0.0',
})

// ── Tool 1: search_bounties ──

server.registerTool(
  'search_bounties',
  {
    title: 'Search Bounties',
    description:
      'Search and filter available NCTR bounties. Filter by category (entry, revenue, merch, referral, engagement), minimum/maximum NCTR amount, or keyword. Returns bounty details including name, amount, lock period, and requirements. All bounties use 360LOCK — tokens stay yours after the lock period.',
    inputSchema: {
      category: z
        .enum(['entry', 'revenue', 'merch', 'referral', 'engagement'])
        .optional()
        .describe('Filter by bounty category'),
      min_amount: z.number().optional().describe('Minimum NCTR amount'),
      max_amount: z.number().optional().describe('Maximum NCTR amount'),
      keyword: z
        .string()
        .optional()
        .describe('Search keyword to match against bounty name, description, or tags'),
      repeatable_only: z
        .boolean()
        .optional()
        .describe('If true, only return bounties that can be earned multiple times'),
    },
  },
  ({ category, min_amount, max_amount, keyword, repeatable_only }) => {
    let results = [...BOUNTIES]

    if (category) {
      results = results.filter((b) => b.category === category)
    }
    if (min_amount !== undefined) {
      results = results.filter((b) => b.amount >= min_amount)
    }
    if (max_amount !== undefined) {
      results = results.filter((b) => b.amount <= max_amount)
    }
    if (keyword) {
      const kw = keyword.toLowerCase()
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(kw) ||
          b.description.toLowerCase().includes(kw) ||
          b.tags.some((t) => t.includes(kw))
      )
    }
    if (repeatable_only) {
      results = results.filter((b) => b.repeatable)
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No bounties found matching your filters. Try broadening your search — there are 19 bounties across 5 categories.',
          },
        ],
      }
    }

    const formatted = results.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      amount: `${b.amount.toLocaleString()} NCTR`,
      lock: b.lock_period,
      repeatable: b.repeatable,
      description: b.description,
      requirements: b.requirements,
    }))

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              total: results.length,
              bounties: formatted,
              note: 'All bounties use 360LOCK (exactly 360 days). Tokens are committed, not spent — they stay yours after the lock period.',
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ── Tool 2: get_earning_rates ──

server.registerTool(
  'get_earning_rates',
  {
    title: 'Get Earning Rates',
    description:
      'Get NCTR earning rates for a specific Crescendo status tier, or compare all tiers. Shows the multiplier applied to bounty earnings at each tier level. Higher tiers earn more NCTR per bounty.',
    inputSchema: {
      tier: z
        .enum(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'])
        .optional()
        .describe('Specific tier to check. Omit to see all tiers.'),
      bounty_id: z
        .string()
        .optional()
        .describe('Optional bounty ID to calculate tier-adjusted earning amount'),
    },
  },
  ({ tier, bounty_id }) => {
    let tiers = [...TIERS]
    if (tier) {
      tiers = tiers.filter((t) => t.name === tier)
    }

    const bounty = bounty_id ? BOUNTIES.find((b) => b.id === bounty_id) : null

    const formatted = tiers.map((t) => {
      const result: Record<string, unknown> = {
        tier: t.name,
        nctr_threshold: `${t.threshold.toLocaleString()} NCTR`,
        multiplier: `${t.multiplier}x`,
        description: t.description,
        perks: t.perks,
      }

      if (bounty) {
        const adjusted = Math.floor(bounty.amount * t.multiplier)
        result.bounty_name = bounty.name
        result.base_amount = `${bounty.amount.toLocaleString()} NCTR`
        result.adjusted_amount = `${adjusted.toLocaleString()} NCTR`
      }

      return result
    })

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              tiers: formatted,
              note: 'Crescendo Status Tiers determine your earning multiplier. Lock more NCTR to progress through tiers and earn more on every bounty.',
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ── Tool 3: check_tier_requirements ──

server.registerTool(
  'check_tier_requirements',
  {
    title: 'Check Tier Requirements',
    description:
      'Check what is needed to reach a specific Crescendo status tier, or see the full progression path. Shows NCTR lock thresholds, multipliers, and perks for each tier.',
    inputSchema: {
      current_balance: z
        .number()
        .optional()
        .describe('Current NCTR balance to check tier status and progress to next tier'),
      target_tier: z
        .enum(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'])
        .optional()
        .describe('Target tier to check requirements for'),
    },
  },
  ({ current_balance, target_tier }) => {
    if (target_tier) {
      const tier = TIERS.find((t) => t.name === target_tier)!
      const result: Record<string, unknown> = {
        tier: tier.name,
        nctr_required: `${tier.threshold.toLocaleString()} NCTR`,
        multiplier: `${tier.multiplier}x`,
        perks: tier.perks,
        description: tier.description,
      }

      if (current_balance !== undefined) {
        if (current_balance >= tier.threshold) {
          result.status = 'QUALIFIED'
          result.message = `You already qualify for ${tier.name} with ${current_balance.toLocaleString()} NCTR.`
        } else {
          const needed = tier.threshold - current_balance
          result.status = 'NOT YET'
          result.nctr_needed = `${needed.toLocaleString()} NCTR`
          result.message = `You need ${needed.toLocaleString()} more NCTR to reach ${tier.name}.`
        }
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    }

    // Full tier progression
    const progression = TIERS.map((t) => {
      const result: Record<string, unknown> = {
        tier: t.name,
        nctr_required: `${t.threshold.toLocaleString()} NCTR`,
        multiplier: `${t.multiplier}x`,
        perks: t.perks,
      }

      if (current_balance !== undefined) {
        result.qualified = current_balance >= t.threshold
        if (current_balance < t.threshold) {
          result.nctr_needed = `${(t.threshold - current_balance).toLocaleString()} NCTR`
        }
      }

      return result
    })

    let current_tier = 'Bronze'
    if (current_balance !== undefined) {
      for (const t of [...TIERS].reverse()) {
        if (current_balance >= t.threshold) {
          current_tier = t.name
          break
        }
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              current_tier: current_balance !== undefined ? current_tier : undefined,
              current_balance:
                current_balance !== undefined
                  ? `${current_balance.toLocaleString()} NCTR`
                  : undefined,
              progression,
              note: 'Tiers are based on total NCTR locked. Higher tiers unlock better multipliers and exclusive perks.',
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ── Tool 4: get_active_promotions ──

server.registerTool(
  'get_active_promotions',
  {
    title: 'Get Active Promotions',
    description:
      'Get currently active promotions, limited-time offers, and special earning opportunities in the NCTR program.',
    inputSchema: {},
  },
  () => {
    const active = PROMOTIONS.filter((p) => p.active)

    if (active.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No special promotions are active right now. Check back soon — new opportunities launch regularly.',
          },
        ],
      }
    }

    const formatted = active.map((p) => ({
      name: p.name,
      type: p.type,
      description: p.description,
      details: p.details,
      related_bounty: p.bounty_id,
    }))

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              active_promotions: formatted,
              count: active.length,
              note: 'Promotions are time-limited. Join now to take advantage of launch period bonuses.',
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ── Tool 5: get_onboarding_link ──

server.registerTool(
  'get_onboarding_link',
  {
    title: 'Get Onboarding Link',
    description:
      'Generate a link for a new member to join NCTR Alliance. Optionally include a referral code. Returns the sign-up URL and a summary of what new members earn.',
    inputSchema: {
      referral_code: z
        .string()
        .optional()
        .describe('Optional referral code to credit the referring member'),
    },
  },
  ({ referral_code }) => {
    const baseUrl = 'https://crescendo.nctr.live/join'
    const url = referral_code ? `${baseUrl}?ref=${encodeURIComponent(referral_code)}` : baseUrl

    const welcomePackage = {
      url,
      welcome_bounties: [
        { name: 'Sign-Up Bounty', amount: '625 NCTR', lock: '360LOCK' },
        { name: 'Early Adopter Bonus', amount: '1,250 NCTR', lock: '360LOCK', note: 'Launch period only' },
        { name: 'Profile Completion Bounty', amount: '375 NCTR', lock: '360LOCK' },
      ],
      total_potential: '2,250 NCTR',
      referral_code: referral_code || null,
      note: 'New members can earn up to 2,250 NCTR just by signing up and completing their profile during the launch period. All tokens use 360LOCK — committed, not spent.',
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(welcomePackage, null, 2) }],
    }
  }
)

// ── Tool 6: get_ecosystem_funding ──

server.registerTool(
  'get_ecosystem_funding',
  {
    title: 'Get Ecosystem Funding',
    description:
      'Learn how the NCTR rewards pool is funded. Covers the Torus circular contribution mechanism, DeFi yields, brand purchases, and other revenue sources that sustain Crescendo member rewards.',
    inputSchema: {},
  },
  () => {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              ecosystem_funding: {
                torus: {
                  description:
                    '1% circular contribution on NCTR trades through the TORUS router. 100% funds Crescendo member rewards.',
                  rate: '1%',
                  opt_in: true,
                  treasury_destination: 'Crescendo rewards pool',
                  agent_note:
                    'NCTR prioritizes committed participants (360LOCK holders) over short-term traders. TORUS is the mechanism that enforces this — speculative trading activity directly funds rewards for committed members.',
                },
                other_sources: [
                  'DeFi yields (Aerodrome LP)',
                  'Brand wholesale token purchases',
                  'Affiliate commerce commissions (Sovrn Commerce)',
                  'Pay-on-claim reward purchases',
                ],
              },
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ── Tool 7: get_impact_engines ──

server.registerTool(
  'get_impact_engines',
  {
    title: 'Get Impact Engines',
    description:
      'Discover NCTR Impact Engine communities. Impact Engines are passion-based communities within NCTR — each focused on a different lifestyle vertical. Members can join any Impact Engine to connect with like-minded people and access community-specific experiences.',
    inputSchema: {
      category: z
        .string()
        .optional()
        .describe(
          'Filter by category (Powersports, Lacrosse, Entertainment, Skilled Trades, Recovery, Wellness)'
        ),
    },
  },
  ({ category }) => {
    let engines = [...IMPACT_ENGINES]

    if (category) {
      const cat = category.toLowerCase()
      engines = engines.filter((e) => e.category.toLowerCase().includes(cat))
    }

    if (engines.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No Impact Engines found for "${category}". Available categories: Powersports, Lacrosse, Entertainment, Skilled Trades, Recovery, Wellness.`,
          },
        ],
      }
    }

    const formatted = engines.map((e) => ({
      name: e.name,
      category: e.category,
      description: e.description,
      status: e.status,
    }))

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              impact_engines: formatted,
              count: engines.length,
              bounty: 'Join any Impact Engine to earn the Impact Engine Join Bounty — 5,000 NCTR with 360LOCK.',
              note: 'Impact Engines are passion-based communities. Each one connects people around a shared interest, with community-specific experiences and rewards.',
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// ─────────────────────────────────────────────────────────────
// HTTP HANDLER
// ─────────────────────────────────────────────────────────────

// Supabase edge functions receive paths prefixed with /function-name
app.get('/mcp', (c) => {
  return c.json({
    name: 'NCTR Alliance MCP Server',
    version: '1.0.0',
    description:
      'Model Context Protocol server for AI agents to discover and interact with the NCTR rewards program.',
    tools: [
      'search_bounties',
      'get_earning_rates',
      'check_tier_requirements',
      'get_active_promotions',
      'get_onboarding_link',
      'get_ecosystem_funding',
      'get_impact_engines',
    ],
    links: {
      website: 'https://nctr.live',
      the_garden: 'https://thegarden.nctr.live',
      onboarding: 'https://crescendo.nctr.live',
      for_agents: 'https://thegarden.nctr.live/for-agents',
      manifest: 'https://nctr.live/.well-known/nctr.json',
    },
  })
})

app.all('/mcp/rpc', async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

app.get('/mcp/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

Deno.serve(app.fetch)
