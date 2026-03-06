import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { TOKENS_QUERY } from "../graphql/queries";
import { formatNumber, formatUSD } from "../utils/format";
import TokenIcon from "../components/TokenIcon";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { useNavigate } from "react-router-dom";

interface TokenStats {
  lastWeekPrice: number;
  ath: number;
  athPct: number;
  atl: number;
  atlPct: number;
}

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";
const ONE_WEEK_AGO = Math.floor(Date.now() / 1000) - 7 * 86400;

function PctChange({ current, prev }: { current: number; prev: number }) {
  if (!prev || !current) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const pct = ((current - prev) / prev) * 100;
  const color = pct >= 0 ? "#22c55e" : "#ef4444";
  const sign = pct >= 0 ? "+" : "";
  return <span style={{ color, fontWeight: 600, fontSize: 12 }}>{sign}{pct.toFixed(2)}%</span>;
}

function AthAtl({ price, extreme, label }: { price: number; extreme: number; label: string }) {
  if (!extreme || !price) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const pct = ((price - extreme) / extreme) * 100;
  const color = label === "ATH" ? "#ef4444" : "#22c55e";
  const sign = pct >= 0 ? "+" : "";
  return (
    <div style={{ lineHeight: 1.4 }}>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{formatUSD(extreme, false)}</div>
      <div style={{ color, fontSize: 11 }}>{sign}{pct.toFixed(1)}%</div>
    </div>
  );
}

const TokensPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useQuery(TOKENS_QUERY);
  const { shmPrice } = useSHMPrice();
  const navigate = useNavigate();
  const [shmData, setShmData] = useState<any>(null);
  const [mexcHistory, setMexcHistory] = useState<number[][]>([]);
  const [tokenStats, setTokenStats] = useState<Record<string, TokenStats>>({});

  // Fetch SHM market data
  useEffect(() => {
    fetch("/api/shm-market")
      .then(r => r.json())
      .then(json => setShmData(json))
      .catch(() => {});
  }, []);

  // Fetch MEXC history for SHM/WSHM stats
  useEffect(() => {
    fetch("/api/shm-history")
      .then(r => r.json())
      .then(klines => setMexcHistory(klines ?? []))
      .catch(() => {});
  }, []);

  // Fetch TokenDayData for each subgraph token
  useEffect(() => {
    if (!data?.tokens || !shmPrice) return;
    const fetchStats = async () => {
      const stats: Record<string, TokenStats> = {};
      for (const token of data.tokens) {
        try {
          const res = await fetch(
            `https://graph.analytics.mintondex.com/subgraphs/name/mintondex-v2`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: `{ tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { token: "${token.id}" }) { date priceUSD } }` })
            }
          );
          const json = await res.json();
          const days: any[] = json?.data?.tokenDayDatas ?? [];
          if (days.length === 0) continue;
          const prices = days.map((d: any) => parseFloat(d.priceUSD) * shmPrice).filter(p => p > 0);
          if (prices.length === 0) continue;
          const ath = Math.max(...prices);
          const atl = Math.min(...prices);
          const current = prices[prices.length - 1];
          // Last week price: find entry closest to 7 days ago
          const weekAgoTs = ONE_WEEK_AGO;
          const weekEntry = days.find((d: any) => d.date >= weekAgoTs) ?? days[0];
          const lastWeekPrice = parseFloat(weekEntry.priceUSD) * shmPrice;
          stats[token.id] = {
            lastWeekPrice,
            ath,
            athPct: ((current - ath) / ath) * 100,
            atl,
            atlPct: ((current - atl) / atl) * 100,
          };
        } catch {}
      }
      setTokenStats(stats);
    };
    fetchStats();
  }, [data, shmPrice]);

  // Compute SHM/WSHM stats from MEXC klines
  const shmStats: TokenStats | null = React.useMemo(() => {
    if (mexcHistory.length === 0) return null;
    const closes = mexcHistory.map(k => parseFloat(k[4] as any));
    const ath = Math.max(...closes);
    const atl = Math.min(...closes);
    const current = closes[closes.length - 1];
    const weekAgoIdx = Math.max(0, closes.length - 8);
    const lastWeekPrice = closes[weekAgoIdx];
    return {
      lastWeekPrice,
      ath,
      athPct: ((current - ath) / ath) * 100,
      atl,
      atlPct: ((current - atl) / atl) * 100,
    };
  }, [mexcHistory]);

  const tokens = (data?.tokens ?? []).filter((t: any) => {
    const q = search.toLowerCase();
    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
  });

  const rows = tokens.map((token: any) => ({
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    priceUSD: parseFloat(token.priceUSD || "0") * shmPrice,
    marketCap: parseFloat(token.priceUSD || "0") * shmPrice * parseFloat(token.totalSupply || "0"),
    volume: parseFloat(token.tradeVolume || "0") * shmPrice,
    txCount: parseInt(token.txCount || "0"),
    poolCount: parseInt(token.poolCount || "0"),
    isSHM: false,
    isWshm: token.id.toLowerCase() === WSHM,
    stats: tokenStats[token.id] ?? (token.id.toLowerCase() === WSHM ? shmStats : null),
  }));

  const shmMatches = !search || "shm".includes(search.toLowerCase()) || "shardeum".includes(search.toLowerCase());
  if (shmMatches) {
    rows.push({
      id: "shm-native",
      symbol: "SHM",
      name: "Shardeum",
      priceUSD: parseFloat(shmData?.lastPrice ?? "0") || shmPrice,
      marketCap: 0,
      volume: parseFloat(shmData?.quoteVolume ?? "0"),
      txCount: -1,
      poolCount: -1,
      isSHM: true,
      isWshm: false,
      stats: shmStats,
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
              <th>#</th>
              <th>Token</th>
              <th>Price (USD)</th>
              <th>7D Change</th>
              <th>ATH</th>
              <th>ATL</th>
              <th>Market Cap</th>
              <th>Volume</th>
              <th>Transactions</th>
              <th>Pools</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10}><div className="loading-state"><div className="spinner" /></div></td></tr>
            ) : (
              rows.map((token: any, i: number) => {
                const priceColor = token.stats?.lastWeekPrice
                  ? token.priceUSD >= token.stats.lastWeekPrice ? "#22c55e" : "#ef4444"
                  : "var(--accent)";
                return (
                  <tr key={token.id} onClick={() => { if (token.isSHM) { window.open("https://www.coingecko.com/en/coins/shardeum", "_blank"); } else { navigate("/tokens/" + token.id); } }} style={{ cursor: "pointer" }}>
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
                    <td style={{ fontWeight: 700, color: priceColor }}>{formatUSD(token.priceUSD, false)}</td>
                    <td><PctChange current={token.priceUSD} prev={token.stats?.lastWeekPrice ?? 0} /></td>
                    <td><AthAtl price={token.priceUSD} extreme={token.stats?.ath ?? 0} label="ATH" /></td>
                    <td><AthAtl price={token.priceUSD} extreme={token.stats?.atl ?? 0} label="ATL" /></td>
                    <td style={{ fontWeight: 600 }}>{token.marketCap > 0 ? formatUSD(token.marketCap, true) : "—"}</td>
                    <td>{formatUSD(token.volume, true)}</td>
                    <td>{token.txCount === -1 ? "—" : formatNumber(token.txCount, 0)}</td>
                    <td>{token.poolCount === -1 ? "—" : formatNumber(token.poolCount, 0)}</td>
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
