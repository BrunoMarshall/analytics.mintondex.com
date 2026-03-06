import io

# ============================================================
# 1. Fix schema - add pairsBase/pairsQuote derived fields on Token
# ============================================================
schema = """type Pair @entity(immutable: false) {
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

type Token @entity(immutable: false) {
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
  pairsBase: [Pair!]! @derivedFrom(field: "token0")
  pairsQuote: [Pair!]! @derivedFrom(field: "token1")
}

type MintondexDayData @entity(immutable: false) {
  id: ID!
  date: Int!
  volumeUSD: BigDecimal!
  tvlUSD: BigDecimal!
  txCount: BigInt!
}

type PairDayData @entity(immutable: false) {
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

type TokenDayData @entity(immutable: false) {
  id: ID!
  date: Int!
  token: Token!
  priceUSD: BigDecimal!
  volumeUSD: BigDecimal!
  txCount: BigInt!
}

type Mint @entity(immutable: true) {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0: BigDecimal!
  amount1: BigDecimal!
  amountUSD: BigDecimal!
  logIndex: BigInt
}

type Burn @entity(immutable: true) {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0: BigDecimal!
  amount1: BigDecimal!
  amountUSD: BigDecimal!
  logIndex: BigInt
}

type Swap @entity(immutable: true) {
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
print("saved schema.graphql with pairsBase/pairsQuote")

# ============================================================
# 2. Fix TOKEN_DETAIL_QUERY in queries.ts to include pairs
# ============================================================
queries = io.open("C:/mintondex/frontend/src/graphql/queries.ts", encoding="utf-8").read()

# Replace or add TOKEN_DETAIL_QUERY
token_detail_query = '''
export const TOKEN_DETAIL_QUERY = gql`
  query GetToken($id: ID!) {
    token(id: $id) {
      id symbol name decimals totalSupply
      priceUSD tradeVolume txCount poolCount
      pairsBase(first: 10, orderBy: volumeUSD, orderDirection: desc) {
        id reserve0 reserve1 token0Price token1Price volumeUSD txCount
        token0 { id symbol }
        token1 { id symbol }
      }
      pairsQuote(first: 10, orderBy: volumeUSD, orderDirection: desc) {
        id reserve0 reserve1 token0Price token1Price volumeUSD txCount
        token0 { id symbol }
        token1 { id symbol }
      }
    }
  }
\`;
'''

if 'TOKEN_DETAIL_QUERY' in queries:
    # Remove old one and replace
    import re
    queries = re.sub(
        r'export const TOKEN_DETAIL_QUERY = gql`[\s\S]*?`;',
        token_detail_query.strip(),
        queries
    )
else:
    queries += token_detail_query

with io.open("C:/mintondex/frontend/src/graphql/queries.ts", "w", encoding="utf-8") as f:
    f.write(queries)
print("updated TOKEN_DETAIL_QUERY in queries.ts")

# ============================================================
# 3. Fix TokenDetailPage - correct price calculation
# The prices shown before were correct: token0Price * shmPrice
# WSHM is token1 in most pairs, so token1Price = WSHM per token
# priceUSD = token1Price * shmPrice (how many WSHM per token * USD per WSHM)
# ============================================================
token_detail = """import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { TOKEN_DETAIL_QUERY } from "../graphql/queries";
import { VolumeChart } from "../components/Charts";
import { formatUSD, formatNumber, daysAgo } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { useSHMHistory } from "../hooks/useSHMHistory";
import TokenIcon from "../components/TokenIcon";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";

type Range = "24H" | "7D" | "1M" | "MAX";
const SUBGRAPH = "https://graph.analytics.mintondex.com/subgraphs/name/mintondex-v2";

