import React, { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatUSD, formatDateShort } from "../utils/format";

const Tip = ({ active, payload, label, prefix="$" }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return <div style={{background:"var(--bg-secondary)",border:"1px solid var(--border-light)",borderRadius:8,padding:"10px 14px"}}>
    <div style={{color:"var(--text-muted)",fontSize:11,fontFamily:"var(--font-mono)",marginBottom:4}}>{label}</div>
    <div style={{color:"var(--text-primary)",fontWeight:700,fontSize:16}}>{prefix}{typeof v==="number"&&v>=1000?formatUSD(v,true).replace("$",""):typeof v==="number"?v.toFixed(6):v}</div>
  </div>;
};

export const TVLChart: React.FC<{data:{date:string,tvlUSD:string}[];loading?:boolean;title?:string}> = ({data,loading=false,title="Total Value Locked"}) => {
  const d = data.map(x=>({date:formatDateShort(x.date),value:parseFloat(x.tvlUSD)||0}));
  return <div className="chart-container"><div className="chart-header"><div className="chart-title">{title}</div><div className="chart-current-value" style={{color:"var(--accent)"}}>{formatUSD(d[d.length-1]?.value??0,true)}</div></div>
  {loading?<div className="loading-state" style={{padding:40}}><div className="spinner"/></div>:
  <ResponsiveContainer width="100%" height={220}><AreaChart data={d}><defs><linearGradient id="tvlG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3}/><stop offset="100%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>formatUSD(v,true)} width={70}/><Tooltip content={<Tip/>}/><Area type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} fill="url(#tvlG)" dot={false}/></AreaChart></ResponsiveContainer>}</div>;
};

export const VolumeChart: React.FC<{data:{date:string,volumeUSD:string}[];loading?:boolean}> = ({data,loading=false}) => {
  const d = data.map(x=>({date:formatDateShort(x.date),value:parseFloat(x.volumeUSD)||0}));
  return <div className="chart-container"><div className="chart-header"><div className="chart-title">Daily Volume</div><div className="chart-current-value" style={{color:"var(--accent-green)"}}>{formatUSD(d[d.length-1]?.value??0,true)}</div></div>
  {loading?<div className="loading-state" style={{padding:40}}><div className="spinner"/></div>:
  <ResponsiveContainer width="100%" height={220}><BarChart data={d}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>formatUSD(v,true)} width={70}/><Tooltip content={<Tip/>}/><Bar dataKey="value" fill="#00e5a0" radius={[3,3,0,0]} opacity={0.85}/></BarChart></ResponsiveContainer>}</div>;
};

export const PriceChart: React.FC<{data:{date:string,token0Price:string,token1Price:string}[];token0Symbol:string;token1Symbol:string;loading?:boolean}> = ({data,token0Symbol,token1Symbol,loading=false}) => {
  const [pv,setPv]=useState<"0"|"1">("0");
  const d = data.map(x=>({date:formatDateShort(x.date),value:pv==="0"?parseFloat(x.token0Price)||0:parseFloat(x.token1Price)||0}));
  return <div className="chart-container"><div className="chart-header"><div><div className="chart-title">Token Price</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>{pv==="0"?token1Symbol+" per "+token0Symbol:token0Symbol+" per "+token1Symbol}</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}><div className="chart-current-value" style={{color:"var(--accent-yellow)"}}>{(d[d.length-1]?.value??0).toFixed(6)}</div><div className="chart-tabs"><button className={"chart-tab "+(pv==="0"?"active":"")} onClick={()=>setPv("0")}>{token0Symbol}</button><button className={"chart-tab "+(pv==="1"?"active":"")} onClick={()=>setPv("1")}>{token1Symbol}</button></div></div></div>
  {loading?<div className="loading-state" style={{padding:40}}><div className="spinner"/></div>:
  <ResponsiveContainer width="100%" height={220}><AreaChart data={d}><defs><linearGradient id="prG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd166" stopOpacity={0.3}/><stop offset="100%" stopColor="#ffd166" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false} width={80} tickFormatter={v=>v.toFixed(4)}/><Tooltip content={<Tip prefix=""/>}/><Area type="monotone" dataKey="value" stroke="#ffd166" strokeWidth={2} fill="url(#prG)" dot={false}/></AreaChart></ResponsiveContainer>}</div>;
};

export const LiquidityChart: React.FC<{data:{date:string,liquidity:string}[];loading?:boolean}> = ({data,loading=false}) => {
  const d = data.map(x=>({date:formatDateShort(x.date),value:parseFloat(x.liquidity)||0}));
  const latest = d[d.length-1]?.value??0;
  return <div className="chart-container"><div className="chart-header"><div className="chart-title">Pool Liquidity</div><div className="chart-current-value" style={{color:"var(--accent)"}}>{latest.toExponential(3)}</div></div>
  {loading?<div className="loading-state" style={{padding:40}}><div className="spinner"/></div>:
  <ResponsiveContainer width="100%" height={220}><AreaChart data={d}><defs><linearGradient id="lqG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35}/><stop offset="100%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false} width={70} tickFormatter={v=>v.toExponential(1)}/><Tooltip content={<Tip prefix=""/>}/><Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} fill="url(#lqG)" dot={false}/></AreaChart></ResponsiveContainer>}</div>;
};
export const PriceTokenChart: React.FC<{data:{date:string,tvlUSD:string}[];symbol:string;loading?:boolean}> = ({data,symbol,loading=false}) => {
  const d = data.map(x=>({date:formatDateShort(x.date),value:parseFloat(x.tvlUSD)||0}));
  const latest = d[d.length-1]?.value??0;
  return <div className="chart-container"><div className="chart-header"><div className="chart-title">{symbol} Price (USD)</div><div className="chart-current-value" style={{color:"var(--accent-yellow)"}}>${latest < 0.0001 ? latest.toFixed(10) : latest < 0.01 ? latest.toFixed(6) : latest.toFixed(4)}</div></div>
  {loading?<div className="loading-state" style={{padding:40}}><div className="spinner"/></div>:
  d.length === 0 ? <div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-muted)",fontSize:13}}>No price history yet — data builds up over time</div> :
  <ResponsiveContainer width="100%" height={220}><AreaChart data={d}><defs><linearGradient id="ptG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd166" stopOpacity={0.3}/><stop offset="100%" stopColor="#ffd166" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false} width={80} tickFormatter={v=>v < 0.0001 ? v.toExponential(2) : "$"+v.toFixed(4)}/><Tooltip content={<Tip/>}/><Area type="monotone" dataKey="value" stroke="#ffd166" strokeWidth={2} fill="url(#ptG)" dot={false}/></AreaChart></ResponsiveContainer>}</div>;
};
