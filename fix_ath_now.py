import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

old = """function AthAtl({ price, extreme, label }: { price: number; extreme: number; label: string }) {
  if (!extreme || !price) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const pct = ((price - extreme) / extreme) * 100;
  const color = label === "ATH" ? "#ef4444" : "#22c55e";
  const sign = pct >= 0 ? "+" : "";
  return (
    <div style={{ lineHeight: 1.4 }}>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{formatUSD(extreme, false)}</div>
      <div style={{ color, fontSize: 11 }}>{sign}{pct.toFixed(1)}%</div>
    </div>
  );
}"""

new = """function AthAtl({ price, extreme, label }: { price: number; extreme: number; label: string }) {
  if (!extreme || !price) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const pct = ((price - extreme) / extreme) * 100;
  const isAtExtreme = Math.abs(pct) < 0.05;
  const color = label === "ATH" ? (isAtExtreme ? "#22c55e" : "#ef4444") : "#22c55e";
  const sign = pct >= 0 ? "+" : "";
  return (
    <div style={{ lineHeight: 1.4 }}>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{formatUSD(extreme, false)}</div>
      <div style={{ color, fontSize: 11 }}>{label === "ATH" && isAtExtreme ? "now" : `${sign}${pct.toFixed(1)}%`}</div>
    </div>
  );
}"""

if old in f:
    f = f.replace(old, new)
    print("✓ fixed ATH to show 'now' in green")
else:
    print("✗ string not found")

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
