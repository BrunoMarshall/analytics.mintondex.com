import { Swap as SwapEvent, Mint as MintEvent, Burn as BurnEvent } from "../generated/templates/Pool/Pool";
import { Pool, Token, Swap, Mint, Burn, PoolDayData, PoolHourData, Transaction, MintondexDayData } from "../generated/schema";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

// Mintondex on Shardeum — real addresses
const WSHM_ADDRESS = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";
const USDC_ADDRESS = "0x0000000000000000000000000000000000000000";
const WSHM_USDC_POOL = "0x0000000000000000000000000000000000000000";

const ZERO_BD = BigDecimal.fromString("0");
const ONE_BD = BigDecimal.fromString("1");
const Q192 = BigDecimal.fromString("6277101735386680763835789423207666416102355444464034512896");

function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = 0; i < decimals.toI32(); i++) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, dec0: BigInt, dec1: BigInt): BigDecimal[] {
  let num = sqrtPriceX96.toBigDecimal().times(sqrtPriceX96.toBigDecimal());
  let price1 = num.div(Q192).times(exponentToBigDecimal(dec0)).div(exponentToBigDecimal(dec1));
  let price0 = price1.equals(ZERO_BD) ? ZERO_BD : ONE_BD.div(price1);
  return [price0, price1];
}

function getSHMPriceUSD(): BigDecimal {
  // No stable pool on Shardeum yet.
  // Subgraph stores token ratios in WSHM terms.
  // The frontend fetches live SHM/USD from CoinGecko and applies the conversion.
  return ONE_BD;
}

function getTokenPriceUSD(tokenId: string, pool: Pool): BigDecimal {
  let shmPrice = getSHMPriceUSD();
  if (tokenId == WSHM_ADDRESS) return shmPrice;
  if (tokenId == USDC_ADDRESS) return ONE_BD;
  if (pool.token0 == WSHM_ADDRESS) return pool.token1Price.times(shmPrice);
  if (pool.token1 == WSHM_ADDRESS) return pool.token0Price.times(shmPrice);
  if (pool.token0 == USDC_ADDRESS) return pool.token1Price;
  if (pool.token1 == USDC_ADDRESS) return pool.token0Price;
  return ZERO_BD;
}

function convertTokenToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  if (decimals.equals(BigInt.fromI32(0))) return amount.toBigDecimal();
  return amount.toBigDecimal().div(exponentToBigDecimal(decimals));
}

function getOrCreateTransaction(event: ethereum.Event): Transaction {
  let tx = Transaction.load(event.transaction.hash.toHexString());
  if (tx === null) {
    tx = new Transaction(event.transaction.hash.toHexString());
    tx.blockNumber = event.block.number;
    tx.timestamp = event.block.timestamp;
    tx.gasUsed = event.transaction.gasLimit;
    tx.gasPrice = event.transaction.gasPrice;
    tx.swaps = [];
    tx.mints = [];
    tx.burns = [];
    tx.save();
  }
  return tx as Transaction;
}

function updatePoolDayData(event: ethereum.Event, pool: Pool): PoolDayData {
  let dayIndex = event.block.timestamp.toI32() / 86400;
  let id = pool.id.concat("-").concat(BigInt.fromI32(dayIndex).toString());
  let d = PoolDayData.load(id);
  if (d === null) {
    d = new PoolDayData(id);
    d.date = dayIndex * 86400;
    d.pool = pool.id;
    d.volumeUSD = ZERO_BD;
    d.txCount = BigInt.fromI32(0);
    d.open = pool.token0Price;
    d.high = pool.token0Price;
    d.low = pool.token0Price;
    d.close = pool.token0Price;
  }
  if (pool.token0Price.gt(d.high)) d.high = pool.token0Price;
  if (pool.token0Price.lt(d.low) && pool.token0Price.gt(ZERO_BD)) d.low = pool.token0Price;
  d.close = pool.token0Price;
  d.liquidity = pool.liquidity;
  d.sqrtPrice = pool.sqrtPrice;
  d.token0Price = pool.token0Price;
  d.token1Price = pool.token1Price;
  d.tvlUSD = pool.totalValueLockedUSD;
  d.save();
  return d as PoolDayData;
}

