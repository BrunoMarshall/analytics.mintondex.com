import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { TOKEN_DETAIL_QUERY, TOKEN_DAY_DATA_QUERY } from "../graphql/queries";
import { TVLChart, VolumeChart } from "../components/Charts";
import { formatUSD, formatNumber, daysAgo } from "../utils/format";
import { useSHMPrice } from "../hooks/useSHMPrice";
import TokenIcon from "../components/TokenIcon";

const TokenDetailPage: React.FC = () => {
  const { tokenId: rawId } = useParams<{ tokenId: string }>();
  const id = (rawId ?? "").toLowerCase();
  const navigate = useNavigate();
  const { shmPrice } = useSHMPrice();

  const { data, loading, error } = useQuery(TOKEN_DETAIL_QUERY, { variables: { id }, skip: !id, fetchPolicy: "network-only" });
  const { data: dayData } = useQuery(TOKEN_DAY_DATA_QUERY, { variables: { tokenId: id, startTime: daysAgo(90) }, skip: !id });

  const token = data?.token;
  const tokenDayDatas = dayData?.tokenDayDatas ?? [];

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;
  if (error) return <div className="error-state">Error: {error.message}</div>;
  if (!token) return <div className="error-state">Token not found</div>;

  const priceUSD = parseFloat(token.priceUSD || "0") * shmPrice;
  const volumeUSD = parseFloat(token.tradeVolume || "0") * shmPrice;

  const priceChartData = tokenDayDatas.map((d: any) => ({
    date: String(d.date),
    tvlUSD: (parseFloat(d.priceUSD || "0") * shmPrice).toString()
  }));
  const volumeChartData = tokenDayDatas.map((d: any) => ({
    date: String(d.date),
    volumeUSD: (parseFloat(d.volumeUSD || "0") * shmPrice).toString()
  }));

  const pairs = [...(token.pairsBase ?? []), ...(token.pairsQuote ?? [])];

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
        <div className="card"><div className="card-title">Total Volume</div><div className="card-value">{formatUSD(volumeUSD, true)}</div></div>
        <div className="card"><div className="card-title">Transactions</div><div className="card-value">{formatNumber(parseInt(token.txCount || "0"), 0)}</div></div>
        <div className="card"><div className="card-title">Pairs</div><div className="card-value">{formatNumber(parseInt(token.poolCount || "0"), 0)}</div></div>
      </div>

      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <TVLChart
          data={priceChartData}
          loading={false}
          title="Price (USD)"
        />
        <VolumeChart
          data={volumeChartData}
          loading={false}
        />
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
