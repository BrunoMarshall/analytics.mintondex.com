import io

# ============================================================
# FIX 1+2+3: PoolDetailPage - positions layout, wallet fix
# ============================================================

pool_content = """import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { POOL_DETAIL_QUERY, POOL_DAY_DATA_QUERY, RECENT_SWAPS_QUERY, LP_POSITIONS_QUERY } from "../graphql/queries";
import { TVLChart, VolumeChart } from "../components/Charts";
import { formatUSD, formatNumber, daysAgo } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import TokenIcon from "../components/TokenIcon";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";

function calcTVL(pool: any, shmPrice: number): number {
  if (!pool) return 0;
  const r0 = parseFloat(pool.reserve0 || "0");
  const r1 = parseFloat(pool.reserve1 || "0");
  const t0isWshm = pool.token0?.id?.toLowerCase() === WSHM;
  const t1isWshm = pool.token1?.id?.toLowerCase() === WSHM;
  if (t0isWshm) return r0 * 2 * shmPrice;
  if (t1isWshm) return r1 * 2 * shmPrice;
  return r1 * 2 * shmPrice;
}

function shortWallet(addr: string): string {
  if (!addr) return "—";
  return addr.slice(0, 8) + "..." + addr.slice(-4);
}

const PoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shmPrice } = useSHMPrice();
  const [activeTab, setActiveTab] = useState<"overview" | "swaps" | "positions">("overview");

  const { data, loading } = useQuery(POOL_DETAIL_QUERY, { variables: { id } });
  const { data: dayData } = useQuery(POOL_DAY_DATA_QUERY, { variables: { poolId: id, startTime: daysAgo(90) } });
  const { data: swapsData } = useQuery(RECENT_SWAPS_QUERY, { variables: { poolId: id, first: 25 } });
  const { data: posData } = useQuery(LP_POSITIONS_QUERY, { variables: { poolId: id } });

  const pool = data?.pair;
  const t0 = pool?.token0;
  const t1 = pool?.token1;
  const pairDayDatas = dayData?.pairDayDatas ?? [];

  const tvl = calcTVL(pool, shmPrice);

  // TVL chart - use WSHM reserve * 2
  const tvlChartData = pairDayDatas.map((d: any) => {
    const r0 = parseFloat(d.reserve0 || "0");
    const r1 = parseFloat(d.reserve1 || "0");
    const t0isWshm = t0?.id?.toLowerCase() === WSHM;
    const t1isWshm = t1?.id?.toLowerCase() === WSHM;
    let val = 0;
    if (t0isWshm) val = r0 * 2 * shmPrice;
    else if (t1isWshm) val = r1 * 2 * shmPrice;
    else val = r1 * 2 * shmPrice;
    return { date: String(d.date), tvlUSD: val.toString() };
  });

  const volumeChartData = pairDayDatas.map((d: any) => ({
    date: String(d.date),
    volumeUSD: (parseFloat(d.volumeUSD || "0") * shmPrice).toString()
  }));

  // Token prices
  const t1PerT0 = parseFloat(pool?.token1Price || "0");
  const t0PerT1 = parseFloat(pool?.token0Price || "0");
  const t0isWshm = t0?.id?.toLowerCase() === WSHM;
  const t1isWshm = t1?.id?.toLowerCase() === WSHM;
  const t0priceUSD = t0isWshm ? shmPrice : (t1isWshm ? t1PerT0 * shmPrice : t1PerT0 * shmPrice);
  const t1priceUSD = t1isWshm ? shmPrice : (t0isWshm ? t0PerT1 * shmPrice : shmPrice);

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;
  if (!pool) return <div className="error-state">Pair not found</div>;

  const positions = [
    ...(posData?.mints ?? []).map((m: any) => ({ ...m, type: "Added Liquidity" })),
    ...(posData?.burns ?? []).map((b: any) => ({ ...b, type: "Removed Liquidity" }))
  ].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

  return (
    <div>
      <div className="pool-detail-header">
        <div className="pool-detail-title">
          <button className="back-btn" onClick={() => navigate("/pools")}>Back</button>
          <div className="token-icons">
            <TokenIcon address={t0?.id} symbol={t0?.symbol} size={36} />
            <TokenIcon address={t1?.id} symbol={t1?.symbol} size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t0?.symbol} / {t1?.symbol}
            </h1>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <span className="address-chip">0.3% fee</span>
              <span className="address-chip">{id?.slice(0, 8)}...{id?.slice(-6)}</span>
            </div>
          </div>
        </div>
        <a href={"https://mintondex.com"} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Trade</a>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="card"><div className="card-title">TVL</div><div className="card-value">{formatUSD(tvl, false)}</div></div>
        <div className="card"><div className="card-title">Total Volume</div><div className="card-value">{formatUSD(parseFloat(pool.volumeUSD || "0") * shmPrice, false)}</div></div>
        <div className="card"><div className="card-title">Transactions</div><div className="card-value">{formatNumber(parseInt(pool.txCount || "0"), 0)}</div></div>
        <div className="card"><div className="card-title">{t0?.symbol} Price</div><div className="card-value">{formatUSD(t0priceUSD, false)}</div></div>
        <div className="card"><div className="card-title">{t1?.symbol} Price</div><div className="card-value">{formatUSD(t1priceUSD, false)}</div></div>
        <div className="card"><div className="card-title">{t0?.symbol} Reserve</div><div className="card-value">{parseFloat(pool.reserve0 || "0").toLocaleString("en-US", { maximumFractionDigits: 2 })}</div></div>
        <div className="card"><div className="card-title">{t1?.symbol} Reserve</div><div className="card-value">{parseFloat(pool.reserve1 || "0").toLocaleString("en-US", { maximumFractionDigits: 2 })}</div></div>
      </div>

      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <TVLChart data={tvlChartData} loading={false} />
        <VolumeChart data={volumeChartData} loading={false} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["overview","swaps","positions"] as const).map(tab => (
          <button key={tab} className={"chart-tab" + (activeTab === tab ? " active" : "")} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "swaps" && (
        <div className="table-container">
          <table>
            <thead><tr><th>Time</th><th>Type</th><th>Amount USD</th><th>{t0?.symbol}</th><th>{t1?.symbol}</th><th>Wallet</th></tr></thead>
            <tbody>
              {(swapsData?.swaps ?? []).map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{new Date(parseInt(s.timestamp) * 1000).toLocaleString()}</td>
                  <td><span style={{ color: parseFloat(s.amount0In) > 0 ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 700 }}>{parseFloat(s.amount0In) > 0 ? "Buy" : "Sell"}</span></td>
                  <td>{formatUSD(parseFloat(s.amountUSD) * shmPrice, false)}</td>
                  <td>{formatNumber(parseFloat(s.amount0In) + parseFloat(s.amount0Out), 4)}</td>
                  <td>{formatNumber(parseFloat(s.amount1In) + parseFloat(s.amount1Out), 4)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{shortWallet(s.to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "positions" && (
        <div className="table-container">
          <table>
            <thead><tr><th>Time</th><th>Type</th><th>Amount USD</th><th>{t0?.symbol}</th><th>{t1?.symbol}</th><th>Wallet</th></tr></thead>
            <tbody>
              {positions.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{new Date(parseInt(p.timestamp) * 1000).toLocaleDateString()}</td>
                  <td><span style={{ color: p.type === "Added Liquidity" ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 700 }}>{p.type}</span></td>
                  <td>{formatUSD(parseFloat(p.amountUSD) * shmPrice, false)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatNumber(parseFloat(p.amount0), 4)} {t0?.symbol}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatNumber(parseFloat(p.amount1), 4)} {t1?.symbol}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{shortWallet(p.sender)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card">
            <div className="card-title">Token Composition</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {[{token: t0, reserve: pool.reserve0, priceUSD: t0priceUSD}, {token: t1, reserve: pool.reserve1, priceUSD: t1priceUSD}].map(({token, reserve, priceUSD}) => (
                <div key={token?.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <TokenIcon address={token?.id} symbol={token?.symbol} size={28} />
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: "var(--font-heading)" }}>{token?.symbol}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{parseFloat(reserve || "0").toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 700, color: "var(--accent)" }}>{formatUSD(parseFloat(reserve || "0") * priceUSD, false)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Pair Info</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Created</span><span style={{ fontFamily: "var(--font-mono)" }}>{new Date(parseInt(pool.createdAtTimestamp) * 1000).toLocaleDateString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Total Supply (LP)</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatNumber(parseFloat(pool.totalSupply || "0"), 4)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Fee</span><span style={{ color: "var(--accent)", fontWeight: 700 }}>0.3%</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Exchange Rate</span><span style={{ fontFamily: "var(--font-mono)" }}>1 {t0?.symbol} = {formatNumber(t1PerT0, 4)} {t1?.symbol}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PoolDetailPage;
"""

