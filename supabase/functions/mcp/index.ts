/**
 * NCTR Alliance MCP Server
 * ========================
 * Model Context Protocol server for AI agents to discover and interact
 * with NCTR Alliance status, rewards, bounties, and Impact Engines.
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
 *   6. get_impact_engines     — Discover NCTR Impact Engine communities
 *
 * NCTR Alliance — https://nctr.live
 * The Mall — https://themall.nctr.live
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { loadTierBenefits, progressLabel } from '../_shared/tierBenefits.ts'

// ─────────────────────────────────────────────────────────────
// DATA: Bounties
// ─────────────────────────────────────────────────────────────

interface Bounty {
  id: string
  name: string
  category: 'entry' | 'shopping' | 'merch' | 'referral' | 'engagement'
  description: string
  amount: number
  currency: string
  lock_period: string
  lock_days: number
  repeatable: boolean
  requirements: string[]
  tags: string[]
}

// Bounties are read live from public.bounties (active rows only).
// No bounty names or amounts are typed here.
async function loadBounties(): Promise<Bounty[]> {
  const { data, error } = await publicDb
    .from('bounties')
    .select('id, title, description, category, nctr_reward, requires_360lock, is_recurring, instructions')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error || !data) return []
  return data.map((b: any) => ({
    id: b.id,
    name: b.title,
    category: String(b.category ?? '').toLowerCase() as Bounty['category'],
    description: b.description ?? '',
    amount: Number(b.nctr_reward) || 0,
    currency: 'NCTR',
    lock_period: b.requires_360lock ? '360LOCK' : 'None',
    lock_days: b.requires_360lock ? 360 : 0,
    repeatable: !!b.is_recurring,
    requirements: b.instructions ? [String(b.instructions)] : [],
    tags: [String(b.category ?? '').toLowerCase()].filter(Boolean),
  }))
}

// ─────────────────────────────────────────────────────────────
// DATA: Crescendo Status Tiers
// ─────────────────────────────────────────────────────────────

// Tiers are read live from the database through the shared resolver
// (EARN · OPENS · YOUR SAY · PERKS). No tier data is hardcoded here.
const publicDb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
const loadTiers = () => loadTierBenefits(publicDb)

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
    status: 'coming_soon'
  },
  {
    name: 'GROUNDBALL',
    slug: 'groundball',
    category: 'Lacrosse',
    description: 'The lacrosse community within NCTR. Uniting players, coaches, and fans at every level of the sport.',
    status: 'coming_soon'
  },
  {
    name: 'STARDUST',
    slug: 'stardust',
    category: 'Entertainment',
    description: 'The entertainment community within NCTR. Connecting creators, performers, and fans across music, film, and live events.',
    status: 'coming_soon'
  },
  {
    name: 'SWEAT',
    slug: 'sweat',
    category: 'Skilled Trades',
    description: 'The skilled trades community within NCTR. Supporting tradespeople, apprentices, and craftworkers.',
    status: 'coming_soon'
  },
  {
    name: 'SISU',
    slug: 'sisu',
    category: 'Recovery',
    description: 'The recovery community within NCTR. A judgment-free space for people on recovery journeys.',
    status: 'coming_soon'
  },
  {
    name: 'INSPIRATION',
    slug: 'inspiration',
    category: 'Wellness',
    description: 'The wellness community within NCTR. Focused on mindfulness, fitness, nutrition, and holistic well-being.',
    status: 'coming_soon'
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
    description: 'Earn NCTR for joining while the offer runs. No counter and no slot limit. See search_bounties for the live amount.',
    type: 'launch-bonus',
    bounty_id: 'bounty-early-adopter',
    active: true,
    details: 'Open to new members while the offer runs, committed for 360 days.'
  },
  {
    name: 'Early Referral Bonus',
    description: 'Earn NCTR for each friend you refer while the offer runs, a higher bounty than the standard referral rate.',
    type: 'referral-boost',
    bounty_id: 'bounty-early-referral',
    active: true,
    details: 'Open while the offer runs. A higher referral bounty than the standard rate, with no cap on referrals.'
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
      'Search and filter available NCTR bounties. Filter by category (entry, shopping, merch, referral, engagement), minimum/maximum NCTR amount, or keyword. Returns bounty details including name, amount, commitment period, and requirements. Every bounty is committed through 360LOCK for 360 days. Your NCTR stays yours throughout.',
    inputSchema: {
      category: z
        .string()
        .optional()
        .describe(
          'Filter by bounty category: entry, shopping, merch, referral, engagement'
        ),
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
  async ({ category, min_amount, max_amount, keyword, repeatable_only }) => {
    let results = await loadBounties()

    if (category) {
      // Silent input alias, retired 2026-10-01: legacy callers may still send
      // the old category name. Mapped on input; never emitted in responses.
      const LEGACY_CATEGORY_ALIASES: Record<string, string> = { revenue: 'shopping' }
      const normalized = category.toLowerCase().trim()
      const resolved = LEGACY_CATEGORY_ALIASES[normalized] ?? normalized
      results = results.filter((b) => b.category === resolved)
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
            text: 'Explore NCTR Alliance bounties with broader filters. Try entry, shopping, merch, referral or engagement.',
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
              note: 'Every bounty is committed through 360LOCK for 360 days. Your NCTR stays yours throughout and becomes available when the commitment ends.',
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
      'Get NCTR earning rates for a specific Crescendo status tier, or compare all tiers. Shows how your status sets what you earn on every bounty. Higher tiers earn more NCTR per bounty.',
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
  async ({ tier, bounty_id }) => {
    let tiers = await loadTiers()
    if (tier) {
      tiers = tiers.filter((t) => t.display_name === tier)
    }

    const bounty = bounty_id ? (await loadBounties()).find((b) => b.id === bounty_id) : null

    const formatted = tiers.map((t) => {
      const result: Record<string, unknown> = {
        tier: t.display_name,
        nctr_threshold: `${t.threshold.toLocaleString()} NCTR`,
        earn: t.earn,
        opens: t.opens.label,
        your_say: t.say.label,
        ...(t.perks.length ? { perks: t.perks } : {}),
      }

      if (bounty) {
        const adjusted = Math.floor(bounty.amount * t.earn_rate)
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
              note: 'Your Crescendo status sets how much you earn on every bounty. Commit NCTR through 360LOCK to rise. Higher status earns more on every bounty.',
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
      'Check what is needed to reach a specific Crescendo status tier, or see the full progression path. Shows NCTR commitment thresholds, earning benefits, and rewards for each tier.',
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
  async ({ current_balance, target_tier }) => {
    const TIERS = await loadTiers()
    const estimateNote = 'estimate — based on the balance you provided, not a verified member record'
    if (target_tier) {
      const tier = TIERS.find((t) => t.display_name === target_tier)!
      const result: Record<string, unknown> = {
        tier: tier.display_name,
        nctr_required: `${tier.threshold.toLocaleString()} NCTR`,
        earn: tier.earn,
        opens: tier.opens.label,
        your_say: tier.say.label,
        ...(tier.perks.length ? { perks: tier.perks } : {}),
      }

      if (current_balance !== undefined) {
        if (current_balance >= tier.threshold) {
          result.status = 'QUALIFIED'
          result.message = `Estimate: ${current_balance.toLocaleString()} NCTR qualifies for ${tier.display_name}.`
        } else {
          const needed = tier.threshold - current_balance
          result.status = 'NOT YET'
          result.nctr_needed = `${needed.toLocaleString()} NCTR`
          result.message = `Estimate: ${needed.toLocaleString()} more NCTR to reach ${tier.display_name}.`
        }
        result.estimate = estimateNote
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    }

    // Full tier progression
    const progression = TIERS.map((t) => {
      const result: Record<string, unknown> = {
        tier: t.display_name,
        nctr_required: `${t.threshold.toLocaleString()} NCTR`,
        earn: t.earn,
        opens: t.opens.label,
        your_say: t.say.label,
        ...(t.perks.length ? { perks: t.perks } : {}),
      }

      if (current_balance !== undefined) {
        result.qualified = current_balance >= t.threshold
        if (current_balance < t.threshold) {
          result.nctr_needed = `${(t.threshold - current_balance).toLocaleString()} NCTR`
        }
      }

      return result
    })

    let current_tier = 'Below Bronze'
    if (current_balance !== undefined) {
      for (const t of [...TIERS].reverse()) {
        if (current_balance >= t.threshold) {
          current_tier = t.display_name
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
              ...(current_balance !== undefined ? { estimate: estimateNote, next_step: progressLabel(TIERS, current_balance) } : {}),
              note: 'Your NCTR committed through 360LOCK sets your Crescendo status. Higher status earns more on every bounty and opens more rewards.',
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
      'Explore active offers and earning opportunities in NCTR Alliance.',
    inputSchema: {},
  },
  () => {
    const active = PROMOTIONS.filter((p) => p.active)

    if (active.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'NCTR Alliance bounties are open to explore. Special offers will appear here when available.',
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
              note: 'Promotions run for a limited time; each one\'s details say who it\'s for.',
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
  async ({ referral_code }) => {
    const baseUrl = 'https://bountyhunter.nctr.live/auth'
    const url = referral_code ? `${baseUrl}?ref=${encodeURIComponent(referral_code)}` : baseUrl

    // One-time, no-purchase bounties from public.bounties make up the welcome summary.
    // Daily Check-in is not a welcome bounty; no summed total is presented.
    const welcome = (await loadBounties()).filter(
      (b) => !b.repeatable && b.category === 'engagement' && !/check[\s-]?in/i.test(b.name)
    )
    const welcomePackage = {
      url,
      welcome_bounties: welcome.map((b) => ({
        name: b.name,
        amount: `${b.amount.toLocaleString()} NCTR`,
        lock: b.lock_period,
      })),
      referral_code: referral_code || null,
      note: 'Amounts come from the live bounty list. Your NCTR stays yours throughout.',
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(welcomePackage, null, 2) }],
    }
  }
)

// ── Tool 7: get_impact_engines ──

server.registerTool(
  'get_impact_engines',
  {
    title: 'Get Impact Engines',
    description:
      'Discover NCTR Impact Engine communities. Impact Engines are passion-based communities within NCTR — each focused on a different lifestyle vertical. The Impact Engines are coming. Early members have the most time to build and earn.',
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
            text: `Explore NCTR Alliance communities in Powersports, Lacrosse, Entertainment, Skilled Trades, Recovery or Wellness. Try another category instead of "${category}".`,
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
              bounty: 'Coming soon: the Impact Engine Join Bounty, committed for 360 days, opens when the engines launch.',
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
      'Model Context Protocol server for agents to explore NCTR Alliance bounties, status, commitments, and rewards.',
    tools: [
      'search_bounties',
      'get_earning_rates',
      'check_tier_requirements',
      'get_active_promotions',
      'get_onboarding_link',
      'get_impact_engines',
    ],
    links: {
      website: 'https://nctr.live',
      the_mall: 'https://themall.nctr.live',
      onboarding: 'https://crescendo.nctr.live',
      for_agents: 'https://themall.nctr.live/for-agents',
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
