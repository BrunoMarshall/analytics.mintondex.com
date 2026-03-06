import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

# Fix color logic - ATL at extreme should be red (it already is green for ATL, but we want red "now")
old = '  const isAtExtreme = Math.abs(pct) < 0.05;\n  const color = label === "ATH" ? (isAtExtreme ? "#22c55e" : "#ef4444") : "#22c55e";'
new = '  const isAtExtreme = Math.abs(pct) < 0.05;\n  const color = label === "ATH" ? (isAtExtreme ? "#22c55e" : "#ef4444") : (isAtExtreme ? "#ef4444" : "#22c55e");'

if old in f:
    f = f.replace(old, new)
    print("fixed ATL color logic")
else:
    print("ERROR: color block not found")

# Fix display - add ATL blink in red
old2 = '{label === "ATH" && isAtExtreme ? <span style={{ animation: "blink 1.2s ease-in-out infinite", color: "#22c55e", fontWeight: 800 }}>now</span> : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}'
new2 = '{isAtExtreme ? <span style={{ animation: "blink 1.2s ease-in-out infinite", color: label === "ATH" ? "#22c55e" : "#ef4444", fontWeight: 800 }}>now</span> : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed ATL display")
else:
    print("ERROR: display line not found")

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
