import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

# Find the "now" text and wrap it in a styled span with blink animation
old = '{label === "ATH" && isAtExtreme ? "now" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}'
new = '{label === "ATH" && isAtExtreme ? <span style={{ animation: "blink 1.2s ease-in-out infinite", color: "#22c55e", fontWeight: 800 }}>now</span> : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}'

if old in f:
    f = f.replace(old, new)
    print("fixed now blink")
else:
    print("ERROR: not found")
    raise SystemExit

# Add keyframes to the top of the component (after imports, before function)
keyframes = """
const blinkStyle = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`;
"""

# Inject a <style> tag into the JSX return, or add keyframes via a style tag
# Easiest: inject a global style element once at top of TokensPage return
old2 = '  return (\n    <div>\n      <div className="page-header">'
new2 = '  return (\n    <div>\n      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }`}</style>\n      <div className="page-header">'

if old2 in f:
    f = f.replace(old2, new2)
    print("injected keyframes")
else:
    print("ERROR: return div not found - checking...")
    idx = f.find('return (\n    <div>')
    print("found at:", idx, repr(f[idx:idx+80]))

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
