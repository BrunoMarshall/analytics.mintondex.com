import io

f = io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', encoding='utf-8').read()

# Fix price card
old1 = 'const priceUSD = isWshm ? shmPrice : parseFloat(token.priceUSD || "0") * shmPrice;'
new1 = 'const priceUSD = isWshm ? shmPrice : (parseFloat(token.priceUSD || "0") > 0 ? (1 / parseFloat(token.priceUSD)) * shmPrice : 0);'

if old1 in f:
    f = f.replace(old1, new1)
    print("fixed priceUSD")
else:
    print("ERROR: priceUSD not found")

# Fix chart data
old2 = ': tokenDayDatas.map((d: any) => ({ ts: d.date, price: parseFloat(d.priceUSD || "0") * shmPrice }));'
new2 = ': tokenDayDatas.map((d: any) => ({ ts: d.date, price: parseFloat(d.priceUSD || "0") > 0 ? (1 / parseFloat(d.priceUSD || "0")) * shmPrice : 0 }));'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed chart priceData")
else:
    print("ERROR: chart priceData not found")

io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
