import io

f = io.open("C:/mintondex/frontend/src/pages/TokenDetailPage.tsx", encoding="utf-8").read()

old = """  // TVL = reserve value in USD from pairs
  const pairs = [...(token.pairsBase ?? []), ...(token.pairsQuote ?? [])];
  const tvl = pairs.reduce((sum: number, p: any) => {
    return sum + parseFloat(p.reserve1 || "0") * 2 * shmPrice;
  }, 0);"""

new = """  // TVL = sum both sides of each pair in USD
  // WSHM side gives us the USD anchor: wshmReserve * 2 * shmPrice
  const pairs = [...(token.pairsBase ?? []), ...(token.pairsQuote ?? [])];
  const tvl = pairs.reduce((sum: number, p: any) => {
    const t0isWshm = (p.token0?.id ?? "").toLowerCase() === WSHM;
    const t1isWshm = (p.token1?.id ?? "").toLowerCase() === WSHM;
    const r0 = parseFloat(p.reserve0 || "0");
    const r1 = parseFloat(p.reserve1 || "0");
    const t1price = parseFloat(p.token1Price || "0"); // WSHM per token0
    const t0price = parseFloat(p.token0Price || "0"); // token0 per WSHM
    if (t1isWshm) {
      // reserve1 = WSHM, convert reserve0 via token1Price
      return sum + (r0 * t1price + r1) * shmPrice;
    } else if (t0isWshm) {
      // reserve0 = WSHM, convert reserve1 via token0Price
      return sum + (r1 * t0price + r0) * shmPrice;
    }
    // fallback
    return sum + r1 * 2 * shmPrice;
  }, 0);"""

if old in f:
    f = f.replace(old, new)
    print("replaced TVL calculation")
else:
    print("ERROR: old string not found, checking what's there...")
    idx = f.find("TVL = reserve")
    print(repr(f[max(0,idx-20):idx+300]))

io.open("C:/mintondex/frontend/src/pages/TokenDetailPage.tsx", "w", encoding="utf-8").write(f)
print("saved TokenDetailPage.tsx")

# Also fix TOKEN_DETAIL_QUERY to include token0/token1 id and prices in pairs
qt = io.open("C:/mintondex/frontend/src/graphql/queries.ts", encoding="utf-8").read()

# Find and fix the pairsBase/pairsQuote fields in TOKEN_DETAIL_QUERY
old_pairs = "pairsBase { id reserve0 reserve1 volumeUSD txCount token0 { id symbol } token1 { id symbol } }\n      pairsQuote { id reserve0 reserve1 volumeUSD txCount token0 { id symbol } token1 { id symbol } }"
new_pairs = "pairsBase { id reserve0 reserve1 token0Price token1Price volumeUSD txCount token0 { id symbol } token1 { id symbol } }\n      pairsQuote { id reserve0 reserve1 token0Price token1Price volumeUSD txCount token0 { id symbol } token1 { id symbol } }"

if old_pairs in qt:
    qt = qt.replace(old_pairs, new_pairs)
    print("fixed TOKEN_DETAIL_QUERY pairs")
else:
    # Try to find what's there
    idx = qt.find("pairsBase")
    if idx >= 0:
        print("pairsBase found:", repr(qt[idx:idx+200]))
    else:
        print("pairsBase not found in queries.ts - may need manual check")

io.open("C:/mintondex/frontend/src/graphql/queries.ts", "w", encoding="utf-8").write(qt)
