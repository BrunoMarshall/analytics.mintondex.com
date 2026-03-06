import io, json

# ============================================================
# 1. Add TokenDayData to schema.graphql
# ============================================================
schema = """type Pair @entity {
  id: ID!
  token0: Token!
  token1: Token!
  reserve0: BigDecimal!
  reserve1: BigDecimal!
  totalSupply: BigDecimal!
  token0Price: BigDecimal!
  token1Price: BigDecimal!
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  volumeUSD: BigDecimal!
  txCount: BigInt!
  createdAtTimestamp: BigInt!
  createdAtBlockNumber: BigInt!
  pairDayData: [PairDayData!]! @derivedFrom(field: "pair")
  mints: [Mint!]! @derivedFrom(field: "pair")
  burns: [Burn!]! @derivedFrom(field: "pair")
  swaps: [Swap!]! @derivedFrom(field: "pair")
}

type Token @entity {
  id: ID!
  symbol: String!
  name: String!
  decimals: BigInt!
  totalSupply: BigDecimal!
  tradeVolume: BigDecimal!
  txCount: BigInt!
  poolCount: BigInt!
  priceUSD: BigDecimal!
  tokenDayData: [TokenDayData!]! @derivedFrom(field: "token")
}

type MintondexDayData @entity {
  id: ID!
  date: Int!
  volumeUSD: BigDecimal!
  tvlUSD: BigDecimal!
  txCount: BigInt!
}

type PairDayData @entity {
  id: ID!
  date: Int!
  pair: Pair!
  reserve0: BigDecimal!
  reserve1: BigDecimal!
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  volumeUSD: BigDecimal!
  txCount: BigInt!
}

type TokenDayData @entity {
  id: ID!
  date: Int!
  token: Token!
  priceUSD: BigDecimal!
  volumeUSD: BigDecimal!
  txCount: BigInt!
}

type Mint @entity {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0: BigDecimal!
  amount1: BigDecimal!
  amountUSD: BigDecimal!
  logIndex: BigInt
}

type Burn @entity {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0: BigDecimal!
  amount1: BigDecimal!
  amountUSD: BigDecimal!
  logIndex: BigInt
}

type Swap @entity {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0In: BigDecimal!
  amount1In: BigDecimal!
  amount0Out: BigDecimal!
  amount1Out: BigDecimal!
  amountUSD: BigDecimal!
  to: Bytes!
  logIndex: BigInt
}
"""
with io.open("C:/mintondex/subgraph/schema.graphql", "w", encoding="utf-8") as f:
    f.write(schema)
print("saved schema.graphql with TokenDayData")

