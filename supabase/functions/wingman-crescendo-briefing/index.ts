import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Mem0 Unified Memory Layer ──────────────────────────────────────────
const MEM0_API_URL = "https://api.mem0.ai/v1";
const MEM0_API_KEY = Deno.env.get("MEM0_API_KEY");

async function searchMemories(
  memUserId: string,
  query: string,
  limit = 10
): Promise<string[]> {
  if (!MEM0_API_KEY || !memUserId) return [];
  try {
    const response = await fetch(`${MEM0_API_URL}/memories/search/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${MEM0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, user_id: memUserId, limit }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || data || [])
      .map((m: any) => m.memory || m.text || "")
      .filter(Boolean);
  } catch (error) {
    console.error("Mem0 search error:", error);
    return [];
  }
}

async function addMemory(
  memUserId: string,
  content: string,
  metadata?: Record<string, string>
): Promise<void> {
  if (!MEM0_API_KEY || !memUserId) return;
  try {
    await fetch(`${MEM0_API_URL}/memories/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${MEM0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content }],
        user_id: memUserId,
        metadata: {
          source: metadata?.source || "wingman",
          app: metadata?.app || "crescendo",
          ...metadata,
        },
      }),
    });
  } catch (error) {
    console.error("Mem0 add error:", error);
  }
}

// ── CORS ───────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── System Prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the NCTR Wingman — a co-pilot embedded in the Crescendo membership app. You help members navigate their rewards, status progression, and ambitions.

PERSONALITY:
- Co-pilot, not coach or salesperson. The member drives, you navigate.
- "Your Brief" — monitoring the ecosystem on their behalf.
- Pattern matching, not value judgment. "This aligns with..." not "This is the best deal."
- Gender-neutral voice. Confident but relational, never transactional.
- Aspirational: "ambitions" not "goals."
- Present tense: "I'm seeing..." "I'm tracking..."
- Never say "crypto", "blockchain", "web3", "yield", "revenue share", "profit share."
- Write NCTR, never "Nectar."

CONTEXT PROVIDED:
- Member's current tier, balance, earn rate, multiplier
- Member's active ambitions (rewards they want)
- Number of rewards available at their tier

GUIDE MODE (current): Data is limited. Keep insights grounded in what exists now. 1-2 items per section. Don't reference features or data that aren't live yet. Don't fabricate specific numbers you weren't given.

RESPONSE FORMAT — you MUST return valid JSON with exactly this structure:
{
  "your_brief": ["insight about tier status, balance changes, or ecosystem updates affecting this member"],
  "spotted": ["connection between ambitions and actions the member could take"],
  "ambitions_enriched": ["for each active ambition, a brief strategic note"]
}

