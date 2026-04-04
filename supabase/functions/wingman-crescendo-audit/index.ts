import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-key",
};

function classifyMemorySource(
  text: string
): "crescendo" | "bh" | "unknown" {
  const lower = text.toLowerCase();
  const crescendoKeywords = [
    "tier",
    "lock",
    "360lock",
    "crescendo",
    "membership",
    "diamond",
    "gold",
    "silver",
    "bronze",
    "nctr locked",
    "status level",
  ];
  const bhKeywords = [
    "bounty",
    "order",
    "purchase",
    "store",
    "shopping",
    "brand",
    "merch",
    "earned",
    "hunt",
    "claimed reward",
  ];

  const crescendoHits = crescendoKeywords.filter((k) =>
    lower.includes(k)
  ).length;
  const bhHits = bhKeywords.filter((k) => lower.includes(k)).length;

  if (crescendoHits > bhHits) return "crescendo";
  if (bhHits > crescendoHits) return "bh";
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — must match GODVIEW_INGEST_KEY
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = Deno.env.get("GODVIEW_INGEST_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const MEM0_KEY = Deno.env.get("MEM0_API_KEY");
    const mem0Configured = !!MEM0_KEY;

    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user IDs to audit
    let userIds: string[] = body.user_ids || [];
    if (userIds.length === 0) {
      const { data: profiles } = await supabase
        .from("unified_profiles")
        .select("id")
        .limit(50);
      userIds = (profiles || []).map((p: any) => p.id);
    }

    const results: any[] = [];

    for (const userId of userIds) {
      const userResult: any = {
        user_id: userId,
        mem0_memories: [],
        memory_count: 0,
        crescendo_memories_count: 0,
        bh_memories_count: 0,
        crescendo_profile: null,
      };

      // 1. Fetch Mem0 memories (shared brain, keyed by member_ prefix)
      if (mem0Configured) {
        try {
          const memRes = await fetch(
            `https://api.mem0.ai/v1/memories/?user_id=member_${userId}`,
            {
              headers: { Authorization: `Token ${MEM0_KEY}` },
            }
          );
          if (memRes.ok) {
            const memData = await memRes.json();
            const memories = memData.results || memData || [];
            userResult.mem0_memories = Array.isArray(memories)
              ? memories.map((m: any) => {
                  const text =
                    m.memory ||
                    m.content ||
                    m.text ||
                    JSON.stringify(m);
                  const source = classifyMemorySource(text);
                  return {
                    id: m.id,
                    memory: text,
                    created_at: m.created_at,
                    source_hint: source,
                  };
                })
              : [];
            userResult.memory_count = userResult.mem0_memories.length;
            userResult.crescendo_memories_count =
              userResult.mem0_memories.filter(
                (m: any) => m.source_hint === "crescendo"
              ).length;
            userResult.bh_memories_count =
              userResult.mem0_memories.filter(
                (m: any) => m.source_hint === "bh"
              ).length;
          } else {
            userResult.mem0_error = `Mem0 API returned ${memRes.status}`;
          }
        } catch (e) {
          userResult.mem0_error = `Mem0 fetch failed: ${(e as Error).message}`;
        }
      } else {
        userResult.mem0_error =
          "MEM0_API_KEY not configured in this project";
      }

      // 2. Fetch Crescendo profile with tier name
      try {
        const { data: profile } = await supabase
          .from("unified_profiles")
          .select(
            "id, current_tier_id, nctr_locked_points, created_at, status_tiers:current_tier_id(tier_name)"
          )
          .eq("id", userId)
          .maybeSingle();

        if (profile) {
          const tierName =
            (profile as any).status_tiers?.tier_name || null;
          userResult.crescendo_profile = {
            tier: tierName,
            nctr_locked: profile.nctr_locked_points,
            lock_upgraded_at: null,
            auto_360lock: null,
            created_at: profile.created_at,
          };
        }
      } catch (e) {
        userResult.profile_error = (e as Error).message;
      }

      results.push(userResult);
    }

    return new Response(
      JSON.stringify({
        audit_date: new Date().toISOString(),
        source_app: "crescendo",
        supabase_project: "yhwcaodofmbusjurawhp",
        mem0_key_configured: mem0Configured,
        users_audited: results.length,
        users: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Crescendo audit error:", error);
    return new Response(
      JSON.stringify({
        error: "Audit failed",
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
