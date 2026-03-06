import io

f = io.open('C:/mintondex/subgraph/src/pair.ts', encoding='utf-8').read()

# 1. Change updatePairDayData to accept any event type
old1 = 'function updatePairDayData(event: SyncEvent, pair: Pair): PairDayData {'
new1 = 'function updatePairDayData(event: any, pair: Pair): PairDayData {'

if old1 in f:
    f = f.replace(old1, new1)
    print("fixed updatePairDayData signature")
else:
    print("ERROR: signature not found")

# 2. Add volume accumulation at end of handleSwap
old2 = '  updateProtocolDayData(event as any, volumeUSD);\n}'
new2 = '  updateProtocolDayData(event as any, volumeUSD);\n  let pd = updatePairDayData(event as any, pair as Pair);\n  pd.volumeUSD = pd.volumeUSD.plus(volumeUSD);\n  pd.volumeToken0 = pd.volumeToken0.plus(vol0);\n  pd.volumeToken1 = pd.volumeToken1.plus(vol1);\n  pd.txCount = pd.txCount.plus(BigInt.fromI32(1));\n  pd.save();\n}'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed handleSwap volume accumulation")
else:
    print("ERROR: handleSwap end not found")

io.open('C:/mintondex/subgraph/src/pair.ts', 'w', encoding='utf-8').write(f)
print("saved pair.ts!")
