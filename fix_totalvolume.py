import io

f = io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', encoding='utf-8').read()

old = 'const volumeUSD = parseFloat(token.tradeVolume || "0") * shmPrice;'
new = 'const volumeUSD = parseFloat(token.priceUSD || "0") > 0 ? parseFloat(token.tradeVolume || "0") * (1 / parseFloat(token.priceUSD)) * shmPrice : 0;'

if old in f:
    f = f.replace(old, new)
    print("fixed total volumeUSD")
else:
    print("ERROR: not found")

io.open('C:/mintondex/frontend/src/pages/TokenDetailPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
