import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";

export const SUBGRAPH_URL = "https://graph.analytics.mintondex.com/subgraphs/name/mintondex-v2";

export const client = new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URL }),
  cache: new InMemoryCache()
});

export const POOLS_QUERY = gql`
  query GetPools($skip: Int, $first: Int) {
    pairs(first: $first, skip: $skip, orderBy: volumeUSD, orderDirection: desc) {
      id
      token0 { id symbol name decimals priceUSD }
      token1 { id symbol name decimals priceUSD }
      reserve0 reserve1 token0Price token1Price
      volumeUSD volumeToken0 volumeToken1 txCount
      totalSupply createdAtTimestamp
    }
  }
`;

export const POOL_DETAIL_QUERY = gql`
  query GetPool($id: ID!) {
    pair(id: $id) {
      id
      token0 { id symbol name decimals priceUSD txCount tradeVolume }
      token1 { id symbol name decimals priceUSD txCount tradeVolume }
      reserve0 reserve1 token0Price token1Price
      volumeUSD volumeToken0 volumeToken1 txCount
      totalSupply createdAtTimestamp
    }
  }
`;

export const POOL_DAY_DATA_QUERY = gql`
  query GetPoolDayData($poolId: String!, $startTime: Int!) {
    pairDayDatas(first: 90, orderBy: date, orderDirection: asc,
      where: { pair: $poolId, date_gt: $startTime }) {
      date reserve0 reserve1 volumeUSD txCount
    }
  }
`

export const RECENT_SWAPS_QUERY = gql`
  query GetRecentSwaps($poolId: String!, $first: Int) {
    swaps(first: $first, orderBy: timestamp, orderDirection: desc,
      where: { pair: $poolId }) {
      id timestamp sender to
      amount0In amount1In amount0Out amount1Out amountUSD
    }
  }
`;

export const LP_POSITIONS_QUERY = gql`
  query GetLPPositions($poolId: String!) {
    mints(first: 100, orderBy: timestamp, orderDirection: desc, where: { pair: $poolId }) {
      id timestamp sender amount0 amount1 amountUSD logIndex
    }
    burns(first: 100, orderBy: timestamp, orderDirection: desc, where: { pair: $poolId }) {
      id timestamp sender amount0 amount1 amountUSD logIndex
    }
  }
`;

export const TOKENS_QUERY = gql`
  query GetTokens {
    tokens(first: 50, orderBy: tradeVolume, orderDirection: desc) {
      id symbol name decimals priceUSD tradeVolume txCount poolCount totalSupply
    }
  }
`;

export const PROTOCOL_DAY_DATA_QUERY = gql`
  query GetProtocolDayData($startTime: Int!) {
    mintondexDayDatas(first: 90, orderBy: date, orderDirection: asc,
      where: { date_gt: $startTime }) {
      date volumeUSD tvlUSD txCount
    }
  }
`;

export const TOKEN_DAY_DATA_QUERY = gql`
  query GetTokenDayData($tokenId: String!, $startTime: Int!) {
    tokenDayDatas(first: 90, orderBy: date, orderDirection: asc,
      where: { token: $tokenId, date_gt: $startTime }) {
      date priceUSD volumeUSD tvlUSD txCount
    }
  }
`;

export const TOKEN_DETAIL_QUERY = gql`
  query GetToken($id: ID!) {
    token(id: $id) {
      id symbol name decimals totalSupply
      priceUSD tradeVolume txCount poolCount
      pairsBase(first: 10, orderBy: volumeUSD, orderDirection: desc) {
        id reserve0 reserve1 token0Price token1Price volumeUSD txCount
        token0 { id symbol }
        token1 { id symbol }
      }
      pairsQuote(first: 10, orderBy: volumeUSD, orderDirection: desc) {
        id reserve0 reserve1 token0Price token1Price volumeUSD txCount
        token0 { id symbol }
        token1 { id symbol }
      }
    }
  }
`;

export const ALL_PAIRS_DAY_DATA_QUERY = gql`
  query GetAllPairsDayData($startTime: Int!) {
    pairDayDatas(first: 1000, orderBy: date, orderDirection: asc,
      where: { date_gt: $startTime }) {
      date
      reserve0
      reserve1
      pair { token0 { id } token1 { id } token0Price token1Price }
    }
  }
`;

export const ALL_PAIR_DAY_DATA_FOR_TOKEN_QUERY = gql`
  query GetPairDayDataForToken($pairIds: [String!]!, $startTime: Int!) {
    pairDayDatas(first: 1000, orderBy: date, orderDirection: asc,
      where: { pair_in: $pairIds, date_gt: $startTime }) {
      date reserve0 reserve1
      pair { id token0 { id } token1 { id } }
    }
  }
`;
