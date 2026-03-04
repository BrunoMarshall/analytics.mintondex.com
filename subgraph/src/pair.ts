import { Swap as SwapEvent, Mint as MintEvent, Burn as BurnEvent, Sync as SyncEvent } from "../generated/templates/Pair/Pair";
import { Pair, Token, Swap, Mint, Burn, PairDayData, MintondexDayData, TokenDayData } from "../generated/schema";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

const ZERO_BD = BigDecimal.fromString("0");
const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";

function convertToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  if (decimals.equals(BigInt.fromI32(0))) return amount.toBigDecimal();
  let bd = BigDecimal.fromString("1");
  for (let i = 0; i < decimals.toI32(); i++) { bd = bd.times(BigDecimal.fromString("10")); }
  return amount.toBigDecimal().div(bd);
}

function getSHMPrice(): BigDecimal { return BigDecimal.fromString("1"); }

function getTokenPriceUSD(tokenId: string, pair: Pair): BigDecimal {
  if (tokenId == WSHM) return getSHMPrice();
  // token0Price = reserve0/reserve1 = token0 per token1
  // token1Price = reserve1/reserve0 = token1 per token0
  // If token1 is WSHM: price of token0 in WSHM = token1Price (WSHM per token0)
  if (pair.token1 == WSHM) return pair.token1Price.times(getSHMPrice());
  // If token0 is WSHM: price of token1 in WSHM = token0Price (token0 per token1... no, token0Price = reserve0/reserve1)
  // token0Price = WSHM/token1 = how much WSHM per token1
  if (pair.token0 == WSHM) return pair.token0Price.times(getSHMPrice());
  return ZERO_BD;
}

function updatePairDayData(timestamp: BigInt, pair: Pair, volumeUSD: BigDecimal): PairDayData {
  let dayIndex = timestamp.toI32() / 86400;
  let id = pair.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());
  let d = PairDayData.load(id);
  if (d === null) {
    d = new PairDayData(id); d.date = dayIndex * 86400; d.pair = pair.id;
    d.volumeToken0 = ZERO_BD; d.volumeToken1 = ZERO_BD;
    d.volumeUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);
  }
  d.reserve0 = pair.reserve0; d.reserve1 = pair.reserve1; d.volumeUSD = d.volumeUSD.plus(volumeUSD); d.save();
  return d as PairDayData;
}

function updateProtocolDayData(timestamp: BigInt, volumeUSD: BigDecimal, tvlUSD: BigDecimal): void {
  let dayIndex = timestamp.toI32() / 86400;
  let id = BigInt.fromI32(dayIndex).toString();
  let d = MintondexDayData.load(id);
  if (d === null) {
    d = new MintondexDayData(id); d.date = dayIndex * 86400;
    d.volumeUSD = ZERO_BD; d.tvlUSD = ZERO_BD; d.txCount = BigInt.fromI32(0);
  }
  d.tvlUSD = tvlUSD;
  d.volumeUSD = d.volumeUSD.plus(volumeUSD);
  d.txCount = d.txCount.plus(BigInt.fromI32(1));
  d.save();
}

function updateTokenDayData(token: Token, timestamp: BigInt, volumeUSD: BigDecimal, tvlUSD: BigDecimal): void {
  let dayIndex = timestamp.toI32() / 86400;
  let id = token.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());
  let d = TokenDayData.load(id);
  if (d === null) {
    d = new TokenDayData(id);
    d.date = dayIndex * 86400;
    d.token = token.id;
    d.volumeUSD = ZERO_BD;
    d.tvlUSD = ZERO_BD;
    d.txCount = BigInt.fromI32(0);
  }
  d.priceUSD = token.priceUSD;
  d.tvlUSD = tvlUSD;
  d.tvlUSD = tvlUSD;
  d.volumeUSD = d.volumeUSD.plus(volumeUSD);
  d.txCount = d.txCount.plus(BigInt.fromI32(1));
  d.save();
}

export function handleSync(event: SyncEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  pair.reserve0 = convertToDecimal(event.params.reserve0, t0.decimals);
  pair.reserve1 = convertToDecimal(event.params.reserve1, t1.decimals);
  if (!pair.reserve1.equals(ZERO_BD)) pair.token0Price = pair.reserve0.div(pair.reserve1);
  else pair.token0Price = ZERO_BD;
  if (!pair.reserve0.equals(ZERO_BD)) pair.token1Price = pair.reserve1.div(pair.reserve0);
  else pair.token1Price = ZERO_BD;
  t0.priceUSD = getTokenPriceUSD(t0.id, pair as Pair);
  t1.priceUSD = getTokenPriceUSD(t1.id, pair as Pair);
  t0.save(); t1.save(); pair.save();
  let tvl0 = pair.reserve0.times(t0.priceUSD);
  let tvl1 = pair.reserve1.times(t1.priceUSD);
  updateTokenDayData(t0 as Token, event.block.timestamp, ZERO_BD, tvl0);
  updateTokenDayData(t1 as Token, event.block.timestamp, ZERO_BD, tvl1);
  let pairTVL = pair.reserve1.times(BigDecimal.fromString("2"));
  updateProtocolDayData(event.block.timestamp, ZERO_BD, pairTVL);
  updatePairDayData(event.block.timestamp, pair as Pair, ZERO_BD);
}

