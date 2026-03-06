import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

# Find the volume cell rendering and make SHM show "—"
old = '<td>{formatUSD(token.volume, true)}</td>'
new = '<td>{token.isSHM ? "—" : formatUSD(token.volume, true)}</td>'

if old in f:
    f = f.replace(old, new)
    print("✓ fixed SHM volume to show —")
else:
    print("✗ not found, searching...")
    idx = f.find("token.volume")
    print(repr(f[max(0,idx-30):idx+80]))

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
