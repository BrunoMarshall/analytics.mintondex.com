import React from "react";
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { POOLS_QUERY, PROTOCOL_DAY_DATA_QUERY, ALL_PAIRS_DAY_DATA_QUERY } from "../graphql/queries";
import StatCard from "../components/StatCard";
import { TVLChart, VolumeChart } from "../components/Charts";
import { formatUSD, formatNumber, daysAgo } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { formatSHMPrice } from "../utils/coingecko";
import TokenIcon from "../components/TokenIcon";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";

// Given a pair, return TVL in USD
function calcPairTVL(reserve0: number, reserve1: number, token0id: string, token1id: string, token0Price: number, token1Price: number, shmPrice: number): number {
  const t0isWshm = token0id.toLowerCase() === WSHM;
  const t1isWshm = token1id.toLowerCase() === WSHM;
  if (t1isWshm) {
    // token1 = WSHM, token1Price = WSHM per token0
    // reserve1 is in WSHM, reserve0 converted via token1Price
    return (reserve0 * token1Price + reserve1) * shmPrice;
  } else if (t0isWshm) {
    // token0 = WSHM, token0Price = token0 per token1
    return (reserve1 * token0Price + reserve0) * shmPrice;
  }
  // Neither is WSHM - just use reserve1 * 2 as rough estimate
  return reserve1 * 2 * shmPrice;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const startTime = daysAgo(90);
  const { shmPrice } = useSHMPrice();
  const { data: poolsData, loading: poolsLoading } = useQuery(POOLS_QUERY, { variables: { first: 100, skip: 0 } });
  const { data: protocolData, loading: protocolLoading } = useQuery(PROTOCOL_DAY_DATA_QUERY, { variables: { startTime } });
  const { data: allPairsDayData, loading: pairDayLoading, error: pairDayError } = useQuery(ALL_PAIRS_DAY_DATA_QUERY, { variables: { startTime } });

  const pools = poolsData?.pairs ?? poolsData?.pools ?? [];
  const dayData = protocolData?.mintondexDayDatas ?? [];

  const totalTVL = pools.reduce((sum: number, p: any) => {
    return sum + calcPairTVL(
      parseFloat(p.reserve0 || "0"), parseFloat(p.reserve1 || "0"),
      p.token0?.id ?? "", p.token1?.id ?? "",
      parseFloat(p.token0Price || "0"), parseFloat(p.token1Price || "0"),
      shmPrice
    );
  }, 0);

  const totalVolume = pools.reduce((s: number, p: any) => s + parseFloat(p.volumeUSD || "0") * shmPrice, 0);
  const totalTxns = pools.reduce((s: number, p: any) => s + parseInt(p.txCount || "0"), 0);
  const tokenSet = new Set<string>();
  pools.forEach((p: any) => { tokenSet.add(p.token0.id); tokenSet.add(p.token1.id); });

  // TVL chart from pairDayDatas
  const tvlChartData = React.useMemo(() => {
    const pdd = allPairsDayData?.pairDayDatas ?? [];
    if (pdd.length === 0) return [];

    // Group entries by pair id, sorted ascending by date
    const byPair: Record<string, any[]> = {};
    pdd.forEach((d: any) => {
      const pid = d.pair?.token0?.id + "_" + d.pair?.token1?.id;
      if (!byPair[pid]) byPair[pid] = [];
      byPair[pid].push(d);
    });
    Object.values(byPair).forEach(arr => arr.sort((a, b) => Number(a.date) - Number(b.date)));

    // All unique dates sorted ascending
    const allDates = Array.from(new Set(pdd.map((d: any) => String(d.date)))).sort((a, b) => Number(a) - Number(b));

    // For each date, carry forward last known reserve for every pair
    return allDates.map(dateKey => {
      let total = 0;
      Object.values(byPair).forEach(entries => {
        const last = entries.filter((e: any) => Number(e.date) <= Number(dateKey)).pop();
        if (!last) return;
        total += calcPairTVL(
          parseFloat(last.reserve0 || "0"), parseFloat(last.reserve1 || "0"),
          last.pair?.token0?.id ?? "", last.pair?.token1?.id ?? "",
          parseFloat(last.token0Price || last.pair?.token0Price || "0"), parseFloat(last.token1Price || last.pair?.token1Price || "0"),
          shmPrice
        );
      });
      return { date: dateKey, tvlUSD: String(total) };
    });
  }, [allPairsDayData, shmPrice]);

  const volumeChartData = dayData.map((d: any) => ({
    date: String(d.date),
    volumeUSD: (parseFloat(d.volumeUSD || "0") * shmPrice).toString()
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mintondex Analytics</h1>
        <p className="page-subtitle">Real-time on-chain analytics for Mintondex on Shardeum</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", background: "linear-gradient(135deg, rgba(102,126,234,0.08) 0%, rgba(118,75,162,0.08) 100%)", border: "2px solid var(--border-light)", borderRadius: "var(--radius)", padding: "16px 24px", marginBottom: 28, boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TokenIcon symbol="SHM" size={42} isSHM={true} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>SHM Price</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-heading)", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {formatSHMPrice(shmPrice)} <span style={{ fontSize: 12, opacity: 0.7 }}>USD</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Live via MEXC - refreshes every 60s</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "WSHM", addr: "0x7365...fbeb" }, { label: "MRSH", addr: "0xe223...31f1" },
            { label: "MINT", addr: "0x171E...7F36" }, { label: "SPLIT", addr: "0xd721...be1" },
            { label: "P2F", addr: "0xb069...c86" }, { label: "VEND", addr: "0x51a1...823" },
          ].map((t) => (
            <div key={t.label} style={{ background: "white", border: "1px solid var(--border-light)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              <span style={{ background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>{t.label}</span>{" "}
              <span style={{ color: "var(--text-muted)" }}>{t.addr}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Value Locked" value={formatUSD(totalTVL, true)} loading={poolsLoading} />
        <StatCard title="Total Volume" value={formatUSD(totalVolume, true)} loading={poolsLoading} />
        <StatCard title="Transactions" value={formatNumber(totalTxns, 0)} loading={poolsLoading} />
        <StatCard title="Pools" value={String(pools.length)} loading={poolsLoading} />
        <StatCard title="Tokens" value={String(tokenSet.size)} loading={poolsLoading} />
      </div>

      <div className="charts-grid" style={{ marginBottom: 32 }}>
        <TVLChart data={tvlChartData} loading={pairDayLoading} />
        <VolumeChart data={volumeChartData} loading={protocolLoading} />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-heading)", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Top Pools by TVL</h2>
          <button className="btn btn-ghost" onClick={() => navigate("/pools")}>View all</button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>#</th><th>Pool</th><th>TVL</th><th>Volume</th><th>Txns</th></tr></thead>
            <tbody>
              {poolsLoading ? (
                <tr><td colSpan={5}><div className="loading-state" style={{ padding: 40 }}><div className="spinner" /></div></td></tr>
              ) : (
                pools.slice(0, 5).map((pool: any, i: number) => {
                  const poolTVL = calcPairTVL(
                    parseFloat(pool.reserve0 || "0"), parseFloat(pool.reserve1 || "0"),
                    pool.token0?.id ?? "", pool.token1?.id ?? "",
                    parseFloat(pool.token0Price || "0"), parseFloat(pool.token1Price || "0"),
                    shmPrice
                  );
                  return (
                    <tr key={pool.id} onClick={() => navigate("/pools/" + pool.id)} style={{ cursor: "pointer" }}>
                      <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", width: 40 }}>{i + 1}</td>
                      <td>
                        <div className="token-pair">
                          <div className="token-icons">
                            <TokenIcon address={pool.token0.id} symbol={pool.token0.symbol} size={28} />
                            <TokenIcon address={pool.token1.id} symbol={pool.token1.symbol} size={28} />
                          </div>
                          <span className="token-pair-name">{pool.token0.symbol}/{pool.token1.symbol}<span className="fee-badge">0.3%</span></span>
                        </div>
                      </td>
                      <td style={{ color: "var(--accent-green)", fontWeight: 700 }}>{formatUSD(poolTVL, true)}</td>
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
