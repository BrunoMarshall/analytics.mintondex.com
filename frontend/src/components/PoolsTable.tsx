import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatUSD, formatNumber } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import TokenIcon from "../components/TokenIcon";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";

interface Pair {
  id: string;
  token0: { id: string; symbol: string };
  token1: { id: string; symbol: string };
  reserve0: string;
  reserve1: string;
  volumeUSD: string;
  txCount: string;
  token0Price: string;
  token1Price: string;
  createdAtTimestamp: string;
}

function calcTVL(p: Pair, shmPrice: number): number {
  const t0isWshm = p.token0.id.toLowerCase() === WSHM;
  const t1isWshm = p.token1.id.toLowerCase() === WSHM;
  const r0 = parseFloat(p.reserve0 || "0");
  const r1 = parseFloat(p.reserve1 || "0");
  if (t0isWshm) return r0 * 2 * shmPrice;
  if (t1isWshm) return r1 * 2 * shmPrice;
  return r1 * 2 * shmPrice;
}

const PoolsTable: React.FC<{ pools: Pair[]; loading?: boolean }> = ({ pools, loading = false }) => {
  const navigate = useNavigate();
  const { shmPrice } = useSHMPrice();
  const [search, setSearch] = useState("");

  const filtered = pools.filter(p => {
    const q = search.toLowerCase();
    return p.token0.symbol.toLowerCase().includes(q) ||
           p.token1.symbol.toLowerCase().includes(q) ||
           p.id.toLowerCase().includes(q);
  }).sort((a, b) => calcTVL(b, shmPrice) - calcTVL(a, shmPrice));

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading pools...</span></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{filtered.length} pairs</span>
        <input className="search-bar" placeholder="Search by token or address..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Pair</th>
              <th>TVL</th>
              <th>Volume</th>
              <th>Reserve 0</th>
              <th>Reserve 1</th>
              <th>Txns</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pool, i) => {
              const tvl = calcTVL(pool, shmPrice);
              return (
                <tr key={pool.id} onClick={() => navigate("/pools/" + pool.id)} style={{ cursor: "pointer" }}>
                  <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", width: 40 }}>{i + 1}</td>
                  <td>
                    <div className="token-pair">
                      <div className="token-icons">
                        <TokenIcon address={pool.token0.id} symbol={pool.token0.symbol} size={28} />
                        <TokenIcon address={pool.token1.id} symbol={pool.token1.symbol} size={28} />
                      </div>
                      <span className="token-pair-name">
                        {pool.token0.symbol}/{pool.token1.symbol}
                        <span className="fee-badge">0.3%</span>
                      </span>
                    </div>
                  </td>
                  <td style={{ color: "var(--accent-green)", fontWeight: 700 }}>{formatUSD(tvl, true)}</td>
                  <td>{formatUSD(parseFloat(pool.volumeUSD || "0") * shmPrice, true)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {parseFloat(pool.reserve0 || "0").toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>{pool.token0.symbol}</span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {parseFloat(pool.reserve1 || "0").toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>{pool.token1.symbol}</span>
                  </td>
                  <td>{formatNumber(parseInt(pool.txCount || "0"), 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PoolsTable;
