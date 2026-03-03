import React from "react";
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { POOLS_QUERY, PROTOCOL_DAY_DATA_QUERY } from "../graphql/queries";
import StatCard from "../components/StatCard";
import { TVLChart, VolumeChart } from "../components/Charts";
import { formatUSD, formatNumber, daysAgo } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { tokenPriceToUSD } from "../utils/coingecko";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const startTime = daysAgo(90);
  const { shmPrice } = useSHMPrice();

  const { data: poolsData, loading: poolsLoading } = useQuery(POOLS_QUERY, {
    variables: { first: 100, skip: 0 },
  });
  const { data: protocolData, loading: protocolLoading } = useQuery(
    PROTOCOL_DAY_DATA_QUERY,
    { variables: { startTime } }
  );

  const pools = poolsData?.pools ?? [];
  const dayData = protocolData?.mintondexDayDatas ?? [];

  // Compute TVL using live SHM price
  const totalTVL = pools.reduce((sum: number, p: any) => {
    const t0 = parseFloat(p.totalValueLockedToken0 || "0") * shmPrice;
    const t1 = parseFloat(p.totalValueLockedToken1 || "0") *
      tokenPriceToUSD(p.token1Price || "0", shmPrice);
    return sum + t0 + t1;
  }, 0);

  const totalVolume = pools.reduce(
    (s: number, p: any) => s + parseFloat(p.volumeUSD || "0") * shmPrice,
    0
  );
  const totalTxns = pools.reduce(
    (s: number, p: any) => s + parseInt(p.txCount || "0"),
    0
  );
  const tokenSet = new Set<string>();
  pools.forEach((p: any) => {
    tokenSet.add(p.token0.id);
    tokenSet.add(p.token1.id);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mintondex Analytics</h1>
        <p className="page-subtitle">
          Real-time on-chain analytics for Mintondex on Shardeum
        </p>
      </div>

      {/* Live SHM Price Banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 24,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "12px 20px",
        marginBottom: 24, flexWrap: "wrap" as const,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="token-icon">SH</div>
          <div>
            <div style={{
              fontSize: 11, color: "var(--text-muted)",
              fontFamily: "var(--font-mono)", textTransform: "uppercase" as const,
            }}>
              SHM Price
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-yellow)" }}>
              ${shmPrice.toFixed(4)}{" "}
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>USD</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Live via CoinGecko · refreshes every 60s
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
          {[
            { label: "WSHM", addr: "0x7365...fbeb" },
            { label: "MRSH", addr: "0xe223...31f1" },
            { label: "MINT", addr: "0x171E...7F36" },
            { label: "SPLIT", addr: "0xd721...be1" },
            { label: "P2F", addr: "0xb069...c86" },
            { label: "VEND", addr: "0x51a1...823" },
          ].map((t) => (
            <div key={t.label} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "4px 10px", fontSize: 11,
              fontFamily: "var(--font-mono)", color: "var(--text-secondary)",
            }}>
              <span style={{ color: "var(--accent)" }}>{t.label}</span>{" "}
              <span style={{ color: "var(--text-muted)" }}>{t.addr}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Value Locked"
          value={formatUSD(totalTVL, true)}
          loading={poolsLoading}
        />
        <StatCard
          title="Total Volume"
          value={formatUSD(totalVolume, true)}
          loading={poolsLoading}
        />
        <StatCard
          title="Transactions"
          value={formatNumber(totalTxns, 0)}
          loading={poolsLoading}
        />
        <StatCard title="Pools" value={String(pools.length)} loading={poolsLoading} />
        <StatCard title="Tokens" value={String(tokenSet.size)} loading={poolsLoading} />
      </div>

      {/* Protocol Charts */}
      <div className="charts-grid" style={{ marginBottom: 32 }}>
        <TVLChart
          data={dayData.map((d: any) => ({ date: String(d.date), tvlUSD: d.tvlUSD }))}
          loading={protocolLoading}
        />
        <VolumeChart
          data={dayData.map((d: any) => ({ date: String(d.date), volumeUSD: d.volumeUSD }))}
          loading={protocolLoading}
        />
      </div>

      {/* Top Pools */}
      <div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Top Pools by TVL</h2>
          <button className="btn btn-ghost" onClick={() => navigate("/pools")}>
            View all →
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Pool</th>
                <th>TVL</th>
                <th>Volume</th>
                <th>Txns</th>
              </tr>
            </thead>
            <tbody>
              {poolsLoading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="loading-state" style={{ padding: 40 }}>
                      <div className="spinner" />
                    </div>
                  </td>
                </tr>
              ) : (
                pools.slice(0, 5).map((pool: any, i: number) => {
                  const poolTVL =
                    parseFloat(pool.totalValueLockedToken0 || "0") * shmPrice +
                    parseFloat(pool.totalValueLockedToken1 || "0") *
                      tokenPriceToUSD(pool.token1Price || "0", shmPrice);
                  return (
                    <tr key={pool.id} onClick={() => navigate("/pools/" + pool.id)}>
                      <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", width: 40 }}>
                        {i + 1}
                      </td>
                      <td>
                        <div className="token-pair">
                          <div className="token-icons">
                            <div className="token-icon">{pool.token0.symbol.slice(0, 2)}</div>
                            <div className="token-icon">{pool.token1.symbol.slice(0, 2)}</div>
                          </div>
                          <span className="token-pair-name">
                            {pool.token0.symbol}/{pool.token1.symbol}
                            <span className="fee-badge">
                              {(parseInt(pool.feeTier) / 10000).toFixed(2)}%
                            </span>
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "var(--accent-green)", fontWeight: 600 }}>
                        {formatUSD(poolTVL, true)}
                      </td>
                      <td>{formatUSD(parseFloat(pool.volumeUSD || "0") * shmPrice, true)}</td>
                      <td>{formatNumber(parseInt(pool.txCount), 0)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default HomePage;