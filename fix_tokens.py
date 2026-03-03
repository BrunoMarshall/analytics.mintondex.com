import io

content = """import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { TOKENS_QUERY } from "../graphql/queries";
import { formatNumber, formatUSD } from "../utils/format";
import TokenIcon from "../components/TokenIcon";
import { useSHMPrice } from "../hooks/useSHMPrice";

const TokensPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useQuery(TOKENS_QUERY);
  const { shmPrice } = useSHMPrice();
  const tokens = (data?.tokens ?? []).filter((t: any) => {
    const q = search.toLowerCase();
    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
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
              <th>Volume</th>
              <th>Transactions</th>
              <th>Pools</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="loading-state"><div className="spinner" /></div></td></tr>
            ) : (
              tokens.map((token: any, i: number) => (
                <tr key={token.id}>
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
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>{formatUSD(parseFloat(token.priceUSD || "0") * shmPrice, false)}</td>
                  <td>{formatUSD(parseFloat(token.tradeVolume || "0") * shmPrice, true)}</td>
                  <td>{formatNumber(parseInt(token.txCount || "0"), 0)}</td>
                  <td>{formatNumber(parseInt(token.poolCount || "0"), 0)}</td>
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
print("saved TokensPage.tsx")
