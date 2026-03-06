import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

# Fix line 74 - prices mapping
old1 = 'const prices = days.map((d: any) => parseFloat(d.priceUSD) * shmPrice).filter((p: number) => p > 0);'
new1 = 'const prices = days.map((d: any) => parseFloat(d.priceUSD) > 0 ? (1 / parseFloat(d.priceUSD)) * shmPrice : 0).filter((p: number) => p > 0);'

# Fix line 81 - lastWeekPrice
old2 = 'lastWeekPrice: parseFloat(weekEntry.priceUSD) * shmPrice,'
new2 = 'lastWeekPrice: parseFloat(weekEntry.priceUSD) > 0 ? (1 / parseFloat(weekEntry.priceUSD)) * shmPrice : 0,'

if old1 in f:
    f = f.replace(old1, new1)
    print("✓ fixed prices mapping (ATH/ATL)")
else:
    print("✗ prices mapping not found")

if old2 in f:
    f = f.replace(old2, new2)
    print("✓ fixed lastWeekPrice (7D change)")
else:
    print("✗ lastWeekPrice not found")

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
