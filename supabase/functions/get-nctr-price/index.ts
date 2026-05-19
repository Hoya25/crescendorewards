import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const NCTR_TOKEN = "0x973104fAa7F2B11787557e85953ECA6B4e262328";
const CACHE_TTL_MS = 60_000;

let cachedPrice: {
  nctr_usd: number;
  liquidity_usd: number;
  fetched_at: string;
} | null = null;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  const oracleUnavailable = (detail: string) =>
    new Response(
      JSON.stringify({ error: "oracle_unavailable", detail }),
      { status: 503, headers: jsonHeaders }
    );

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: jsonHeaders }
    );
  }

  // Cache check
  if (cachedPrice) {
    const age = Date.now() - new Date(cachedPrice.fetched_at).getTime();
    if (age < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ ...cachedPrice, cached: true }),
        { status: 200, headers: jsonHeaders }
      );
    }
  }

  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${NCTR_TOKEN}`;
    const res = await fetch(url);

    if (!res.ok) {
      return oracleUnavailable(`Dexscreener returned ${res.status}`);
    }

    const data = await res.json();

    if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
      return oracleUnavailable("No pairs returned by Dexscreener");
    }

    const validPairs = data.pairs
      .filter((p: any) => p.priceUsd && p.liquidity?.usd)
      .sort((a: any, b: any) => b.liquidity.usd - a.liquidity.usd);

    if (validPairs.length === 0) {
      return oracleUnavailable("No pairs with priceUsd and liquidity");
    }

    const best = validPairs[0];
    const price = parseFloat(best.priceUsd);

    if (!(price > 0 && price < 10000)) {
      return oracleUnavailable(`Price out of bounds: ${best.priceUsd}`);
    }

    cachedPrice = {
      nctr_usd: price,
      liquidity_usd: Number(best.liquidity.usd),
      fetched_at: new Date().toISOString(),
    };

    console.log("[get-nctr-price] fresh fetch", cachedPrice);

    return new Response(
      JSON.stringify({ ...cachedPrice, cached: false }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err: any) {
    console.error("[get-nctr-price] error", err);
    return oracleUnavailable(err?.message || "Unknown error");
  }
});
