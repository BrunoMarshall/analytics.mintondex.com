import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

old = '  const pct = ((price - extreme) / extreme) * 100;\n  const color = label === "ATH" ? "#ef4444" : "#22c55e";'
new = '  const pct = ((price - extreme) / extreme) * 100;\n  const isAtExtreme = Math.abs(pct) < 0.05;\n  const color = label === "ATH" ? (isAtExtreme ? "#22c55e" : "#ef4444") : "#22c55e";'

if old in f:
    f = f.replace(old, new)
    print("fixed color logic")
else:
    print("ERROR: color block not found")

old2 = '{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%'
new2 = '{label === "ATH" && isAtExtreme ? "now" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed display")
else:
    print("ERROR: display line not found")

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