# ============================================================
# 2. Update pair.ts to populate TokenDayData
# ============================================================
pair_ts = """import { Swap as SwapEvent, Mint as MintEvent, Burn as BurnEvent, Sync as SyncEvent } from "../generated/templates/Pair/Pair";
import { Pair, Token, Swap, Mint as MintEntity, Burn as BurnEntity, PairDayData, MintondexDayData, TokenDayData } from "../generated/schema";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

const ZERO_BD = BigDecimal.fromString("0");
const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";

function convertToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  if (decimals.equals(BigInt.fromI32(0))) return amount.toBigDecimal();
  let bd = BigDecimal.fromString("1");
  for (let i = 0; i < decimals.toI32(); i++) { bd = bd.times(BigDecimal.fromString("10")); }
  return amount.toBigDecimal().div(bd);
}

function getSHMPrice(): BigDecimal { return BigDecimal.fromString("1"); }

function getTokenPriceUSD(tokenId: string, pair: Pair): BigDecimal {
  if (tokenId == WSHM) return getSHMPrice();
  if (pair.token0 == WSHM) return pair.token1Price.times(getSHMPrice());
  if (pair.token1 == WSHM) return pair.token0Price.times(getSHMPrice());
  return ZERO_BD;
}

function updatePairDayData(event: SyncEvent, pair: Pair): void {
  let dayIndex = event.block.timestamp.toI32() / 86400;
  let id = pair.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());
  let d = PairDayData.load(id);
  if (d === null) {
    d = new PairDayData(id); d.date = dayIndex * 86400; d.pair = pair.id;
    d.volumeToken0 = ZERO_BD; d.volumeToken1 = ZERO_BD;
    d.volumeUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);
  }
  d.reserve0 = pair.reserve0; d.reserve1 = pair.reserve1; d.save();
}

function updateTokenDayData(token: Token, timestamp: BigInt, volumeUSD: BigDecimal): void {
  let dayIndex = timestamp.toI32() / 86400;
  let id = token.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());
  let d = TokenDayData.load(id);
  if (d === null) {
    d = new TokenDayData(id);
    d.date = dayIndex * 86400;
    d.token = token.id;
    d.volumeUSD = ZERO_BD;
    d.txCount = BigInt.fromI32(0);
  }
  d.priceUSD = token.priceUSD;
  d.volumeUSD = d.volumeUSD.plus(volumeUSD);
  d.txCount = d.txCount.plus(BigInt.fromI32(1));
  d.save();
}

function updateProtocolDayData(timestamp: BigInt, volumeUSD: BigDecimal): void {
  let dayIndex = timestamp.toI32() / 86400;
  let id = BigInt.fromI32(dayIndex).toString();
  let d = MintondexDayData.load(id);
  if (d === null) {
    d = new MintondexDayData(id); d.date = dayIndex * 86400;
    d.volumeUSD = ZERO_BD; d.tvlUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);
  }
  d.volumeUSD = d.volumeUSD.plus(volumeUSD);
  d.txCount = d.txCount.plus(BigInt.fromI32(1));
  d.save();
}

export function handleSync(event: SyncEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  pair.reserve0 = convertToDecimal(event.params.reserve0, t0.decimals);
  pair.reserve1 = convertToDecimal(event.params.reserve1, t1.decimals);
  if (!pair.reserve1.equals(ZERO_BD)) pair.token0Price = pair.reserve0.div(pair.reserve1);
  else pair.token0Price = ZERO_BD;
  if (!pair.reserve0.equals(ZERO_BD)) pair.token1Price = pair.reserve1.div(pair.reserve0);
  else pair.token1Price = ZERO_BD;
  t0.priceUSD = getTokenPriceUSD(t0.id, pair as Pair);
  t1.priceUSD = getTokenPriceUSD(t1.id, pair as Pair);
  t0.save(); t1.save(); pair.save();
  updatePairDayData(event, pair as Pair);
  updateTokenDayData(t0 as Token, event.block.timestamp, ZERO_BD);
  updateTokenDayData(t1 as Token, event.block.timestamp, ZERO_BD);
}

export function handleMint(event: MintEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  let amt0 = convertToDecimal(event.params.amount0, t0.decimals);
  let amt1 = convertToDecimal(event.params.amount1, t1.decimals);
  let amtUSD = amt0.times(t0.priceUSD).plus(amt1.times(t1.priceUSD));
  pair.txCount = pair.txCount.plus(BigInt.fromI32(1)); pair.save();
  let mint = new MintEntity(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  mint.pair = pair.id; mint.timestamp = event.block.timestamp;
  mint.sender = event.params.sender; mint.amount0 = amt0; mint.amount1 = amt1;
  mint.amountUSD = amtUSD; mint.logIndex = event.logIndex; mint.save();
  updateProtocolDayData(event.block.timestamp, ZERO_BD);
}

export function handleBurn(event: BurnEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  let amt0 = convertToDecimal(event.params.amount0, t0.decimals);
  let amt1 = convertToDecimal(event.params.amount1, t1.decimals);
  let amtUSD = amt0.times(t0.priceUSD).plus(amt1.times(t1.priceUSD));
  pair.txCount = pair.txCount.plus(BigInt.fromI32(1)); pair.save();
  let burn = new BurnEntity(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  burn.pair = pair.id; burn.timestamp = event.block.timestamp;
  burn.sender = event.params.sender; burn.amount0 = amt0; burn.amount1 = amt1;
  burn.amountUSD = amtUSD; burn.logIndex = event.logIndex; burn.save();
  updateProtocolDayData(event.block.timestamp, ZERO_BD);
}

export function handleSwap(event: SwapEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  let amt0In = convertToDecimal(event.params.amount0In, t0.decimals);
  let amt1In = convertToDecimal(event.params.amount1In, t1.decimals);
  let amt0Out = convertToDecimal(event.params.amount0Out, t0.decimals);
  let amt1Out = convertToDecimal(event.params.amount1Out, t1.decimals);
  let vol0 = amt0In.plus(amt0Out); let vol1 = amt1In.plus(amt1Out);
  let volumeUSD = vol0.times(t0.priceUSD);
  if (volumeUSD.equals(ZERO_BD)) volumeUSD = vol1.times(t1.priceUSD);
  pair.volumeToken0 = pair.volumeToken0.plus(vol0);
  pair.volumeToken1 = pair.volumeToken1.plus(vol1);
  pair.volumeUSD = pair.volumeUSD.plus(volumeUSD);
  pair.txCount = pair.txCount.plus(BigInt.fromI32(1));
  t0.tradeVolume = t0.tradeVolume.plus(vol0); t0.txCount = t0.txCount.plus(BigInt.fromI32(1));
  t1.tradeVolume = t1.tradeVolume.plus(vol1); t1.txCount = t1.txCount.plus(BigInt.fromI32(1));
  t0.save(); t1.save(); pair.save();
  let swap = new Swap(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  swap.pair = pair.id; swap.timestamp = event.block.timestamp;
  swap.sender = event.params.sender; swap.to = event.params.to;
  swap.amount0In = amt0In; swap.amount1In = amt1In;
  swap.amount0Out = amt0Out; swap.amount1Out = amt1Out;
  swap.amountUSD = volumeUSD; swap.logIndex = event.logIndex; swap.save();
  updateProtocolDayData(event.block.timestamp, volumeUSD);
  updateTokenDayData(t0 as Token, event.block.timestamp, vol0.times(t0.priceUSD));
  updateTokenDayData(t1 as Token, event.block.timestamp, vol1.times(t1.priceUSD));
}
"""
with io.open("C:/mintondex/subgraph/src/pair.ts", "w", encoding="utf-8") as f:
    f.write(pair_ts)
