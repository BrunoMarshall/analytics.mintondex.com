import io

f = io.open('C:/mintondex/subgraph/src/pair.ts', encoding='utf-8').read()

# Fix: AssemblyScript doesn't support 'any' - use SwapEvent directly
old = '  let pd = updatePairDayData(event as any, pair as Pair);'
new = '  let pd = updatePairDayData(event as unknown as SyncEvent, pair as Pair);'

if old in f:
    f = f.replace(old, new)
    print("fixed any type")
else:
    print("ERROR: not found")

io.open('C:/mintondex/subgraph/src/pair.ts', 'w', encoding='utf-8').write(f)
print("saved!")
