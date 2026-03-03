import io
schema = """type Pair @entity {
  id: ID!
  token0: Token!
  token1: Token!
  reserve0: BigDecimal!
  reserve1: BigDecimal!
  totalSupply: BigDecimal!
  token0Price: BigDecimal!
  token1Price: BigDecimal!
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  volumeUSD: BigDecimal!
  txCount: BigInt!
  createdAtTimestamp: BigInt!
  createdAtBlockNumber: BigInt!
  pairDayData: [PairDayData!]! @derivedFrom(field: "pair")
  mints: [Mint!]! @derivedFrom(field: "pair")
  burns: [Burn!]! @derivedFrom(field: "pair")
  swaps: [Swap!]! @derivedFrom(field: "pair")
}

type Token @entity {
  id: ID!
  symbol: String!
  name: String!
  decimals: BigInt!
  totalSupply: BigDecimal!
  tradeVolume: BigDecimal!
  txCount: BigInt!
  poolCount: BigInt!
  priceUSD: BigDecimal!
}

type MintondexDayData @entity {
  id: ID!
  date: Int!
  volumeUSD: BigDecimal!
  tvlUSD: BigDecimal!
  txCount: BigInt!
}

type PairDayData @entity {
  id: ID!
  date: Int!
  pair: Pair!
  reserve0: BigDecimal!
  reserve1: BigDecimal!
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  volumeUSD: BigDecimal!
  txCount: BigInt!
}

type Mint @entity {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0: BigDecimal!
  amount1: BigDecimal!
  amountUSD: BigDecimal!
  logIndex: BigInt
}

type Burn @entity {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0: BigDecimal!
  amount1: BigDecimal!
  amountUSD: BigDecimal!
  logIndex: BigInt
}

type Swap @entity {
  id: ID!
  pair: Pair!
  timestamp: BigInt!
  sender: Bytes!
  amount0In: BigDecimal!
  amount1In: BigDecimal!
  amount0Out: BigDecimal!
  amount1Out: BigDecimal!
  amountUSD: BigDecimal!
  to: Bytes!
  logIndex: BigInt
}
"""
with io.open("C:/mintondex/subgraph/schema.graphql","w",encoding="utf-8") as f:
    f.write(schema)
print("saved schema.graphql")