print("saved pair.ts with TokenDayData population")

# ============================================================
# 3. Add TOKEN_DAY_DATA_QUERY to queries.ts
# ============================================================
queries = io.open("C:/mintondex/frontend/src/graphql/queries.ts", encoding="utf-8").read()
if "tokenDayDatas" not in queries:
    queries += """
export const TOKEN_DAY_DATA_QUERY = gql`
  query GetTokenDayData($tokenId: String!) {
    tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc,
      where: { token: $tokenId }) {
      date priceUSD volumeUSD txCount
    }
  }
`;
"""
    with io.open("C:/mintondex/frontend/src/graphql/queries.ts", "w", encoding="utf-8") as f:
        f.write(queries)
    print("updated queries.ts with TOKEN_DAY_DATA_QUERY")
else:
    print("queries.ts already has tokenDayDatas")

# ============================================================
# 4. Fix TokensPage - use tokenDayDatas for ATH/ATL/7D
# ============================================================
tokens_content = """import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { TOKENS_QUERY } from "../graphql/queries";
import { formatNumber, formatUSD } from "../utils/format";
import TokenIcon from "../components/TokenIcon";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { useNavigate } from "react-router-dom";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";
const SUBGRAPH = "https://graph.analytics.mintondex.com/subgraphs/name/mintondex-v2";

interface TokenStats {
  lastWeekPrice: number;
  ath: number;
  atl: number;
}

function PctChange({ current, prev }: { current: number; prev: number }) {
  if (!prev || !current) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const pct = ((current - prev) / prev) * 100;
  const color = pct >= 0 ? "#22c55e" : "#ef4444";
  return <span style={{ color, fontWeight: 600, fontSize: 12 }}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</span>;
}

function AthAtl({ price, extreme, label }: { price: number; extreme: number; label: string }) {
  if (!extreme || !price) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const pct = ((price - extreme) / extreme) * 100;
  const color = label === "ATH" ? "#ef4444" : "#22c55e";
  return (
    <div style={{ lineHeight: 1.4 }}>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{formatUSD(extreme, false)}</div>
      <div style={{ color, fontSize: 11 }}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</div>
    </div>
  );
}

const TokensPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useQuery(TOKENS_QUERY);
  const { shmPrice } = useSHMPrice();
  const navigate = useNavigate();
  const [mexcHistory, setMexcHistory] = useState<number[][]>([]);
  const [tokenStats, setTokenStats] = useState<Record<string, TokenStats>>({});

  useEffect(() => {
    fetch("/api/shm-history")
      .then(r => r.json())
      .then(k => setMexcHistory(k ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data?.tokens || !shmPrice) return;
    const fetchAll = async () => {
      const stats: Record<string, TokenStats> = {};
      for (const token of data.tokens) {
        try {
          const res = await fetch(SUBGRAPH, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: `{ tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { token: "${token.id}" }) { date priceUSD } }` })
          });
          const json = await res.json();
          const days = json?.data?.tokenDayDatas ?? [];
          if (days.length === 0) continue;
          const prices = days.map((d: any) => parseFloat(d.priceUSD) * shmPrice).filter((p: number) => p > 0);
          if (prices.length === 0) continue;
          const ath = Math.max(...prices);
          const atl = Math.min(...prices);
          const weekAgoTs = Math.floor(Date.now() / 1000) - 7 * 86400;
          const weekEntry = days.find((d: any) => d.date >= weekAgoTs) ?? days[0];
          stats[token.id] = {
            lastWeekPrice: parseFloat(weekEntry.priceUSD) * shmPrice,
            ath, atl
          };
        } catch {}
      }
      setTokenStats(stats);
    };
    fetchAll();
  }, [data, shmPrice]);

  const shmStats: TokenStats | null = React.useMemo(() => {
    if (mexcHistory.length === 0) return null;
    const closes = mexcHistory.map((k: any[]) => parseFloat(k[4]));
    const ath = Math.max(...closes);
    const atl = Math.min(...closes);
    const lastWeekPrice = closes[Math.max(0, closes.length - 8)];
    return { lastWeekPrice, ath, atl };
  }, [mexcHistory]);

  const tokens = (data?.tokens ?? []).filter((t: any) => {
    const q = search.toLowerCase();
    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
  });

  const rows = tokens.map((token: any) => {
    const isWshm = token.id.toLowerCase() === WSHM;
    const stats = isWshm ? shmStats : (tokenStats[token.id] ?? null);
    return {
      id: token.id, symbol: token.symbol, name: token.name,
      priceUSD: parseFloat(token.priceUSD || "0") * shmPrice,
      marketCap: parseFloat(token.priceUSD || "0") * shmPrice * parseFloat(token.totalSupply || "0"),
      volume: parseFloat(token.tradeVolume || "0") * shmPrice,
      txCount: parseInt(token.txCount || "0"),
      poolCount: parseInt(token.poolCount || "0"),
      isSHM: false, stats
    };
  });

  const shmMatches = !search || "shm".includes(search.toLowerCase()) || "shardeum".includes(search.toLowerCase());
  if (shmMatches) {
    rows.push({
      id: "shm-native", symbol: "SHM", name: "Shardeum",
      priceUSD: shmPrice, marketCap: 0, volume: 0,
      txCount: -1, poolCount: -1, isSHM: true, stats: shmStats
    });
  }

  rows.sort((a, b) => b.marketCap - a.marketCap);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tokens</h1>
        <p className="page-subtitle">All tokens indexed on MintonDex</p>
      </div>
      {error && <div className="error-state" style={{ marginBottom: 24 }}><strong>Error loading tokens</strong></div>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <input className="search-bar" placeholder="Search by name, symbol or address..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Token</th><th>Price (USD)</th><th>7D Change</th>
              <th>ATH</th><th>ATL</th><th>Market Cap</th><th>Volume</th>
              <th>Transactions</th><th>Pools</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10}><div className="loading-state"><div className="spinner" /></div></td></tr>
            ) : (
              rows.map((token: any, i: number) => (
                <tr key={token.id} onClick={() => !token.isSHM && navigate("/tokens/" + token.id)} style={{ cursor: token.isSHM ? "default" : "pointer" }}>
                  <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", width: 40 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <TokenIcon address={token.id} symbol={token.symbol} size={28} isSHM={token.isSHM} />
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: "var(--font-heading)" }}>{token.symbol}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{token.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: token.stats?.lastWeekPrice ? (token.priceUSD >= token.stats.lastWeekPrice ? "#22c55e" : "#ef4444") : "var(--accent)" }}>
                    {formatUSD(token.priceUSD, false)}
                  </td>
                  <td><PctChange current={token.priceUSD} prev={token.stats?.lastWeekPrice ?? 0} /></td>
                  <td><AthAtl price={token.priceUSD} extreme={token.stats?.ath ?? 0} label="ATH" /></td>
                  <td><AthAtl price={token.priceUSD} extreme={token.stats?.atl ?? 0} label="ATL" /></td>
                  <td style={{ fontWeight: 600 }}>{token.marketCap > 0 ? formatUSD(token.marketCap, true) : "—"}</td>
                  <td>{formatUSD(token.volume, true)}</td>
                  <td>{token.txCount === -1 ? "—" : formatNumber(token.txCount, 0)}</td>
                  <td>{token.poolCount === -1 ? "—" : formatNumber(token.poolCount, 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokensPage;
"""
with io.open("C:/mintondex/frontend/src/pages/TokensPage.tsx", "w", encoding="utf-8") as f:
    f.write(tokens_content)
print("saved TokensPage.tsx")

print("\nDone! Now run:")
print("cd C:/mintondex/subgraph && npm run codegen && npm run build && graph deploy --node http://144.91.89.44:8020 --ipfs http://144.91.89.44:5001 mintondex-v2")
print("Use v0.0.15")
print()
print("Then: cd C:/mintondex && git add . && git commit -m 'feat: TokenDayData for ATH/ATL/7D + fix positions/wallet/TVL' && git push")
print("VPS: cd /var/www/analytics-src && git pull && cd frontend && npm run build && cp -r dist/* /var/www/analytics.mintondex.com/")
