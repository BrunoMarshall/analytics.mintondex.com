import { useState, useEffect } from "react";

const MEXC_KLINES = "https://api.mexc.com/api/v3/klines?symbol=SHMUSDT&interval=1d&limit=1000";

export interface PricePoint { date: string; tvlUSD: string; }

export function useSHMHistory(): { data: PricePoint[]; loading: boolean } {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(MEXC_KLINES)
      .then(r => r.json())
      .then(json => {
        // MEXC klines format: [openTime, open, high, low, close, volume, ...]
        const points: PricePoint[] = (json ?? []).map((k: any[]) => ({
          date: String(Math.floor(k[0] / 1000)),
          tvlUSD: String(parseFloat(k[4])) // close price
        }));
        setData(points);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