Rules:
- your_brief: 1-2 items. Tier trajectory, balance status, new rewards dropping, claim availability.
- spotted: 1-2 items. Cross-app connections, compounding loops, timing plays. If no ambitions set: "Tell me what you want — tap 'Want This' on any reward — and I'll start connecting the dots."
- ambitions_enriched: One entry per active ambition. If no ambitions: empty array [].
- Keep it concise. Each item should be 1-2 sentences max.
- Return ONLY the JSON object, no markdown fences, no extra text.`;

const FALLBACK_RESPONSE = {
  your_brief: ["Syncing with the ecosystem..."],
  spotted: [
    "I'm still learning your patterns. Tap 'Want This' on any reward and I'll start connecting the dots.",
  ],
  ambitions_enriched: [],
};

// ── Handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, question } = await req.json().catch(() => ({} as any));

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(JSON.stringify(FALLBACK_RESPONSE), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Gather member context ──────────────────────────────────────────
    let tierName = "Unknown";
    let balance = 0;
    let earnRate = 0;
    let multiplier = 1;
    let ambitions: { reward_name: string; reward_tier_required: string; is_claimable: boolean }[] = [];
    let availableRewardsCount = 0;
    let userEmail = "";

    if (user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      // Run queries in parallel — include email for Mem0 cross-app identity
      const [profileRes, ambitionsRes, rewardsCountRes] = await Promise.all([
        sb
          .from("unified_profiles")
          .select("current_tier_id, total_nctr_earned, earn_rate, status_multiplier, email")
          .eq("auth_user_id", user_id)
          .maybeSingle(),
        sb
          .from("member_ambitions")
          .select("reward_name, reward_tier_required, is_claimable")
          .eq("user_id", user_id)
          .is("removed_at", null),
        sb.from("rewards").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        balance = p.total_nctr_earned ?? 0;
        earnRate = p.earn_rate ?? 0;
        multiplier = p.status_multiplier ?? 1;
        userEmail = p.email ?? "";

        // Resolve tier name
        if (p.current_tier_id) {
          const { data: tierRow } = await sb
            .from("status_tiers")
            .select("tier_name")
            .eq("id", p.current_tier_id)
            .maybeSingle();
          tierName = tierRow?.tier_name ?? "Bronze";
        } else {
          tierName = "Bronze";
        }
      }

      if (ambitionsRes.data) {
        ambitions = ambitionsRes.data;
      }

      availableRewardsCount = rewardsCountRes.count ?? 0;
    }

    // ── Mem0 cross-app identity: use EMAIL as namespace ─────────────────
    // Both BH and Crescendo share the same Mem0 user_id (email) so
    // memories written by either app are visible to both.
    // NOTE: BH wingman-briefing needs matching update to use email as Mem0 user_id.
    const mem0UserId = userEmail || user_id || "anonymous";

    // ── Build user message ─────────────────────────────────────────────
    const ambitionsList =
      ambitions.length > 0
        ? ambitions.map((a) => `${a.reward_name} (${a.reward_tier_required} required, ${a.is_claimable ? "claimable" : "locked"})`).join("; ")
        : "None set";

    let userMessage = `Member context: Tier: ${tierName}, Balance: ${balance} NCTR, Earn rate: ${earnRate}, Multiplier: ${multiplier}x. Active ambitions: ${ambitionsList}. Available rewards at current tier: ${availableRewardsCount}.`;

    if (question) {
      userMessage += ` Member question: ${question}`;
    }

    // ── Retrieve cross-app memories from Mem0 ──────────────────────────
    const mem0Memories = await searchMemories(
      mem0UserId,
      "What do I know about this member? Interests, ambitions, tier, shopping, Bounty Hunter activity, Crescendo progress"
    );

    const memoryContext = mem0Memories.length > 0
      ? "\n\nCROSS-APP MEMORY (from Bounty Hunter and Crescendo):\n" +
        mem0Memories.join(". ") +
        "\n\nMEMORY RULES:\n" +
        "- Use this knowledge naturally. Never reference a memory system.\n" +
        "- If memories mention shopping interests or Bounty Hunter activity, connect those to Crescendo progress.\n" +
        "- If you briefed them recently, build on it instead of repeating.\n" +
        "- If they set ambitions previously, reference them by name.\n" +
        "- Never say 'based on your Bounty Hunter activity' — just know it, like a good advisor would.\n" +
        "- If memory is sparse, behave normally."
      : "\n\nCROSS-APP MEMORY (from Bounty Hunter and Crescendo):\n" +
        "No prior memory yet — this may be a new member.\n" +
        "Use this naturally. Never reference a memory system.";

    // ── Call Claude API ───────────────────────────────────────────────
    const finalSystemPrompt = SYSTEM_PROMPT + memoryContext;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: finalSystemPrompt,
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error(`Claude API error ${status}:`, errText);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(FALLBACK_RESPONSE), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const raw = aiData.content?.[0]?.text ?? "";

    // ── Parse structured response ──────────────────────────────────────
    let structured;
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      structured = JSON.parse(cleaned);
      if (!structured.your_brief || !structured.spotted) {
        throw new Error("Missing required sections");
      }
    } catch {
      structured = {
        your_brief: [raw || "Syncing with the ecosystem..."],
        spotted: [
          "I'm still learning your patterns. Tap 'Want This' on any reward and I'll start connecting the dots.",
        ],
        ambitions_enriched: [],
      };
    }

    // ── Write to Mem0 (fire and forget) ────────────────────────────────
    // Stores briefing summary + any member question as cross-app memory.
    if (mem0UserId && mem0UserId !== "anonymous") {
      const newFacts: string[] = [];

      // Briefing summary
      newFacts.push(
        "Crescendo Wingman briefed member. " +
        "Tier: " + (tierName || "unknown") + ". " +
        "Headline: " + (structured?.your_brief?.[0] || "unknown") + ". " +
        "Ambitions: " + (ambitions?.map((a: any) => a.reward_name).join(", ") || "none") + "."
      );

      // If user asked a question, that reveals interest
      if (question) {
        newFacts.push("On Crescendo, asked: " + question.slice(0, 200));
      }

      // Fire and forget — don't await
      addMemory(mem0UserId, newFacts.join(". "), {
        app: "crescendo",
        source: "wingman",
        type: "briefing",
        extracted_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify(structured), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("wingman-crescendo-briefing error:", e);
    return new Response(JSON.stringify(FALLBACK_RESPONSE), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
