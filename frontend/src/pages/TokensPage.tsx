import React, { useState } from "react";
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
