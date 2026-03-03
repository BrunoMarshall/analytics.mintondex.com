import React from "react";
interface P{title:string;value:string;change?:string;changeDirection?:"up"|"down"|"neutral";subValue?:string;loading?:boolean}
const StatCard:React.FC<P>=({title,value,change,changeDirection="neutral",subValue,loading=false})=>(
  <div className="card">
    <div className="card-title">{title}</div>
    {loading?<div style={{height:36,background:"var(--bg-hover)",borderRadius:6,marginTop:4}}/>:(
      <><div className="card-value">{value}</div>{change&&<div className={"card-change "+changeDirection}>{changeDirection==="up"?"▲":changeDirection==="down"?"▼":""} {change}</div>}{subValue&&<div style={{color:"var(--text-muted)",fontSize:11,marginTop:4,fontFamily:"var(--font-mono)"}}>{subValue}</div>}</>
    )}
  </div>
);
export default StatCard;
