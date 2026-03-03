const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=shardeum&vs_currencies=usd";

let cachedPrice: number = 0.07;
let lastFetched: number = 0;
const CACHE_TTL = 60 * 1000;

export async function getSHMPriceUSD(): Promise<number> {
  const now = Date.now();
  if (now - lastFetched < CACHE_TTL && cachedPrice > 0) {
    return cachedPrice;
  }
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    cachedPrice = data?.shardeum?.usd ?? cachedPrice;
    lastFetched = now;
    return cachedPrice;
  } catch {
    return cachedPrice;
  }
}

export function tokenPriceToUSD(priceInWshm: string | number, shmUSD: number): number {
  return parseFloat(String(priceInWshm)) * shmUSD;
}

export function tvlToUSD(
  token0Amount: string,
  token1Amount: string,
  token0PriceInWshm: string,
  shmUSD: number
): number {
  const t0 = parseFloat(token0Amount) * shmUSD;
  const t1 = parseFloat(token1Amount) * parseFloat(token0PriceInWshm) * shmUSD;
  return t0 + t1;
}