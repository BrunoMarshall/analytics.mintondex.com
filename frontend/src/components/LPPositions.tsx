import React, { useState } from "react";
import { formatUSD, formatDateTime, formatAddress } from "../utils/format";

interface LPEvent{id:string;timestamp:string;owner:string;amount:string;amount0:string;amount1:string;amountUSD:string;tickLower:string;tickUpper:string}

const LPPositions:React.FC<{mints:LPEvent[];burns:LPEvent[];token0Symbol:string;token1Symbol:string;loading?:boolean}>=({mints,burns,token0Symbol,token1Symbol,loading=false})=>{
  const [tab,setTab]=useState<"mints"|"burns">("mints");
  const data=tab==="mints"?mints:burns;
  if(loading) return <div className="loading-state" style={{padding:40}}><div className="spinner"/></div>;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h3 style={{fontSize:14,fontWeight:600,color:"var(--text-secondary)",fontFamily:"var(--font-mono)",textTransform:"uppercase",letterSpacing:"0.06em"}}>LP Activity</h3>
      <div className="chart-tabs">
        <button className={"chart-tab "+(tab==="mints"?"active":"")} onClick={()=>setTab("mints")} style={{color:"var(--accent-green)"}}>+ Adds ({mints.length})</button>
        <button className={"chart-tab "+(tab==="burns"?"active":"")} onClick={()=>setTab("burns")} style={{color:"var(--accent-red)"}}>- Removes ({burns.length})</button>
      </div>
    </div>
    <div className="table-container"><table><thead><tr><th>Time</th><th>{token0Symbol}</th><th>{token1Symbol}</th><th>Value USD</th><th>Liq Units</th><th>Tick Range</th><th>Account</th></tr></thead>
    <tbody>{data.length===0?<tr><td colSpan={7} style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>No {tab} yet</td></tr>:data.map(e=>(
      <tr key={e.id}>
        <td style={{color:"var(--text-muted)",fontFamily:"var(--font-mono)",fontSize:11}}>{formatDateTime(e.timestamp)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12}}>{parseFloat(e.amount0).toFixed(6)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:12}}>{parseFloat(e.amount1).toFixed(6)}</td>
        <td style={{color:tab==="mints"?"var(--accent-green)":"var(--accent-red)",fontWeight:600}}>{tab==="mints"?"+":"-"}{formatUSD(e.amountUSD)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-muted)"}}>{parseFloat(e.amount).toExponential(3)}</td>
        <td style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-muted)"}}>[{e.tickLower},{e.tickUpper}]</td>
        <td><a href={"https://explorer.shardeum.org/address/"+e.owner} target="_blank" rel="noopener noreferrer" style={{fontFamily:"var(--font-mono)",fontSize:11}}>{formatAddress(e.owner)}</a></td>
      </tr>
    ))}</tbody></table></div>
  </div>;
};
export default LPPositions;
