import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { TOKENS_QUERY } from "../graphql/queries";
import { formatNumber, getExplorerUrl } from "../utils/format";
const TokensPage: React.FC = () => {
  const [search,setSearch]=useState("");
  const { data, loading, error } = useQuery(TOKENS_QUERY);
  const tokens = (data?.tokens??[]).filter((t:any)=>{const q=search.toLowerCase();return t.symbol.toLowerCase().includes(q)||t.name.toLowerCase().includes(q)||t.id.toLowerCase().includes(q);});
  return <div>
    <div className="page-header"><h1 className="page-title">Tokens</h1><p className="page-subtitle">All tokens indexed on Mintondex</p></div>
    {error && <div className="error-state" style={{marginBottom:24}}><strong>Error loading tokens</strong><p style={{marginTop:8,fontSize:12}}>{error.message}</p></div>}
    <div style={{marginBottom:16}}><input className="search-bar" type="text" placeholder="Search token..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="table-container"><table><thead><tr><th>#</th><th>Token</th><th>Price USD</th><th>Volume</th><th>Tx Count</th><th>Pools</th><th>Decimals</th><th>Contract</th></tr></thead>
    <tbody>{loading?<tr><td colSpan={8}><div className="loading-state" style={{padding:60}}><div className="spinner"/><span>Loading tokens...</span></div></td></tr>:tokens.length===0?<tr><td colSpan={8} style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>No tokens found</td></tr>:tokens.map((t:any,i:number)=>(
      <tr key={t.id}>
        <td style={{color:"var(--text-muted)",fontFamily:"var(--font-mono)",width:40}}>{i+1}</td>
        <td><div style={{display:"flex",alignItems:"center",gap:10}}><div className="token-icon">{t.symbol.slice(0,2)}</div><div><div style={{fontWeight:600,color:"var(--text-primary)"}}>{t.symbol}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{t.name}</div></div></div></td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--accent-yellow)"}}>${parseFloat(t.priceUSD||"0").toFixed(6)}</td>
        <td>{formatNumber(parseFloat(t.volume||"0"))}</td>
        <td>{formatNumber(parseInt(t.txCount||"0"),0)}</td>
        <td><span style={{background:"var(--accent-dim)",color:"var(--accent)",padding:"2px 8px",borderRadius:12,fontSize:11,fontFamily:"var(--font-mono)"}}>{t.poolCount}</span></td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12}}>{t.decimals}</td>
        <td><a href={getExplorerUrl(t.id)} target="_blank" rel="noopener noreferrer" style={{fontFamily:"var(--font-mono)",fontSize:11}}>{t.id.slice(0,10)}...</a></td>
      </tr>
    ))}</tbody></table></div>
  </div>;
};
export default TokensPage;
