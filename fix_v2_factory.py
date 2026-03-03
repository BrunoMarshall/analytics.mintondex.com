import io
content = """import { PairCreated } from "../generated/Factory/Factory";
import { Pair as PairTemplate } from "../generated/templates";
import { Pair, Token } from "../generated/schema";
import { ERC20 } from "../generated/Factory/ERC20";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

function fetchSymbol(addr: Address): string {
  let c = ERC20.bind(addr); let r = c.try_symbol(); return r.reverted ? "UNKNOWN" : r.value;
}
function fetchName(addr: Address): string {
  let c = ERC20.bind(addr); let r = c.try_name(); return r.reverted ? "Unknown" : r.value;
}
function fetchDecimals(addr: Address): BigInt {
  let c = ERC20.bind(addr); let r = c.try_decimals(); return r.reverted ? BigInt.fromI32(18) : BigInt.fromI32(r.value);
}
function fetchTotalSupply(addr: Address): BigDecimal {
  let c = ERC20.bind(addr); let r = c.try_totalSupply();
  if (r.reverted) return BigDecimal.fromString("0");
  let dec = fetchDecimals(addr); let bd = BigDecimal.fromString("1");
  for (let i = 0; i < dec.toI32(); i++) { bd = bd.times(BigDecimal.fromString("10")); }
  return r.value.toBigDecimal().div(bd);
}
function getOrCreateToken(addr: Address): Token {
  let t = Token.load(addr.toHexString());
  if (t === null) {
    t = new Token(addr.toHexString());
    t.symbol = fetchSymbol(addr); t.name = fetchName(addr);
    t.decimals = fetchDecimals(addr); t.totalSupply = fetchTotalSupply(addr);
    t.tradeVolume = BigDecimal.fromString("0"); t.txCount = BigInt.fromI32(0);
    t.poolCount = BigInt.fromI32(0); t.priceUSD = BigDecimal.fromString("0");
    t.save();
  }
  return t as Token;
}
export function handlePairCreated(event: PairCreated): void {
  let t0 = getOrCreateToken(event.params.token0);
  let t1 = getOrCreateToken(event.params.token1);
  t0.poolCount = t0.poolCount.plus(BigInt.fromI32(1)); t0.save();
  t1.poolCount = t1.poolCount.plus(BigInt.fromI32(1)); t1.save();
  let pair = new Pair(event.params.pair.toHexString());
  pair.token0 = t0.id; pair.token1 = t1.id;
  pair.reserve0 = BigDecimal.fromString("0"); pair.reserve1 = BigDecimal.fromString("0");
  pair.totalSupply = BigDecimal.fromString("0");
  pair.token0Price = BigDecimal.fromString("0"); pair.token1Price = BigDecimal.fromString("0");
  pair.volumeToken0 = BigDecimal.fromString("0"); pair.volumeToken1 = BigDecimal.fromString("0");
  pair.volumeUSD = BigDecimal.fromString("0"); pair.txCount = BigInt.fromI32(0);
  pair.createdAtTimestamp = event.block.timestamp;
  pair.createdAtBlockNumber = event.block.number;
  pair.save();
  PairTemplate.create(event.params.pair);
}
"""
with io.open("C:/mintondex/subgraph/src/factory.ts","w",encoding="utf-8") as f:
    f.write(content)
print("saved factory.ts")
