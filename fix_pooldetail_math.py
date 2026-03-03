import io

f = io.open('C:/mintondex/frontend/src/pages/PoolDetailPage.tsx', encoding='utf-8').read()

# Fix TVL - reserve1 is WSHM, reserve0 is token
# TVL = (reserve0 * mintPriceInWshm + reserve1) * shmPrice
# mintPriceInWshm = token1Price (how much WSHM per MINT)
old_tvl = """  const tvl = pool
    ? parseFloat(pool.reserve0 || "0") * shmPrice + parseFloat(pool.reserve1 || "0") * tokenPriceToUSD(pool.token1Price || "0", shmPrice)
    : 0;"""

new_tvl = """  // In V2: token1Price = how much token1 (WSHM) per token0 (MINT)
  // TVL = (reserve0 * token1Price + reserve1) * shmPrice
  const reserve0 = parseFloat(pool?.reserve0 || "0");
  const reserve1 = parseFloat(pool?.reserve1 || "0");
  const t1PerT0 = parseFloat(pool?.token1Price || "0"); // WSHM per MINT
  const t0PerT1 = parseFloat(pool?.token0Price || "0"); // MINT per WSHM
  const tvl = pool ? (reserve0 * t1PerT0 + reserve1) * shmPrice : 0;
  const mintPriceUSD = t1PerT0 * shmPrice;
  const wshmPriceUSD = shmPrice;"""

f = f.replace(old_tvl, new_tvl)

# Fix stats cards prices
f = f.replace(
    '{formatUSD(parseFloat(pool.token0Price || "0") * shmPrice, false)}',
    '{formatUSD(mintPriceUSD, false)}'
)
f = f.replace(
    '{formatUSD(parseFloat(pool.token1Price || "0") * shmPrice, false)}',
    '{formatUSD(wshmPriceUSD, false)}'
)

# Fix TVL display
f = f.replace(
    '{formatUSD(tvl, true)}',
    '{formatUSD(tvl, false)}'
)

# Fix volume - volumeUSD in subgraph is in WSHM units
f = f.replace(
    '{formatUSD(parseFloat(pool.volumeUSD || "0") * shmPrice, true)}',
    '{formatUSD(parseFloat(pool.volumeUSD || "0") * shmPrice, false)}'
)

# Fix token composition TVL
f = f.replace(
    '{formatUSD(parseFloat(reserve || "0") * shmPrice, true)}',
    '{formatUSD(parseFloat(reserve || "0") * (reserve === pool.reserve0 ? mintPriceUSD : wshmPriceUSD), false)}'
)

# Fix exchange rate - show correct direction
f = f.replace(
    '1 {t0?.symbol} = {formatNumber(parseFloat(pool.token0Price || "0"), 6)} {t1?.symbol}',
    '1 {t0?.symbol} = {formatNumber(t1PerT0, 2)} {t1?.symbol}'
)

# Fix reserves display - remove K abbreviation by using more decimals
f = f.replace(
    '{formatNumber(parseFloat(pool.reserve0 || "0"), 2)}',
    '{parseFloat(pool.reserve0 || "0").toLocaleString("en-US", {maximumFractionDigits: 4})}'
)
f = f.replace(
    '{formatNumber(parseFloat(pool.reserve1 || "0"), 2)}',
    '{parseFloat(pool.reserve1 || "0").toLocaleString("en-US", {maximumFractionDigits: 4})}'
)

# Fix token composition reserves
f = f.replace(
    '{formatNumber(parseFloat(reserve || "0"), 4)}',
    '{parseFloat(reserve || "0").toLocaleString("en-US", {maximumFractionDigits: 4})}'
)

# Fix charts - TVL chart
f = f.replace(
    'tvlUSD: (parseFloat(d.reserve0 || "0") * shmPrice + parseFloat(d.reserve1 || "0") * shmPrice).toString()',
    'tvlUSD: ((parseFloat(d.reserve0 || "0") * parseFloat(d.token1Price || t1PerT0.toString()) + parseFloat(d.reserve1 || "0")) * shmPrice).toString()'
)

io.open('C:/mintondex/frontend/src/pages/PoolDetailPage.tsx', 'w', encoding='utf-8').write(f)
print("done, length:", len(f))
