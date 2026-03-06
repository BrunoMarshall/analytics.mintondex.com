import io

f = io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', encoding='utf-8').read()

# Fix volume chart
old1 = 'volumeUSD: (parseFloat(d.volumeUSD || "0") * shmPrice).toString()'
new1 = 'volumeUSD: (parseFloat(d.volumeUSD || "0") > 0 ? (1 / parseFloat(d.volumeUSD || "0")) * shmPrice : 0).toString()'

if old1 in f:
    f = f.replace(old1, new1)
    print("fixed volumeChartData")
else:
    print("ERROR: volumeChartData not found")

# Fix TVL chart - dayPrice uses wrong formula
old2 = '    const dayPrice = parseFloat(d.priceUSD || "0") * shmPrice;'
new2 = '    const dayPrice = parseFloat(d.priceUSD || "0") > 0 ? (1 / parseFloat(d.priceUSD || "0")) * shmPrice : 0;'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed tvlChartData dayPrice")
else:
    print("ERROR: tvlChartData dayPrice not found")

io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