function updatePoolHourData(event: ethereum.Event, pool: Pool): PoolHourData {
  let hourIndex = event.block.timestamp.toI32() / 3600;
  let id = pool.id.concat("-h-").concat(BigInt.fromI32(hourIndex).toString());
  let h = PoolHourData.load(id);
  if (h === null) {
    h = new PoolHourData(id);
    h.periodStartUnix = hourIndex * 3600;
    h.pool = pool.id;
    h.volumeUSD = ZERO_BD;
    h.txCount = BigInt.fromI32(0);
    h.open = pool.token0Price;
    h.high = pool.token0Price;
    h.low = pool.token0Price;
    h.close = pool.token0Price;
  }
  if (pool.token0Price.gt(h.high)) h.high = pool.token0Price;
  if (pool.token0Price.lt(h.low) && pool.token0Price.gt(ZERO_BD)) h.low = pool.token0Price;
  h.close = pool.token0Price;
  h.liquidity = pool.liquidity;
  h.sqrtPrice = pool.sqrtPrice;
  h.token0Price = pool.token0Price;
  h.token1Price = pool.token1Price;
  h.tvlUSD = pool.totalValueLockedUSD;
  h.save();
  return h as PoolHourData;
}

function updateProtocolDayData(event: ethereum.Event): MintondexDayData {
  let dayIndex = event.block.timestamp.toI32() / 86400;
  let id = BigInt.fromI32(dayIndex).toString();
  let d = MintondexDayData.load(id);
  if (d === null) {
    d = new MintondexDayData(id);
    d.date = dayIndex * 86400;
    d.volumeUSD = ZERO_BD;
    d.tvlUSD = ZERO_BD;
    d.txCount = BigInt.fromI32(0);
    d.feesUSD = ZERO_BD;
  }
  d.save();
  return d as MintondexDayData;
}

export function handleSwap(event: SwapEvent): void {
  let pool = Pool.load(event.address.toHexString());
  if (pool === null) return;
  let token0 = Token.load(pool.token0);
  let token1 = Token.load(pool.token1);
  if (token0 === null || token1 === null) return;

  pool.sqrtPrice = event.params.sqrtPriceX96;
  pool.tick = BigInt.fromI32(event.params.tick);
  let prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96, token0.decimals, token1.decimals);
  pool.token0Price = prices[0];
  pool.token1Price = prices[1];
  token0.priceUSD = getTokenPriceUSD(token0.id, pool as Pool);
  token1.priceUSD = getTokenPriceUSD(token1.id, pool as Pool);

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals);
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals);
  let abs0 = amount0.lt(ZERO_BD) ? amount0.neg() : amount0;
  let abs1 = amount1.lt(ZERO_BD) ? amount1.neg() : amount1;
  let volumeUSD = abs0.times(token0.priceUSD);
  if (volumeUSD.equals(ZERO_BD)) volumeUSD = abs1.times(token1.priceUSD);
  let feeUSD = volumeUSD.times(pool.feeTier.toBigDecimal().div(BigDecimal.fromString("1000000")));

  pool.volumeUSD = pool.volumeUSD.plus(volumeUSD);
  pool.txCount = pool.txCount.plus(BigInt.fromI32(1));
  token0.volume = token0.volume.plus(abs0);
  token1.volume = token1.volume.plus(abs1);
  token0.txCount = token0.txCount.plus(BigInt.fromI32(1));
  token1.txCount = token1.txCount.plus(BigInt.fromI32(1));

  let tx = getOrCreateTransaction(event);
  let swap = new Swap(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  swap.pool = pool.id;
  swap.timestamp = event.block.timestamp;
  swap.sender = event.params.sender;
  swap.recipient = event.params.recipient;
  swap.amount0 = amount0;
  swap.amount1 = amount1;
  swap.amountUSD = volumeUSD;
  swap.sqrtPriceX96 = event.params.sqrtPriceX96;
  swap.tick = BigInt.fromI32(event.params.tick);
  swap.logIndex = event.logIndex;
  swap.save();
  let swaps = tx.swaps; swaps.push(swap.id); tx.swaps = swaps; tx.save();

  let day = updatePoolDayData(event, pool as Pool);
  day.volumeUSD = day.volumeUSD.plus(volumeUSD);
  day.txCount = day.txCount.plus(BigInt.fromI32(1));
  day.save();
  let hour = updatePoolHourData(event, pool as Pool);
  hour.volumeUSD = hour.volumeUSD.plus(volumeUSD);
  hour.txCount = hour.txCount.plus(BigInt.fromI32(1));
  hour.save();
  let pday = updateProtocolDayData(event);
  pday.volumeUSD = pday.volumeUSD.plus(volumeUSD);
  pday.feesUSD = pday.feesUSD.plus(feeUSD);
  pday.txCount = pday.txCount.plus(BigInt.fromI32(1));
  pday.save();

  token0.save(); token1.save(); pool.save();
}

