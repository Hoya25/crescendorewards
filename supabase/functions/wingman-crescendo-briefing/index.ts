import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// MEM0 UNIFIED MEMORY LAYER
const MEM0_API_URL = "https://api.mem0.ai/v1";
const MEM0_API_KEY = Deno.env.get("MEM0_API_KEY");

interface Mem0Memory {
  id: string;
  memory: string;
  created_at: string;
  updated_at: string;
}

async function searchMemories(
  userId: string,
  query: string
): Promise<Mem0Memory[]> {
  try {
    const response = await fetch(
      `${MEM0_API_URL}/memories/search/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${MEM0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        user_id: userId,
        limit: 10,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error("Mem0 search error:", error);
    return [];
  }
}

async function addMemory(
  userId: string,
  content: string,
  metadata?: Record<string, string>
): Promise<void> {
  try {
    await fetch(`${MEM0_API_URL}/memories/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${MEM0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: content }
        ],
        user_id: userId,
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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the NCTR Wingman — a co-pilot embedded in the Crescendo membership app. You help members navigate their rewards, status progression, and ambitions.

PERSONALITY:
- Co-pilot, not coach or salesperson. The member drives, you navigate.
- "Watching your 6" — monitoring the ecosystem on their behalf.
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
  "watching_your_6": ["insight about tier status, balance changes, or ecosystem updates affecting this member"],
  "opportunities_spotted": ["connection between ambitions and actions the member could take"],
  "ambitions_enriched": ["for each active ambition, a brief strategic note"]
}

Rules:
- watching_your_6: 1-2 items. Tier trajectory, balance status, new rewards dropping, claim availability.
- opportunities_spotted: 1-2 items. Cross-app connections, compounding loops, timing plays. If no ambitions set: "Tell me what you want — tap 'Want This' on any reward — and I'll start connecting the dots."
- ambitions_enriched: One entry per active ambition. If no ambitions: empty array [].
- Keep it concise. Each item should be 1-2 sentences max.
- Return ONLY the JSON object, no markdown fences, no extra text.`;

const FALLBACK_RESPONSE = {
  watching_your_6: ["Syncing with the ecosystem..."],
  opportunities_spotted: [
    "I'm still learning your patterns. Tap 'Want This' on any reward and I'll start connecting the dots.",
  ],
  ambitions_enriched: [],
};

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

    if (user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      // Run queries in parallel
      const [profileRes, ambitionsRes, rewardsCountRes] = await Promise.all([
        sb
          .from("unified_profiles")
          .select("current_tier_id, total_nctr_earned, earn_rate, status_multiplier")
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

    // ── Build user message ─────────────────────────────────────────────
    const ambitionsList =
      ambitions.length > 0
        ? ambitions.map((a) => `${a.reward_name} (${a.reward_tier_required} required, ${a.is_claimable ? "claimable" : "locked"})`).join("; ")
        : "None set";

    let userMessage = `Member context: Tier: ${tierName}, Balance: ${balance} NCTR, Earn rate: ${earnRate}, Multiplier: ${multiplier}x. Active ambitions: ${ambitionsList}. Available rewards at current tier: ${availableRewardsCount}.`;

    if (question) {
      userMessage += ` Member question: ${question}`;
    }

    // ── Retrieve cross-session memories ─────────────────────────────────
    const memoryQuery = [
      tierName || "",
      "crescendo ambitions tier rewards"
    ].filter(Boolean).join(" — ");

    const memories = await searchMemories(
      user_id || "anonymous", memoryQuery
    );

    const memoryContext = memories.length > 0
      ? "\n\nCROSS-SESSION MEMORY:\n" +
        "You remember things about this member " +
        "from prior conversations across all " +
        "NCTR apps. Here is what you know:\n" +
        memories.map((m: any) => 
          "- " + m.memory
        ).join("\n") +
        "\n\nMEMORY RULES:\n" +
        "- Use this knowledge naturally. Never " +
        "reference a memory system.\n" +
        "- If BH memories mention shopping " +
        "interests, connect those to Crescendo " +
        "progress.\n" +
        "- If you briefed them in BH recently, " +
        "build on it instead of repeating.\n" +
        "- If they set ambitions previously, " +
        "reference them by name.\n" +
        "- If memory is sparse, behave normally."
      : "";

    // ── Call Lovable AI Gateway ─────────────────────────────────────────
    const finalSystemPrompt = SYSTEM_PROMPT + memoryContext;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error(`AI gateway error ${status}:`, errText);

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
    const raw = aiData.choices?.[0]?.message?.content ?? "";

    // ── Parse structured response ──────────────────────────────────────
    let structured;
    try {
      // Strip markdown fences if present
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      structured = JSON.parse(cleaned);
      if (!structured.watching_your_6 || !structured.opportunities_spotted) {
        throw new Error("Missing required sections");
      }
    } catch {
      structured = {
        watching_your_6: [raw || "Syncing with the ecosystem..."],
        opportunities_spotted: [
          "I'm still learning your patterns. Tap 'Want This' on any reward and I'll start connecting the dots.",
        ],
        ambitions_enriched: [],
      };
    }

    // ── Store briefing to memory (fire and forget) ───────────────────
    if (user_id) {
      addMemory(user_id,
        "Crescendo Wingman briefed member. " +
        "Tier: " + (tierName || "unknown") + ". " +
        "Headline: " + (structured?.watching_your_6?.[0] || "unknown") + ". " +
        "Ambitions: " + (ambitions?.map((a: any) => a.reward_name).join(", ") || "none") + ".",
        {
          source: "wingman-crescendo-briefing",
          app: "crescendo",
          type: "briefing",
        }
      );
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
