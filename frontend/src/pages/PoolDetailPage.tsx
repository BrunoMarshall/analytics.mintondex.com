import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { POOL_DETAIL_QUERY, POOL_DAY_DATA_QUERY, RECENT_SWAPS_QUERY, LP_POSITIONS_QUERY } from "../graphql/queries";
import StatCard from "../components/StatCard";
import { TVLChart, VolumeChart, PriceChart, LiquidityChart } from "../components/Charts";
import SwapsTable from "../components/SwapsTable";
import LPPositions from "../components/LPPositions";
import { formatUSD, formatNumber, formatFee, daysAgo, getExplorerUrl } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { tokenPriceToUSD } from "../utils/coingecko";

const PoolDetailPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const startTime = daysAgo(90);
  const { shmPrice } = useSHMPrice();

  const { data: poolData, loading: poolLoading, error } = useQuery(POOL_DETAIL_QUERY, { variables: { id: poolId }, skip: !poolId });
  const { data: dayData, loading: dayLoading } = useQuery(POOL_DAY_DATA_QUERY, { variables: { poolId, startTime }, skip: !poolId });
  const { data: swapData, loading: swapsLoading } = useQuery(RECENT_SWAPS_QUERY, { variables: { poolId, first: 25 }, skip: !poolId });
  const { data: lpData, loading: lpLoading } = useQuery(LP_POSITIONS_QUERY, { variables: { poolId }, skip: !poolId });

  if (error) return <div className="error-state"><strong>Pool not found</strong><p style={{ marginTop: 8 }}>{error.message}</p></div>;

  const pool = poolData?.pool;
  const poolDayData = dayData?.poolDayDatas ?? [];
  const swaps = swapData?.swaps ?? [];
  const mints = lpData?.mints ?? [];
  const burns = lpData?.burns ?? [];
  const t0 = pool?.token0;
  const t1 = pool?.token1;
  const token0PriceUSD = pool ? tokenPriceToUSD(pool.token0Price, shmPrice) : 0;
  const token1PriceUSD = pool ? tokenPriceToUSD(pool.token1Price, shmPrice) : 0;
  const tvlUSD = pool ? parseFloat(pool.totalValueLockedToken0 || "0") * shmPrice + parseFloat(pool.totalValueLockedToken1 || "0") * token1PriceUSD : 0;
  const volumeUSD = pool ? parseFloat(pool.volumeUSD || "0") * shmPrice : 0;
  const explorerUrl = poolId ? getExplorerUrl(poolId) : "#";

  return (
    <div>
      <div className="pool-detail-header">
        <div className="pool-detail-title">
          <button className="back-btn" onClick={() => navigate("/pools")}>back to Pools</button>
          <div className="token-icons">
            <div className="token-icon" style={{ width: 36, height: 36, fontSize: 12 }}>{t0?.symbol?.slice(0, 2) ?? "?"}</div>
            <div className="token-icon" style={{ width: 36, height: 36, fontSize: 12 }}>{t1?.symbol?.slice(0, 2) ?? "?"}</div>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>
              {t0?.symbol ?? "-"}/{t1?.symbol ?? "-"}
              {pool && <span className="fee-badge" style={{ fontSize: 12 }}>{formatFee(parseInt(pool.feeTier))}</span>}
            </h1>
            {poolId && <a className="address-chip" href={explorerUrl} target="_blank" rel="noopener noreferrer">{poolId}</a>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: 12, fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>SHM </span>
            <span style={{ color: "var(--accent-yellow)", fontWeight: 700 }}>${shmPrice.toFixed(4)}</span>
          </div>
          <a href="https://mintondex.com" target="_blank" rel="noopener noreferrer" className="btn btn-primary">+ Add Liquidity</a>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard title="TVL" value={formatUSD(tvlUSD, true)} loading={poolLoading} />
        <StatCard title="Total Volume" value={formatUSD(volumeUSD, true)} loading={poolLoading} />
        <StatCard title="Transactions" value={pool ? formatNumber(parseInt(pool.txCount), 0) : "—"} loading={poolLoading} />
        <StatCard title={(t0?.symbol ?? "Token0") + " Price"} value={pool ? "$" + token0PriceUSD.toFixed(6) : "—"} subValue={pool ? parseFloat(pool.token0Price).toFixed(6) + " WSHM" : undefined} loading={poolLoading} />
        <StatCard title={(t1?.symbol ?? "Token1") + " Price"} value={pool ? "$" + token1PriceUSD.toFixed(6) : "—"} subValue={pool ? parseFloat(pool.token1Price).toFixed(6) + " WSHM" : undefined} loading={poolLoading} />
        <StatCard title={"TVL " + (t0?.symbol ?? "T0")} value={pool ? formatNumber(parseFloat(pool.totalValueLockedToken0)) + " " + (t0?.symbol ?? "") : "—"} loading={poolLoading} />
        <StatCard title={"TVL " + (t1?.symbol ?? "T1")} value={pool ? formatNumber(parseFloat(pool.totalValueLockedToken1)) + " " + (t1?.symbol ?? "") : "—"} loading={poolLoading} />
      </div>

      <div className="charts-grid">
        <TVLChart data={poolDayData.map((d: any) => ({ date: String(d.date), tvlUSD: d.tvlUSD }))} loading={dayLoading} />
        <VolumeChart data={poolDayData.map((d: any) => ({ date: String(d.date), volumeUSD: d.volumeUSD }))} loading={dayLoading} />
      </div>
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <PriceChart data={poolDayData} token0Symbol={t0?.symbol ?? "T0"} token1Symbol={t1?.symbol ?? "T1"} loading={dayLoading} />
        <LiquidityChart data={poolDayData.map((d: any) => ({ date: String(d.date), liquidity: d.liquidity }))} loading={dayLoading} />
      </div>

      {pool && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[t0, t1].map((token: any, idx: number) => {
            const usdPrice = idx === 0 ? token0PriceUSD : token1PriceUSD;
            const tokenUrl = getExplorerUrl(token.id);
            return (
              <div key={token.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{token.symbol}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{token.name}</div>
                  </div>
                  <div className="token-icon" style={{ width: 40, height: 40, fontSize: 14 }}>{token.symbol.slice(0, 2)}</div>
                </div>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><div className="card-title">Price USD</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-yellow)" }}>${usdPrice.toFixed(6)}</div></div>
                  <div><div className="card-title">Price in WSHM</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{idx === 0 ? parseFloat(pool.token0Price).toFixed(6) : parseFloat(pool.token1Price).toFixed(6)}</div></div>
                  <div><div className="card-title">Volume</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{formatNumber(parseFloat(token.volume || "0"))}</div></div>
                  <div><div className="card-title">Tx Count</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{formatNumber(parseInt(token.txCount || "0"), 0)}</div></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="card-title">Contract</div>
                  <a href={tokenUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{token.id}</a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <SwapsTable swaps={swaps} token0Symbol={t0?.symbol ?? "T0"} token1Symbol={t1?.symbol ?? "T1"} loading={swapsLoading} />
      </div>
      <LPPositions mints={mints} burns={burns} token0Symbol={t0?.symbol ?? "T0"} token1Symbol={t1?.symbol ?? "T1"} loading={lpLoading} />
    </div>
  );
};
export default PoolDetailPage;
