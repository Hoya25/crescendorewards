import { useState, useEffect } from 'react';

const CACHE_KEY = 'nctr_market_price';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_AGE_MS = 60 * 60 * 1000;   // 1 hour hard expiry
const DEXSCREENER_URL =
  'https://api.dexscreener.com/latest/dex/tokens/0x973104fAa7F2B11787557e85953ECA6B4e262328';

interface CachedPrice {
  price: number;
  timestamp: number;
}

export interface NctrMarketPrice {
  price: number | null;
  loading: boolean;
  error: string | null;
}

function readCache(): CachedPrice | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedPrice = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(price: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ price, timestamp: Date.now() }));
}

export function useNctrMarketPrice(): NctrMarketPrice {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setPrice(cached.price);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(DEXSCREENER_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const pairs: any[] = data?.pairs || [];
        if (!pairs.length) throw new Error('No pairs found');

        // Find highest liquidity pair
        const best = pairs.reduce((a: any, b: any) =>
          (Number(b.liquidity?.usd) || 0) > (Number(a.liquidity?.usd) || 0) ? b : a
        );

        const priceUsd = Number(best.priceUsd);
        if (!priceUsd || isNaN(priceUsd)) throw new Error('Invalid price');

        writeCache(priceUsd);
        if (!cancelled) {
          setPrice(priceUsd);
          setLoading(false);
        }
      } catch (e: any) {
        // Fall back to stale cache if available
        if (cached) {
          if (!cancelled) {
            setPrice(cached.price);
            setLoading(false);
          }
        } else if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { price, loading, error };
}
