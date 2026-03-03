const COINGECKO_URL = "/api/shm-price";
let cachedPrice: number = 0.00008762;
let lastFetched: number = 0;
const CACHE_TTL = 60 * 1000;
export async function getSHMPriceUSD(): Promise<number> {
  const now = Date.now();
  if (now - lastFetched < CACHE_TTL && cachedPrice > 0) return cachedPrice;
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    cachedPrice = data?.shardeum?.usd ?? cachedPrice;
    lastFetched = now;
    return cachedPrice;
  } catch { return cachedPrice; }
}
export function formatSHMPrice(price: number): string {
  if (price === 0) return "$0.00";
  if (price < 0.000001) return "$" + price.toFixed(10);
  if (price < 0.0001) return "$" + price.toFixed(8);
  if (price < 0.01) return "$" + price.toFixed(6);
  if (price < 1) return "$" + price.toFixed(4);
  return "$" + price.toFixed(2);
}
export function tokenPriceToUSD(priceInWshm: string | number, shmUSD: number): number {
  return parseFloat(String(priceInWshm)) * shmUSD;
}
export function tvlToUSD(token0Amount: string, token1Amount: string, token0PriceInWshm: string, shmUSD: number): number {
  return parseFloat(token0Amount) * shmUSD + parseFloat(token1Amount) * parseFloat(token0PriceInWshm) * shmUSD;
}
