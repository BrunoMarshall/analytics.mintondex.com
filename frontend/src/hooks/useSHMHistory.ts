import { useState, useEffect } from "react";

export interface PricePoint { date: string; tvlUSD: string; }

export function useSHMHistory(): { data: PricePoint[]; loading: boolean } {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/shm-history")
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
