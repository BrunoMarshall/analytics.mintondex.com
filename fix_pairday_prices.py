import io

# ── 1. schema.graphql ── add token0Price / token1Price to PairDayData ──────────
f = io.open('C:/mintondex/subgraph/schema.graphql', encoding='utf-8').read()

old = (
    'type PairDayData @entity(immutable: false) {\n'
    '  id: ID!\n'
    '  date: Int!\n'
    '  pair: Pair!\n'
    '  reserve0: BigDecimal!\n'
    '  reserve1: BigDecimal!\n'
    '  volumeToken0: BigDecimal!\n'
    '  volumeToken1: BigDecimal!\n'
    '  volumeUSD: BigDecimal!\n'
    '  txCount: BigInt!\n'
    '}'
)
new = (
    'type PairDayData @entity(immutable: false) {\n'
    '  id: ID!\n'
    '  date: Int!\n'
    '  pair: Pair!\n'
    '  reserve0: BigDecimal!\n'
    '  reserve1: BigDecimal!\n'
    '  token0Price: BigDecimal!\n'
    '  token1Price: BigDecimal!\n'
    '  volumeToken0: BigDecimal!\n'
    '  volumeToken1: BigDecimal!\n'
    '  volumeUSD: BigDecimal!\n'
    '  txCount: BigInt!\n'
    '}'
)

assert old in f, "ERROR: schema pattern not found - check manually"
f = f.replace(old, new)
io.open('C:/mintondex/subgraph/schema.graphql', 'w', encoding='utf-8').write(f)
print("checkmark schema.graphql updated")

# ── 2. pair.ts ── init + set token0Price / token1Price in updatePairDayData ───
f = io.open('C:/mintondex/subgraph/src/pair.ts', encoding='utf-8').read()

old_init = '    d.volumeToken0 = ZERO_BD; d.volumeToken1 = ZERO_BD;\n    d.volumeUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);'
new_init = '    d.volumeToken0 = ZERO_BD; d.volumeToken1 = ZERO_BD;\n    d.volumeUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);\n    d.token0Price = ZERO_BD; d.token1Price = ZERO_BD;'

assert old_init in f, "ERROR: pair.ts init pattern not found"
f = f.replace(old_init, new_init)

old_save = '  d.reserve0 = pair.reserve0; d.reserve1 = pair.reserve1; d.save();'
new_save = '  d.reserve0 = pair.reserve0; d.reserve1 = pair.reserve1; d.token0Price = pair.token0Price; d.token1Price = pair.token1Price; d.save();'

assert old_save in f, "ERROR: pair.ts save pattern not found"
f = f.replace(old_save, new_save)

io.open('C:/mintondex/subgraph/src/pair.ts', 'w', encoding='utf-8').write(f)
print("checkmark pair.ts updated")

# ── 3. queries.ts ── fetch token0Price/token1Price from pairDayDatas directly ─
f = io.open('C:/mintondex/frontend/src/graphql/queries.ts', encoding='utf-8').read()

old_q = '      date\n      reserve0\n      reserve1\n      pair { token0 { id } token1 { id } token0Price token1Price }\n    }'
new_q = '      date\n      reserve0\n      reserve1\n      token0Price\n      token1Price\n      pair { token0 { id } token1 { id } }\n    }'

assert old_q in f, "ERROR: queries.ts pattern not found"
f = f.replace(old_q, new_q)
io.open('C:/mintondex/frontend/src/graphql/queries.ts', 'w', encoding='utf-8').write(f)
print("checkmark queries.ts updated")

# ── 4. HomePage.tsx ── use d.token0Price instead of d.pair?.token0Price ───────
f = io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', encoding='utf-8').read()

old_h = '        parseFloat(d.pair?.token0Price || "0"), parseFloat(d.pair?.token1Price || "0"),'
new_h = '        parseFloat(d.token0Price || d.pair?.token0Price || "0"), parseFloat(d.token1Price || d.pair?.token1Price || "0"),'

assert old_h in f, "ERROR: HomePage.tsx pattern not found"
f = f.replace(old_h, new_h)
io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', 'w', encoding='utf-8').write(f)
print("checkmark HomePage.tsx updated")

print("\nAll done. Next steps:")
print("  cd C:/mintondex/subgraph && npm run codegen && npm run build")
print("  graph deploy --node http://144.91.89.44:8020 --ipfs http://144.91.89.44:5001 mintondex-v2")
print("  cd C:/mintondex/frontend && npm run build")