export function handleMint(event: MintEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  let amt0 = convertToDecimal(event.params.amount0, t0.decimals);
  let amt1 = convertToDecimal(event.params.amount1, t1.decimals);
  let amtUSD = amt0.times(t0.priceUSD).plus(amt1.times(t1.priceUSD));
  pair.txCount = pair.txCount.plus(BigInt.fromI32(1)); pair.save();
  let mint = new Mint(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  mint.pair = pair.id; mint.timestamp = event.block.timestamp;
  mint.sender = event.params.sender; mint.amount0 = amt0; mint.amount1 = amt1;
  mint.amountUSD = amtUSD; mint.logIndex = event.logIndex; mint.save();
  updateProtocolDayData(event.block.timestamp, ZERO_BD, ZERO_BD);
}

export function handleBurn(event: BurnEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  let amt0 = convertToDecimal(event.params.amount0, t0.decimals);
  let amt1 = convertToDecimal(event.params.amount1, t1.decimals);
  let amtUSD = amt0.times(t0.priceUSD).plus(amt1.times(t1.priceUSD));
  pair.txCount = pair.txCount.plus(BigInt.fromI32(1)); pair.save();
  let burn = new Burn(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  burn.pair = pair.id; burn.timestamp = event.block.timestamp;
  burn.sender = event.params.sender; burn.amount0 = amt0; burn.amount1 = amt1;
  burn.amountUSD = amtUSD; burn.logIndex = event.logIndex; burn.save();
  updateProtocolDayData(event.block.timestamp, ZERO_BD, ZERO_BD);
}

export function handleSwap(event: SwapEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (pair === null) return;
  let t0 = Token.load(pair.token0); let t1 = Token.load(pair.token1);
  if (t0 === null || t1 === null) return;
  let amt0In = convertToDecimal(event.params.amount0In, t0.decimals);
  let amt1In = convertToDecimal(event.params.amount1In, t1.decimals);
  let amt0Out = convertToDecimal(event.params.amount0Out, t0.decimals);
  let amt1Out = convertToDecimal(event.params.amount1Out, t1.decimals);
  let vol0 = amt0In.plus(amt0Out); let vol1 = amt1In.plus(amt1Out);
  let volumeUSD = vol0.times(t0.priceUSD);
  if (volumeUSD.equals(ZERO_BD)) volumeUSD = vol1.times(t1.priceUSD);
  pair.volumeToken0 = pair.volumeToken0.plus(vol0);
  pair.volumeToken1 = pair.volumeToken1.plus(vol1);
  pair.volumeUSD = pair.volumeUSD.plus(volumeUSD);
  pair.txCount = pair.txCount.plus(BigInt.fromI32(1));
  t0.tradeVolume = t0.tradeVolume.plus(vol0); t0.txCount = t0.txCount.plus(BigInt.fromI32(1));
  t1.tradeVolume = t1.tradeVolume.plus(vol1); t1.txCount = t1.txCount.plus(BigInt.fromI32(1));
  t0.save(); t1.save(); pair.save();
  let tvl0 = pair.reserve0.times(t0.priceUSD);
  let tvl1 = pair.reserve1.times(t1.priceUSD);
  updateTokenDayData(t0 as Token, event.block.timestamp, ZERO_BD, tvl0);
  updateTokenDayData(t1 as Token, event.block.timestamp, ZERO_BD, tvl1);
  let swap = new Swap(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  swap.pair = pair.id; swap.timestamp = event.block.timestamp;
  swap.sender = event.params.sender; swap.to = event.params.to;
  swap.amount0In = amt0In; swap.amount1In = amt1In;
  swap.amount0Out = amt0Out; swap.amount1Out = amt1Out;
  swap.amountUSD = volumeUSD; swap.logIndex = event.logIndex; swap.save();
  let swapPairTVL = pair.reserve1.times(BigDecimal.fromString("2"));
  updateProtocolDayData(event.block.timestamp, volumeUSD, swapPairTVL);
  updatePairDayData(event.block.timestamp, pair as Pair, volumeUSD);
}
