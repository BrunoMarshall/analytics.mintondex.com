import { useState, useEffect } from "react";
import { getSHMPriceUSD } from "../utils/coingecko";

export function useSHMPrice() {
  const [shmPrice, setShmPrice] = useState<number>(0.07);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchPrice = async () => {
      const price = await getSHMPriceUSD();
      if (mounted) {
        setShmPrice(price);
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { shmPrice, loading };
}