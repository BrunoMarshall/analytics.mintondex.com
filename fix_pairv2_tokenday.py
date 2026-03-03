import io

f = io.open('C:/mintondex/subgraph/src/pair.ts', encoding='utf-8').read()

# Add TokenDayData to imports
f = f.replace(
    'import { Pair, Token, Swap, Mint, Burn, PairDayData, MintondexDayData } from "../generated/schema";',
    'import { Pair, Token, Swap, Mint, Burn, PairDayData, MintondexDayData, TokenDayData } from "../generated/schema";'
)

# Add updateTokenDayData function before handleSync
insert_before = 'export function handleSync'
new_func = '''function updateTokenDayData(token: Token, timestamp: BigInt, volumeUSD: BigDecimal): void {
  let dayIndex = timestamp.toI32() / 86400;
  let id = token.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());
  let d = TokenDayData.load(id);
  if (d === null) {
    d = new TokenDayData(id);
    d.date = dayIndex * 86400;
    d.token = token.id;
    d.volumeUSD = ZERO_BD;
    d.txCount = BigInt.fromI32(0);
  }
  d.priceUSD = token.priceUSD;
  d.volumeUSD = d.volumeUSD.plus(volumeUSD);
  d.txCount = d.txCount.plus(BigInt.fromI32(1));
  d.save();
}

'''
f = f.replace(insert_before, new_func + insert_before)

# Call updateTokenDayData in handleSync after t0/t1 save
f = f.replace(
    't0.save(); t1.save(); pair.save();',
    't0.save(); t1.save(); pair.save();\n  updateTokenDayData(t0 as Token, event.block.timestamp, ZERO_BD);\n  updateTokenDayData(t1 as Token, event.block.timestamp, ZERO_BD);'
)

# Also call in handleSwap with volume
f = f.replace(
    't0.save(); t1.save(); pair.save();\n  let swap',
    't0.save(); t1.save(); pair.save();\n  updateTokenDayData(t0 as Token, event.block.timestamp, vol0.times(t0.priceUSD));\n  updateTokenDayData(t1 as Token, event.block.timestamp, vol1.times(t1.priceUSD));\n  let swap'
)

io.open('C:/mintondex/subgraph/src/pair.ts', 'w', encoding='utf-8').write(f)
print('done')
