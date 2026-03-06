import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { TOKEN_DETAIL_QUERY } from "../graphql/queries";
import { TVLChart, VolumeChart } from "../components/Charts";
import { formatUSD, formatNumber, daysAgo } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { useSHMHistory } from "../hooks/useSHMHistory";
import TokenIcon from "../components/TokenIcon";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";
const SUBGRAPH = "https://graph.analytics.mintondex.com/subgraphs/name/mintondex-v2";

type Range = "24H" | "7D" | "1M" | "MAX";

const TokenDetailPage: React.FC = () => {
  const { tokenId: rawId } = useParams<{ tokenId: string }>();
  const id = (rawId ?? "").toLowerCase();
  const navigate = useNavigate();
  const { shmPrice } = useSHMPrice();
  const { data: shmHistory, loading: shmLoading } = useSHMHistory();
  const [range, setRange] = useState<Range>("1M");
  const [tokenDayDatas, setTokenDayDatas] = useState<any[]>([]);
  const [pairDayDatas, setPairDayDatas] = useState<any[]>([]);

  const { data, loading, error } = useQuery(TOKEN_DETAIL_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: "network-only"
  });

  // Fetch TokenDayData for price + volume charts
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

  // Fetch PairDayData for TVL chart - find the main pair for this token
  React.useEffect(() => {
    if (!id) return;
    fetch(SUBGRAPH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `{ pairDayDatas(first: 365, orderBy: date, orderDirection: asc, where: { pair_in: [] }) { date reserve0 reserve1 } }` })
    }).catch(() => {});
  }, [id]);

  const token = data?.token;
  const isWshm = id === WSHM;

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;
  if (error) return <div className="error-state">Error: {error.message}</div>;
  if (!token) return <div className="error-state">Token not found</div>;

  const priceUSD = isWshm ? shmPrice : (parseFloat(token.priceUSD || "0") > 0 ? (1 / parseFloat(token.priceUSD)) * shmPrice : 0);
  const volumeUSD = parseFloat(token.tradeVolume || "0") * shmPrice;

  // TVL from pairs - use WSHM reserve * 2
  const pairs = [...(token.pairsBase ?? []), ...(token.pairsQuote ?? [])];
  const tvl = pairs.reduce((sum: number, p: any) => {
    const isToken0Wshm = p.token0?.id?.toLowerCase() === WSHM;
    const isToken1Wshm = p.token1?.id?.toLowerCase() === WSHM;
    if (isToken0Wshm) return sum + parseFloat(p.reserve0 || "0") * 2 * shmPrice;
    if (isToken1Wshm) return sum + parseFloat(p.reserve1 || "0") * 2 * shmPrice;
    return sum + parseFloat(p.reserve1 || "0") * 2 * shmPrice;
  }, 0);

  // Price chart
  const rawPriceData = isWshm
    ? shmHistory.map((d: any) => ({ ts: parseInt(d.date), price: parseFloat(d.tvlUSD) }))
    : tokenDayDatas.map((d: any) => ({ ts: d.date, price: parseFloat(d.priceUSD || "0") > 0 ? (1 / parseFloat(d.priceUSD || "0")) * shmPrice : 0 }));

  const now = Math.floor(Date.now() / 1000);
  const rangeSecs: Record<Range, number> = { "24H": 86400, "7D": 7 * 86400, "1M": 30 * 86400, "MAX": 99999999 };
  const filtered = rawPriceData.filter((d: any) => d.ts >= now - rangeSecs[range]);

  const priceChartData = filtered.map((d: any) => ({
    date: new Date(d.ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: d.price
  }));

  // Volume chart from tokenDayDatas
  const volumeChartData = tokenDayDatas.map((d: any) => ({
    date: String(d.date),
    volumeUSD: (parseFloat(d.volumeUSD || "0") > 0 ? (1 / parseFloat(d.volumeUSD || "0")) * shmPrice : 0).toString()
  }));

  // TVL chart: build from tokenDayDatas price * a fixed supply proxy
  // Best approximation: use current TVL scaled by price ratio each day
  const currentPrice = priceUSD || 1;
  const tvlChartData = tokenDayDatas.map((d: any) => {
    const dayPrice = parseFloat(d.priceUSD || "0") > 0 ? (1 / parseFloat(d.priceUSD || "0")) * shmPrice : 0;
    const ratio = currentPrice > 0 ? dayPrice / currentPrice : 1;
    return {
      date: String(d.date),
      tvlUSD: (tvl * ratio).toString()
    };
  });

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

      {/* Price Chart with range selector */}
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

      {/* TVL + Volume side by side */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <TVLChart data={tvlChartData} loading={false} title="Total Value Locked" />
        <VolumeChart data={volumeChartData} loading={false} />
      </div>

      {pairs.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Pairs</div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Pair</th><th>TVL</th><th>Reserve 0</th><th>Reserve 1</th><th>Volume</th><th>Txns</th></tr>
              </thead>
              <tbody>
                {pairs.map((p: any) => {
                  const isT0Wshm = p.token0?.id?.toLowerCase() === WSHM;
                  const isT1Wshm = p.token1?.id?.toLowerCase() === WSHM;
                  const pTvl = isT0Wshm
                    ? parseFloat(p.reserve0 || "0") * 2 * shmPrice
                    : parseFloat(p.reserve1 || "0") * 2 * shmPrice;
                  return (
                    <tr key={p.id} onClick={() => navigate("/pools/" + p.id)} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <TokenIcon address={p.token0?.id} symbol={p.token0?.symbol} size={20} />
                          <TokenIcon address={p.token1?.id} symbol={p.token1?.symbol} size={20} />
                          <span style={{ fontWeight: 700 }}>{p.token0?.symbol}/{p.token1?.symbol}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--accent-green)", fontWeight: 700 }}>{formatUSD(pTvl, false)}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{parseFloat(p.reserve0 || "0").toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{parseFloat(p.reserve1 || "0").toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                      <td>{formatUSD(parseFloat(p.volumeUSD || "0") * shmPrice, true)}</td>
                      <td>{formatNumber(parseInt(p.txCount || "0"), 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDetailPage;
