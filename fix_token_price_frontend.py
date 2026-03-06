import io

# CONFIRMED ANALYSIS (no subgraph change needed):
#
# Subgraph stores token.priceUSD = token1Price of the pair where this token appears
# For WSHM/P2F: P2F.priceUSD = token1Price = 0.00999 (P2F per WSHM... actually WSHM per P2F)
# 
# Pool detail page shows correct price using token0Price * shmPrice = 100 * $0.0000879 = $0.00879
# TokensPage uses token.priceUSD * shmPrice = 0.00999 * $0.0000879 = $0.00000088 (WRONG)
#
# Fix: priceUSD in subgraph is stored as token1Price (always < 1 for these tokens)
# The actual WSHM-equivalent price = 1 / priceUSD
# So correct USD price = (1 / token.priceUSD) * shmPrice
#
# Special case WSHM: priceUSD = 1, so 1/1 * shmPrice = shmPrice ✓
# MINT: priceUSD = 0.001199, 1/0.001199 * $0.0000879 = 833 * $0.0000879 = $0.073 ✓
# P2F: priceUSD = 0.00999, 1/0.00999 * $0.0000879 = 100 * $0.0000879 = $0.00879 ✓
# SPLIT: priceUSD = 0.01999, 1/0.01999 * $0.0000879 = 50 * $0.0000879 = $0.0044 ✓
# HBOT: priceUSD = 0.01, 1/0.01 * $0.0000879 = 100 * $0.0000879 = $0.00879 ✓

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

# Fix the price calculation in rows mapping
old = 'priceUSD: parseFloat(token.priceUSD || "0") * shmPrice,'
new = 'priceUSD: parseFloat(token.priceUSD || "0") > 0 ? (1 / parseFloat(token.priceUSD)) * shmPrice : 0,'

if old in f:
    f = f.replace(old, new)
    print("fixed priceUSD calculation in rows")
else:
    print("ERROR: string not found, searching...")
    idx = f.find("priceUSD:")
    print(repr(f[max(0,idx-20):idx+100]))

# Fix marketCap calculation too (uses priceUSD)
old2 = 'marketCap: parseFloat(token.priceUSD || "0") * shmPrice * parseFloat(token.totalSupply || "0"),'
new2 = 'marketCap: parseFloat(token.priceUSD || "0") > 0 ? (1 / parseFloat(token.priceUSD)) * shmPrice * parseFloat(token.totalSupply || "0") : 0,'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed marketCap calculation")
else:
    print("marketCap string not found, searching...")
    idx = f.find("marketCap:")
    print(repr(f[max(0,idx-20):idx+150]))

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved TokensPage.tsx")
