import io

f = io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', encoding='utf-8').read()

# Only target the volumeChartData line - exact match
old = 'volumeChartData = tokenDayDatas.map((d: any) => ({\n    date: String(d.date),\n    volumeUSD: (parseFloat(d.volumeUSD || "0") * shmPrice).toString()\n  }));'
new = 'volumeChartData = tokenDayDatas.map((d: any) => ({\n    date: String(d.date),\n    volumeUSD: (parseFloat(d.priceUSD || "0") > 0 ? parseFloat(d.volumeUSD || "0") * (1 / parseFloat(d.priceUSD)) * shmPrice : 0).toString()\n  }));'

if old in f:
    f = f.replace(old, new)
    print("fixed volumeChartData only")
else:
    print("ERROR: exact string not found")

io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
