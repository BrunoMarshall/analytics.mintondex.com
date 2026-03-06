import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

# The TokenDayData prices are stored the same way as token.priceUSD
# So we need 1/priceUSD * shmPrice for historical prices too
# Find the line that maps tokenDayDatas prices to compute ATH/ATL/lastWeekPrice

old = 'const prices = days.map((d: any) => parseFloat(d.priceUSD) * shmPrice).filter(p => p > 0);'
new = 'const prices = days.map((d: any) => parseFloat(d.priceUSD) > 0 ? (1 / parseFloat(d.priceUSD)) * shmPrice : 0).filter(p => p > 0);'

if old in f:
    f = f.replace(old, new)
    print("fixed ATH/ATL price mapping")
else:
    print("string not found, searching for similar...")
    idx = f.find("days.map")
    if idx >= 0:
        print(repr(f[max(0,idx-20):idx+200]))
    else:
        idx = f.find("priceUSD) * shmPrice")
        print(repr(f[max(0,idx-50):idx+150]))

# Also fix lastWeekPrice
old2 = 'const lastWeekPrice = parseFloat(weekEntry.priceUSD) * shmPrice;'
new2 = 'const lastWeekPrice = parseFloat(weekEntry.priceUSD) > 0 ? (1 / parseFloat(weekEntry.priceUSD)) * shmPrice : 0;'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed lastWeekPrice")
else:
    print("lastWeekPrice string not found")
    idx = f.find("lastWeekPrice")
    if idx >= 0:
        print(repr(f[max(0,idx-20):idx+150]))

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved TokensPage.tsx")
