import io

f = io.open('C:/mintondex/subgraph/src/pair.ts', encoding='utf-8').read()

# 1. Change return type from void to PairDayData
old1 = 'function updatePairDayData(event: SyncEvent, pair: Pair): void {\n  let dayIndex = event.block.timestamp.toI32() / 86400;\n  let id = pair.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());\n  let d = PairDayData.load(id);\n  if (d === null) {\n    d = new PairDayData(id); d.date = dayIndex * 86400; d.pair = pair.id;\n    d.volumeToken0 = ZERO_BD; d.volumeToken1 = ZERO_BD;\n    d.volumeUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);\n  }\n  d.reserve0 = pair.reserve0; d.reserve1 = pair.reserve1; d.save();\n}'
new1 = 'function updatePairDayData(event: SyncEvent, pair: Pair): PairDayData {\n  let dayIndex = event.block.timestamp.toI32() / 86400;\n  let id = pair.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());\n  let d = PairDayData.load(id);\n  if (d === null) {\n    d = new PairDayData(id); d.date = dayIndex * 86400; d.pair = pair.id;\n    d.volumeToken0 = ZERO_BD; d.volumeToken1 = ZERO_BD;\n    d.volumeUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);\n  }\n  d.reserve0 = pair.reserve0; d.reserve1 = pair.reserve1; d.save();\n  return d as PairDayData;\n}'

if old1 in f:
    f = f.replace(old1, new1)
    print("fixed updatePairDayData return type")
else:
    print("ERROR: updatePairDayData not found")

# 2. Add volume accumulation at end of handleSwap
old2 = '  updateProtocolDayData(event.block.timestamp, volumeUSD);\n  updateTokenDayData(t0 as Token, event.block.timestamp, vol0.times(t0.priceUSD));\n  updateTokenDayData(t1 as Token, event.block.timestamp, vol1.times(t1.priceUSD));\n}'
new2 = '  updateProtocolDayData(event.block.timestamp, volumeUSD);\n  updateTokenDayData(t0 as Token, event.block.timestamp, vol0.times(t0.priceUSD));\n  updateTokenDayData(t1 as Token, event.block.timestamp, vol1.times(t1.priceUSD));\n  let pd = updatePairDayData(event as any, pair as Pair);\n  pd.volumeUSD = pd.volumeUSD.plus(volumeUSD);\n  pd.volumeToken0 = pd.volumeToken0.plus(vol0);\n  pd.volumeToken1 = pd.volumeToken1.plus(vol1);\n  pd.txCount = pd.txCount.plus(BigInt.fromI32(1));\n  pd.save();\n}'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed handleSwap volume accumulation")
else:
    print("ERROR: handleSwap end not found")

io.open('C:/mintondex/subgraph/src/pair.ts', 'w', encoding='utf-8').write(f)
print("saved pair.ts!")