export function handleMint(event: MintEvent): void {
  let pool = Pool.load(event.address.toHexString());
  if (pool === null) return;
  let token0 = Token.load(pool.token0);
  let token1 = Token.load(pool.token1);
  if (token0 === null || token1 === null) return;

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals);
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals);
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0);
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1);
  pool.liquidity = pool.liquidity.plus(event.params.amount.toBigDecimal());
  pool.txCount = pool.txCount.plus(BigInt.fromI32(1));
  pool.totalValueLockedUSD = pool.totalValueLockedToken0.times(token0.priceUSD)
    .plus(pool.totalValueLockedToken1.times(token1.priceUSD));

  let amountUSD = amount0.times(token0.priceUSD).plus(amount1.times(token1.priceUSD));
  let tx = getOrCreateTransaction(event);
  let mint = new Mint(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  mint.pool = pool.id;
  mint.timestamp = event.block.timestamp;
  mint.owner = event.params.owner;
  mint.sender = event.params.sender;
  mint.origin = event.transaction.from;
  mint.amount = event.params.amount.toBigDecimal();
  mint.amount0 = amount0;
  mint.amount1 = amount1;
  mint.amountUSD = amountUSD;
  mint.tickLower = BigInt.fromI32(event.params.tickLower);
  mint.tickUpper = BigInt.fromI32(event.params.tickUpper);
  mint.logIndex = event.logIndex;
  mint.save();
  let mints = tx.mints; mints.push(mint.id); tx.mints = mints; tx.save();

  updatePoolDayData(event, pool as Pool);
  updatePoolHourData(event, pool as Pool);
  updateProtocolDayData(event);
  pool.save();
}

export function handleBurn(event: BurnEvent): void {
  let pool = Pool.load(event.address.toHexString());
  if (pool === null) return;
  let token0 = Token.load(pool.token0);
  let token1 = Token.load(pool.token1);
  if (token0 === null || token1 === null) return;

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals);
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals);
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(amount0);
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(amount1);
  pool.liquidity = pool.liquidity.minus(event.params.amount.toBigDecimal());
  pool.txCount = pool.txCount.plus(BigInt.fromI32(1));
  pool.totalValueLockedUSD = pool.totalValueLockedToken0.times(token0.priceUSD)
    .plus(pool.totalValueLockedToken1.times(token1.priceUSD));

  let amountUSD = amount0.times(token0.priceUSD).plus(amount1.times(token1.priceUSD));
  let tx = getOrCreateTransaction(event);
  let burn = new Burn(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  burn.pool = pool.id;
  burn.timestamp = event.block.timestamp;
  burn.owner = event.params.owner;
  burn.origin = event.transaction.from;
  burn.amount = event.params.amount.toBigDecimal();
  burn.amount0 = amount0;
  burn.amount1 = amount1;
  burn.amountUSD = amountUSD;
  burn.tickLower = BigInt.fromI32(event.params.tickLower);
  burn.tickUpper = BigInt.fromI32(event.params.tickUpper);
  burn.logIndex = event.logIndex;
  burn.save();
  let burns = tx.burns; burns.push(burn.id); tx.burns = burns; tx.save();

  updatePoolDayData(event, pool as Pool);
  updatePoolHourData(event, pool as Pool);
  updateProtocolDayData(event);
  pool.save();
}