const TokenDetailPage: React.FC = () => {
  const { tokenId: rawId } = useParams<{ tokenId: string }>();
  const id = (rawId ?? "").toLowerCase();
  const navigate = useNavigate();
  const { shmPrice } = useSHMPrice();
  const { data: shmHistory, loading: shmLoading } = useSHMHistory();
  const [range, setRange] = useState<Range>("1M");
  const [tokenDayDatas, setTokenDayDatas] = useState<any[]>([]);

  const { data, loading, error } = useQuery(TOKEN_DETAIL_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: "network-only"
  });

  // Fetch TokenDayData directly
  React.useEffect(() => {
    if (!id) return;
    fetch(SUBGRAPH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `{ tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { token: "${id}" }) { date priceUSD volumeUSD } }` })
    })
      .then(r => r.json())
      .then(json => setTokenDayDatas(json?.data?.tokenDayDatas ?? []))
      .catch(() => {});
  }, [id]);

  const token = data?.token;
  const isWshm = id === WSHM;

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;
  if (error) return <div className="error-state">Error: {error.message}</div>;
  if (!token) return <div className="error-state">Token not found</div>;

  // Price: token.priceUSD is in WSHM units, multiply by shmPrice
  const priceUSD = isWshm ? shmPrice : parseFloat(token.priceUSD || "0") * shmPrice;
  const volumeUSD = parseFloat(token.tradeVolume || "0") * shmPrice;

  // TVL from pairs
  const pairs = [...(token.pairsBase ?? []), ...(token.pairsQuote ?? [])];
  const tvl = pairs.reduce((sum: number, p: any) => {
    const r1 = parseFloat(p.reserve1 || "0");
    return sum + r1 * 2 * shmPrice;
  }, 0);

  // Price chart data
  const rawPriceData = isWshm
    ? shmHistory.map((d: any) => ({ ts: parseInt(d.date), price: parseFloat(d.tvlUSD) }))
    : tokenDayDatas.map((d: any) => ({ ts: d.date, price: parseFloat(d.priceUSD || "0") * shmPrice }));

  const now = Math.floor(Date.now() / 1000);
  const rangeSecs: Record<Range, number> = { "24H": 86400, "7D": 7 * 86400, "1M": 30 * 86400, "MAX": 99999999 };
  const filtered = rawPriceData.filter((d: any) => d.ts >= now - rangeSecs[range]);

  const priceChartData = filtered.map((d: any) => ({
    date: new Date(d.ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: d.price
  }));

  const volumeChartData = tokenDayDatas.map((d: any) => ({
    date: String(d.date),
    volumeUSD: (parseFloat(d.volumeUSD || "0") * shmPrice).toString()
  }));

  const latest = priceChartData[priceChartData.length - 1]?.value ?? priceUSD;
  const formatPrice = (v: number) => v < 0.000001 ? "$" + v.toExponential(2) : v < 0.01 ? "$" + v.toFixed(8) : "$" + v.toFixed(4);

  return (
    <div>
      <div className="pool-detail-header">
        <div className="pool-detail-title">
          <button className="back-btn" onClick={() => navigate("/tokens")}>Back</button>
          <TokenIcon address={token.id} symbol={token.symbol} size={42} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {token.symbol}
            </h1>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{token.name}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="card"><div className="card-title">Price</div><div className="card-value">{formatUSD(priceUSD, false)}</div></div>
        <div className="card"><div className="card-title">TVL</div><div className="card-value">{formatUSD(tvl, true)}</div></div>
        <div className="card"><div className="card-title">Total Volume</div><div className="card-value">{formatUSD(volumeUSD, true)}</div></div>
        <div className="card"><div className="card-title">Transactions</div><div className="card-value">{formatNumber(parseInt(token.txCount || "0"), 0)}</div></div>
      </div>

      <div className="chart-container" style={{ marginBottom: 16 }}>
        <div className="chart-header">
          <div><div className="chart-title">{token.symbol} Price (USD)</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "var(--accent-yellow)", fontWeight: 700, fontSize: 18, marginRight: 12 }}>{formatPrice(latest)}</div>
            <div className="chart-tabs">
              {(["24H","7D","1M","MAX"] as Range[]).map(r => (
                <button key={r} className={"chart-tab" + (range === r ? " active" : "")} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>
        {priceChartData.length === 0 ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No price history yet — data builds up over time
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={priceChartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd166" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ffd166" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={90}
                tickFormatter={v => v < 0.000001 ? v.toExponential(1) : v < 0.01 ? "$" + v.toFixed(7) : "$" + v.toFixed(4)} />
              <Tooltip formatter={(v: any) => [formatPrice(v), "Price"]} labelStyle={{ color: "var(--text-muted)", fontSize: 11 }} contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="value" stroke="#ffd166" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <VolumeChart data={volumeChartData} loading={false} />
      </div>

      {pairs.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Pairs</div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Pair</th><th>Reserve 0</th><th>Reserve 1</th><th>Volume</th><th>Txns</th></tr>
              </thead>
              <tbody>
                {pairs.map((p: any) => (
                  <tr key={p.id} onClick={() => navigate("/pools/" + p.id)} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <TokenIcon address={p.token0?.id} symbol={p.token0?.symbol} size={20} />
                        <TokenIcon address={p.token1?.id} symbol={p.token1?.symbol} size={20} />
                        <span style={{ fontWeight: 700 }}>{p.token0?.symbol}/{p.token1?.symbol}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{parseFloat(p.reserve0 || "0").toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{parseFloat(p.reserve1 || "0").toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                    <td>{formatUSD(parseFloat(p.volumeUSD || "0") * shmPrice, true)}</td>
                    <td>{formatNumber(parseInt(p.txCount || "0"), 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDetailPage;
"""
with io.open("C:/mintondex/frontend/src/pages/TokenDetailPage.tsx", "w", encoding="utf-8") as f:
    f.write(token_detail)
print("saved TokenDetailPage.tsx")

print("\nNow redeploy subgraph (schema changed):")
print("cd C:/mintondex/subgraph && npm run codegen && npm run build && graph deploy --node http://144.91.89.44:8020 --ipfs http://144.91.89.44:5001 mintondex-v2")
print("Use v0.0.16")
print()
print("Then push frontend:")
print("cd C:/mintondex && git add . && git commit -m 'fix: add pairsBase/pairsQuote to schema, fix token prices' && git push")
print("VPS: cd /var/www/analytics-src && git pull && cd frontend && npm run build && cp -r dist/* /var/www/analytics.mintondex.com/")
