import { useState, useEffect } from "react";

export interface PricePoint { date: string; tvlUSD: string; }

export function useSHMHistory(): { data: PricePoint[]; loading: boolean } {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/shm-history")
      .then(r => r.json())
      .then(json => {
        // MEXC klines: [openTime, open, high, low, close, volume, ...]
        const points: PricePoint[] = (json ?? []).map((k: any[]) => ({
          date: String(Math.floor(k[0] / 1000)),
          tvlUSD: String(parseFloat(k[4]))
        }));
        setData(points);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
