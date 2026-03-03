import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatUSD, formatNumber, formatFee, formatDate } from "../utils/format";

interface Pool { id:string; token0:{id:string;symbol:string}; token1:{id:string;symbol:string}; feeTier:string; totalValueLockedUSD:string; volumeUSD:string; txCount:string; token0Price:string; token1Price:string; createdAtTimestamp:string; }

const PoolsTable: React.FC<{pools:Pool[];loading?:boolean}> = ({pools,loading=false}) => {
  const navigate = useNavigate();
  const [search,setSearch]=useState("");
  const filtered = pools.filter(p=>{const q=search.toLowerCase();return p.token0.symbol.toLowerCase().includes(q)||p.token1.symbol.toLowerCase().includes(q)||p.id.toLowerCase().includes(q);});
  if(loading) return <div className="loading-state"><div className="spinner"/><span>Loading pools...</span></div>;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h3 style={{fontSize:14,fontWeight:600,color:"var(--text-secondary)",fontFamily:"var(--font-mono)",textTransform:"uppercase",letterSpacing:"0.06em"}}>All Pools ({pools.length})</h3>
      <input className="search-bar" type="text" placeholder="Search by token or address..." value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div className="table-container"><table><thead><tr><th>#</th><th>Pool</th><th>TVL</th><th>Volume</th><th>Token0 Price</th><th>Token1 Price</th><th>Txns</th><th>Created</th></tr></thead>
    <tbody>{filtered.length===0?<tr><td colSpan={8} style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>No pools found</td></tr>:filtered.map((pool,i)=>(
      <tr key={pool.id} onClick={()=>navigate("/pools/"+pool.id)}>
        <td style={{color:"var(--text-muted)",fontFamily:"var(--font-mono)",width:40}}>{i+1}</td>
        <td><div className="token-pair"><div className="token-icons"><div className="token-icon">{pool.token0.symbol.slice(0,2)}</div><div className="token-icon">{pool.token1.symbol.slice(0,2)}</div></div><div><div className="token-pair-name">{pool.token0.symbol}/{pool.token1.symbol}<span className="fee-badge">{formatFee(parseInt(pool.feeTier))}</span></div><div style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)",marginTop:2}}>{pool.id.slice(0,10)}...</div></div></div></td>
        <td style={{color:"var(--accent-green)",fontWeight:600}}>{formatUSD(pool.totalValueLockedUSD,true)}</td>
        <td>{formatUSD(pool.volumeUSD,true)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12}}>{parseFloat(pool.token0Price).toFixed(6)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12}}>{parseFloat(pool.token1Price).toFixed(6)}</td>
        <td>{formatNumber(parseInt(pool.txCount),0)}</td>
        <td style={{color:"var(--text-muted)"}}>{formatDate(pool.createdAtTimestamp)}</td>
      </tr>
    ))}</tbody></table></div>
  </div>;
};
export default PoolsTable;
