import React from "react";
import { formatUSD, formatAddress, formatDateTime, getExplorerUrl } from "../utils/format";

interface Swap{id:string;timestamp:string;sender:string;recipient:string;amount0:string;amount1:string;amountUSD:string}

const SwapsTable:React.FC<{swaps:Swap[];token0Symbol:string;token1Symbol:string;loading?:boolean}>=({swaps,token0Symbol,token1Symbol,loading=false})=>{
  if(loading) return <div className="loading-state" style={{padding:40}}><div className="spinner"/></div>;
  return <div>
    <h3 style={{fontSize:14,fontWeight:600,color:"var(--text-secondary)",fontFamily:"var(--font-mono)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:16}}>Recent Swaps</h3>
    <div className="table-container"><table><thead><tr><th>Time</th><th>{token0Symbol}</th><th>{token1Symbol}</th><th>Value USD</th><th>Account</th><th>Tx</th></tr></thead>
    <tbody>{swaps.length===0?<tr><td colSpan={6} style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>No swaps yet</td></tr>:swaps.map(s=>{
      const a0=parseFloat(s.amount0);const a1=parseFloat(s.amount1);const txHash=s.id.split("-")[0];
      return <tr key={s.id}>
        <td style={{color:"var(--text-muted)",fontFamily:"var(--font-mono)",fontSize:11}}>{formatDateTime(s.timestamp)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12,color:a0<0?"var(--accent-red)":"var(--accent-green)"}}>{a0>0?"+":""}{a0.toFixed(6)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12,color:a1<0?"var(--accent-red)":"var(--accent-green)"}}>{a1>0?"+":""}{a1.toFixed(6)}</td>
        <td style={{color:"var(--text-primary)",fontWeight:600}}>{formatUSD(s.amountUSD)}</td>
        <td><a href={getExplorerUrl(s.sender)} target="_blank" rel="noopener noreferrer" style={{fontFamily:"var(--font-mono)",fontSize:11}} onClick={e=>e.stopPropagation()}>{formatAddress(s.sender)}</a></td>
        <td><a href={getExplorerUrl(txHash,"tx")} target="_blank" rel="noopener noreferrer" style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)"}} onClick={e=>e.stopPropagation()}>↗ {txHash.slice(0,8)}...</a></td>
      </tr>;
    })}</tbody></table></div>
  </div>;
};
export default SwapsTable;
