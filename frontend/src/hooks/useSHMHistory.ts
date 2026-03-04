import { useState, useEffect } from "react";

const API_KEY = "CG-N63QyXNQgXZYsjEPe3U4NTsX";
const HISTORY_URL = `https://api.coingecko.com/api/v3/coins/shardeum/market_chart?vs_currency=usd&days=90&interval=daily&x_cg_demo_api_key=${API_KEY}`;

export interface PricePoint { date: string; tvlUSD: string; }

export function useSHMHistory(): { data: PricePoint[]; loading: boolean } {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(HISTORY_URL)
      .then(r => r.json())
      .then(json => {
        const points: PricePoint[] = (json.prices ?? []).map((p: number[]) => ({
          date: String(Math.floor(p[0] / 1000)),
          tvlUSD: String(p[1])
        }));
        setData(points);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
