import io

f = io.open('C:/mintondex/subgraph/src/pair.ts', encoding='utf-8').read()

# Remove the bad line and replace with inline logic
old = '  let pd = updatePairDayData(event as unknown as SyncEvent, pair as Pair);\n  pd.volumeUSD = pd.volumeUSD.plus(volumeUSD);\n  pd.volumeToken0 = pd.volumeToken0.plus(vol0);\n  pd.volumeToken1 = pd.volumeToken1.plus(vol1);\n  pd.txCount = pd.txCount.plus(BigInt.fromI32(1));\n  pd.save();\n}'

new = '  let swapDayIndex = event.block.timestamp.toI32() / 86400;\n  let swapDayId = pair.id.concat("-").concat(BigInt.fromI32(swapDayIndex).toString());\n  let pd = PairDayData.load(swapDayId);\n  if (pd === null) {\n    pd = new PairDayData(swapDayId);\n    pd.date = swapDayIndex * 86400;\n    pd.pair = pair.id;\n    pd.reserve0 = pair.reserve0;\n    pd.reserve1 = pair.reserve1;\n    pd.volumeToken0 = ZERO_BD;\n    pd.volumeToken1 = ZERO_BD;\n    pd.volumeUSD = ZERO_BD;\n    pd.txCount = BigInt.fromI32(0);\n  }\n  pd.volumeUSD = pd.volumeUSD.plus(volumeUSD);\n  pd.volumeToken0 = pd.volumeToken0.plus(vol0);\n  pd.volumeToken1 = pd.volumeToken1.plus(vol1);\n  pd.txCount = pd.txCount.plus(BigInt.fromI32(1));\n  pd.save();\n}'

if old in f:
    f = f.replace(old, new)
    print("fixed - inline pairDayData volume")
else:
    print("ERROR: not found")
    idx = f.rfind('updatePairDayData')
    print(repr(f[idx:idx+100]))

io.open('C:/mintondex/subgraph/src/pair.ts', 'w', encoding='utf-8').write(f)
print("saved!")
