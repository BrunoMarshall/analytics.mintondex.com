import io

f = io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', encoding='utf-8').read()

old = 'volumeChartData = tokenDayDatas.map((d: any) => ({\n    date: String(d.date),\n    volumeUSD: (parseFloat(d.priceUSD || "0") > 0 ? parseFloat(d.volumeUSD || "0") * (1 / parseFloat(d.priceUSD)) * shmPrice : 0).toString()\n  }));'
new = 'volumeChartData = tokenDayDatas.map((d: any) => ({\n    date: String(d.date),\n    volumeUSD: (parseFloat(d.priceUSD || "0") > 0 ? (parseFloat(d.volumeUSD || "0") / parseFloat(d.priceUSD)) * (1 / parseFloat(d.priceUSD)) * shmPrice : 0).toString()\n  }));'

if old in f:
    f = f.replace(old, new)
    print("fixed volumeChartData")
else:
    print("ERROR: not found, checking current state...")
    idx = f.find('volumeChartData = tokenDayDatas')
    print(repr(f[idx:idx+250]))

io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
