import io

f = open('C:/mintondex/frontend/src/components/Charts.tsx', encoding='latin-1').read()

# Add title prop to TVLChart
f = f.replace(
    'export const TVLChart: React.FC<{data:{date:string,tvlUSD:string}[];loading?:boolean}> = ({data,loading=false}) => {',
    'export const TVLChart: React.FC<{data:{date:string,tvlUSD:string}[];loading?:boolean;title?:string}> = ({data,loading=false,title="Total Value Locked"}) => {'
)
f = f.replace(
    '<div className="chart-title">Total Value Locked</div>',
    '<div className="chart-title">{title}</div>'
)

# Add PriceTokenChart at the end
extra = '''
export const PriceTokenChart: React.FC<{data:{date:string,tvlUSD:string}[];symbol:string;loading?:boolean}> = ({data,symbol,loading=false}) => {
  const d = data.map(x=>({date:formatDateShort(x.date),value:parseFloat(x.tvlUSD)||0}));
  const latest = d[d.length-1]?.value??0;
  return <div className="chart-container"><div className="chart-header"><div className="chart-title">{symbol} Price (USD)</div><div className="chart-current-value" style={{color:"var(--accent-yellow)"}}>${latest < 0.0001 ? latest.toFixed(10) : latest < 0.01 ? latest.toFixed(6) : latest.toFixed(4)}</div></div>
  {loading?<div className="loading-state" style={{padding:40}}><div className="spinner"/></div>:
  d.length === 0 ? <div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-muted)",fontSize:13}}>No price history yet — data builds up over time</div> :
  <ResponsiveContainer width="100%" height={220}><AreaChart data={d}><defs><linearGradient id="ptG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd166" stopOpacity={0.3}/><stop offset="100%" stopColor="#ffd166" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"var(--text-muted)",fontSize:10}} axisLine={false} tickLine={false} width={80} tickFormatter={v=>v < 0.0001 ? v.toExponential(2) : "$"+v.toFixed(4)}/><Tooltip content={<Tip/>}/><Area type="monotone" dataKey="value" stroke="#ffd166" strokeWidth={2} fill="url(#ptG)" dot={false}/></AreaChart></ResponsiveContainer>}</div>;
};
'''
f = f.rstrip() + extra

with io.open('C:/mintondex/frontend/src/components/Charts.tsx', 'w', encoding='utf-8') as out:
    out.write(f)
print('done')