with io.open("C:/mintondex/frontend/src/pages/PoolDetailPage.tsx", "w", encoding="utf-8") as f:
    f.write(pool_content)
print("saved PoolDetailPage.tsx")

# ============================================================
# FIX 4+5: TokensPage - remove 7d change, ATH, ATL columns
# (these come from CoinGecko historical which we don't have for all tokens)
# Keep only what subgraph provides
# ============================================================

tokens_content = """import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { TOKENS_QUERY } from "../graphql/queries";
import { formatNumber, formatUSD } from "../utils/format";
import TokenIcon from "../components/TokenIcon";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { useNavigate } from "react-router-dom";

const TokensPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useQuery(TOKENS_QUERY);
  const { shmPrice } = useSHMPrice();
  const navigate = useNavigate();

  const tokens = (data?.tokens ?? []).filter((t: any) => {
    const q = search.toLowerCase();
    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
  });

  // Sort by market cap descending
  const sorted = [...tokens].sort((a: any, b: any) => {
    const mcA = parseFloat(a.priceUSD || "0") * shmPrice * parseFloat(a.totalSupply || "0");
    const mcB = parseFloat(b.priceUSD || "0") * shmPrice * parseFloat(b.totalSupply || "0");
    return mcB - mcA;
  });

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
              <th>#</th>
              <th>Token</th>
              <th>Price (USD)</th>
              <th>Market Cap</th>
              <th>Volume</th>
              <th>Transactions</th>
              <th>Pools</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="loading-state"><div className="spinner" /></div></td></tr>
            ) : (
              sorted.map((token: any, i: number) => {
                const priceUSD = parseFloat(token.priceUSD || "0") * shmPrice;
                const marketCap = priceUSD * parseFloat(token.totalSupply || "0");
                const volume = parseFloat(token.tradeVolume || "0") * shmPrice;
                return (
                  <tr key={token.id} onClick={() => navigate("/tokens/" + token.id)} style={{ cursor: "pointer" }}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", width: 40 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <TokenIcon address={token.id} symbol={token.symbol} size={28} />
                        <div>
                          <div style={{ fontWeight: 700, fontFamily: "var(--font-heading)" }}>{token.symbol}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>{formatUSD(priceUSD, false)}</td>
                    <td style={{ fontWeight: 600 }}>{marketCap > 0 ? formatUSD(marketCap, true) : "—"}</td>
                    <td>{formatUSD(volume, true)}</td>
                    <td>{formatNumber(parseInt(token.txCount || "0"), 0)}</td>
                    <td>{formatNumber(parseInt(token.poolCount || "0"), 0)}</td>
                  </tr>
                );
              })
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

print("All done! Now run: cd C:/mintondex/frontend && npm run build")
print("Then on VPS: cd /var/www/analytics-src && git pull && cd frontend && npm run build && cp -r build/* /var/www/analytics.mintondex.com/")
