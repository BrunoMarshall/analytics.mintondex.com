import { PoolCreated } from "../generated/Factory/Factory";
import { Pool as PoolTemplate } from "../generated/templates";
import { Pool, Token } from "../generated/schema";
import { ERC20 } from "../generated/Factory/ERC20";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let result = contract.try_symbol();
  return result.reverted ? "UNKNOWN" : result.value;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let result = contract.try_name();
  return result.reverted ? "Unknown Token" : result.value;
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress);
  let result = contract.try_decimals();
  return result.reverted ? BigInt.fromI32(18) : BigInt.fromI32(result.value);
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigDecimal {
  let contract = ERC20.bind(tokenAddress);
  let result = contract.try_totalSupply();
  if (result.reverted) return BigDecimal.fromString("0");
  let decimals = fetchTokenDecimals(tokenAddress);
  let bd = BigDecimal.fromString("1");
  for (let i = 0; i < decimals.toI32(); i++) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return result.value.toBigDecimal().div(bd);
}

function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (token === null) {
    token = new Token(address.toHexString());
    token.symbol = fetchTokenSymbol(address);
    token.name = fetchTokenName(address);
    token.decimals = fetchTokenDecimals(address);
    token.totalSupply = fetchTokenTotalSupply(address);
    token.priceUSD = BigDecimal.fromString("0");
    token.volume = BigDecimal.fromString("0");
    token.txCount = BigInt.fromI32(0);
    token.poolCount = BigInt.fromI32(0);
    token.save();
  }
  return token as Token;
}

export function handlePoolCreated(event: PoolCreated): void {
  let token0 = getOrCreateToken(event.params.token0);
  let token1 = getOrCreateToken(event.params.token1);
  token0.poolCount = token0.poolCount.plus(BigInt.fromI32(1));
  token1.poolCount = token1.poolCount.plus(BigInt.fromI32(1));
  token0.save();
  token1.save();

  let pool = new Pool(event.params.pool.toHexString());
  pool.token0 = token0.id;
  pool.token1 = token1.id;
  pool.feeTier = BigInt.fromI32(event.params.fee);
  pool.liquidity = BigDecimal.fromString("0");
  pool.sqrtPrice = BigInt.fromI32(0);
  pool.tick = BigInt.fromI32(0);
  pool.token0Price = BigDecimal.fromString("0");
  pool.token1Price = BigDecimal.fromString("0");
  pool.volumeUSD = BigDecimal.fromString("0");
  pool.txCount = BigInt.fromI32(0);
  pool.totalValueLockedUSD = BigDecimal.fromString("0");
  pool.totalValueLockedToken0 = BigDecimal.fromString("0");
  pool.totalValueLockedToken1 = BigDecimal.fromString("0");
  pool.createdAtTimestamp = event.block.timestamp;
  pool.createdAtBlockNumber = event.block.number;
  pool.save();

  PoolTemplate.create(event.params.pool);
}
