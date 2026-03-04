import io

content = """import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { TOKENS_QUERY } from "../graphql/queries";
import { formatNumber, formatUSD } from "../utils/format";
import TokenIcon from "../components/TokenIcon";
import { useSHMPrice } from "../hooks/useSHMPrice";
import { useNavigate } from "react-router-dom";

interface SHMData {
  marketCap: number;
  volume24h: number;
  price: number;
}

const TokensPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useQuery(TOKENS_QUERY);
  const { shmPrice } = useSHMPrice();
  const navigate = useNavigate();
  const [shmData, setShmData] = useState<SHMData | null>(null);

  useEffect(() => {
    fetch("/api/shm-market")
      .then(r => r.json())
      .then(json => {
        const d = json?.shardeum;
        if (d) setShmData({
          price: d.usd ?? 0,
          marketCap: d.usd_market_cap ?? 0,
          volume24h: d.usd_24h_vol ?? 0
        });
      })
      .catch(() => {});
  }, []);

  const tokens = (data?.tokens ?? []).filter((t: any) => {
    const q = search.toLowerCase();
    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
  });

  // Build rows including SHM
  const rows = tokens.map((token: any) => ({
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    priceUSD: parseFloat(token.priceUSD || "0") * shmPrice,
    marketCap: parseFloat(token.priceUSD || "0") * shmPrice * parseFloat(token.totalSupply || "0"),
    volume: parseFloat(token.tradeVolume || "0") * shmPrice,
    txCount: parseInt(token.txCount || "0"),
    poolCount: parseInt(token.poolCount || "0"),
    isSHM: false
  }));

  // Add SHM row if not searching or search matches
  const shmMatches = !search || "shm".includes(search.toLowerCase()) || "shardeum".includes(search.toLowerCase());
  if (shmMatches) {
    rows.push({
      id: "shm-native",
      symbol: "SHM",
      name: "Shardeum",
      priceUSD: shmData?.price ?? shmPrice,
      marketCap: shmData?.marketCap ?? 0,
      volume: shmData?.volume24h ?? 0,
      txCount: -1,
      poolCount: -1,
      isSHM: true
    });
  }

  // Sort by market cap descending
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
              rows.map((token: any, i: number) => (
                <tr key={token.id} onClick={() => !token.isSHM && navigate("/tokens/" + token.id)} style={{ cursor: token.isSHM ? "default" : "pointer" }}>
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
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>{formatUSD(token.priceUSD, false)}</td>
                  <td style={{ fontWeight: 600 }}>{token.marketCap > 0 ? formatUSD(token.marketCap, true) : "—"}</td>
                  <td>{token.isSHM ? formatUSD(token.volume, true) : formatUSD(token.volume, true)}</td>
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
    f.write(content)
print("saved")
