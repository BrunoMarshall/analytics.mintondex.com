const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=shardeum&vs_currencies=usd&x_cg_demo_api_key=CG-N63QyXNQgXZYsjEPe3U4NTsX";
const HISTORY_URL = "https://api.coingecko.com/api/v3/coins/shardeum/market_chart?vs_currency=usd&days=90&interval=daily&x_cg_demo_api_key=CG-N63QyXNQgXZYsjEPe3U4NTsX";
const MARKET_URL = "https://api.coingecko.com/api/v3/simple/price?ids=shardeum&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&x_cg_demo_api_key=CG-N63QyXNQgXZYsjEPe3U4NTsX";
let cachedPrice: number = 0.00008806;
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
export async function getSHMMarketData(): Promise<{price:number;marketCap:number;volume24h:number}> {
  try {
    const res = await fetch(MARKET_URL);
    const data = await res.json();
    const d = data?.shardeum;
    return { price: d?.usd ?? 0, marketCap: d?.usd_market_cap ?? 0, volume24h: d?.usd_24h_vol ?? 0 };
  } catch { return { price: cachedPrice, marketCap: 0, volume24h: 0 }; }
}
export async function getSHMHistory(): Promise<{prices: number[][]}> {
  try {
    const res = await fetch(HISTORY_URL);
    return await res.json();
  } catch { return { prices: [] }; }
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
