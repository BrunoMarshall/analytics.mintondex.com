import io

f = io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', encoding='utf-8').read()

# Revert volume overcorrection - volumeUSD is in WSHM, so just * shmPrice
old1 = 'volumeUSD: (parseFloat(d.volumeUSD || "0") > 0 ? (1 / parseFloat(d.volumeUSD || "0")) * shmPrice : 0).toString()'
new1 = 'volumeUSD: (parseFloat(d.volumeUSD || "0") * shmPrice).toString()'

if old1 in f:
    f = f.replace(old1, new1)
    print("fixed volumeChartData - reverted overcorrection")
else:
    print("ERROR: not found")

io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
