import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { TOKEN_DETAIL_QUERY, TOKEN_DAY_DATA_QUERY } from "../graphql/queries";
import { TVLChart, VolumeChart } from "../components/Charts";
import { formatUSD, formatNumber, daysAgo } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { useSHMHistory } from "../hooks/useSHMHistory";
import TokenIcon from "../components/TokenIcon";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";

type Range = "24H" | "7D" | "1M" | "MAX";

const TokenDetailPage: React.FC = () => {
  const { tokenId: rawId } = useParams<{ tokenId: string }>();
  const id = (rawId ?? "").toLowerCase();
  const navigate = useNavigate();
  const { shmPrice } = useSHMPrice();
  const { data: shmHistory, loading: shmLoading } = useSHMHistory();
  const [range, setRange] = useState<Range>("1M");

  const { data, loading, error } = useQuery(TOKEN_DETAIL_QUERY, { variables: { id }, skip: !id, fetchPolicy: "network-only" });
  const { data: dayData } = useQuery(TOKEN_DAY_DATA_QUERY, { variables: { tokenId: id, startTime: daysAgo(90) }, skip: !id });

  const token = data?.token;
  const isWshm = id === WSHM;
  const tokenDayDatas = dayData?.tokenDayDatas ?? [];

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;
  if (error) return <div className="error-state">Error: {error.message}</div>;
  if (!token) return <div className="error-state">Token not found</div>;

  const priceUSD = isWshm ? shmPrice : parseFloat(token.priceUSD || "0") * shmPrice;
  const volumeUSD = parseFloat(token.tradeVolume || "0") * shmPrice;

  // TVL: find WSHM side of each pair and double it (AMM = equal value both sides)
  const pairs = [...(token.pairsBase ?? []), ...(token.pairsQuote ?? [])];
  const tvl = pairs.reduce((sum: number, p: any) => {
    const t0isWshm = (p.token0?.id ?? "").toLowerCase() === WSHM;
    const wshmReserve = t0isWshm ? parseFloat(p.reserve0 || "0") : parseFloat(p.reserve1 || "0");
    return sum + wshmReserve * 2 * shmPrice;
  }, 0);

  // Raw price history
  const rawPriceData = isWshm
    ? shmHistory.map((d: any) => ({ ts: parseInt(d.date), price: parseFloat(d.tvlUSD) }))
    : tokenDayDatas.map((d: any) => ({ ts: d.date, price: parseFloat(d.priceUSD || "0") * shmPrice }));

  // Filter by range
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

  const latest = priceChartData[priceChartData.length - 1]?.value ?? 0;
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
        <div className="card"><div className="card-title">Market Cap</div><div className="card-value">{formatUSD(priceUSD * parseFloat(token.totalSupply || "0"), true)}</div></div>
        <div className="card"><div className="card-title">Transactions</div><div className="card-value">{formatNumber(parseInt(token.txCount || "0"), 0)}</div></div>
      </div>

      {/* Price Chart - full width with range selector */}
      <div className="chart-container" style={{ marginBottom: 16 }}>
        <div className="chart-header">
          <div>
            <div className="chart-title">{token.symbol} Price (USD)</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "var(--accent-yellow)", fontWeight: 700, fontSize: 18, marginRight: 12 }}>{formatPrice(latest)}</div>
            <div className="chart-tabs">
              {(["24H","7D","1M","MAX"] as Range[]).map(r => (
                <button key={r} className={"chart-tab" + (range === r ? " active" : "")} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>
        {shmLoading && isWshm ? (
          <div className="loading-state" style={{ padding: 40 }}><div className="spinner" /></div>
        ) : priceChartData.length === 0 ? (
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
        <TVLChart data={tokenDayDatas.map((d: any) => ({ date: String(d.date), tvlUSD: (parseFloat(d.priceUSD || "0") * shmPrice * parseFloat(d.txCount || "1")).toString() }))} loading={false} />
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
