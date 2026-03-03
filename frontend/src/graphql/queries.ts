import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";

export const SUBGRAPH_URL = "https://api.goldsky.com/api/public/project_cmmae7z9keb2y010gd66x6jo1/subgraphs/mintondex/v0.0.2/gn";

export const client = new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URL }),
  cache: new InMemoryCache()
});

export const POOLS_QUERY = gql`
  query GetPools($skip: Int, $first: Int) {
    pools(first: $first, skip: $skip, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 { id symbol name decimals priceUSD }
      token1 { id symbol name decimals priceUSD }
      feeTier liquidity token0Price token1Price
      volumeUSD txCount totalValueLockedUSD
      totalValueLockedToken0 totalValueLockedToken1 createdAtTimestamp
    }
  }
`;

export const POOL_DETAIL_QUERY = gql`
  query GetPool($id: ID!) {
    pool(id: $id) {
      id
      token0 { id symbol name decimals priceUSD volume txCount }
      token1 { id symbol name decimals priceUSD volume txCount }
      feeTier liquidity sqrtPrice tick token0Price token1Price
      volumeUSD txCount totalValueLockedUSD
      totalValueLockedToken0 totalValueLockedToken1 createdAtTimestamp
    }
  }
`;

export const POOL_DAY_DATA_QUERY = gql`
  query GetPoolDayData($poolId: String!, $startTime: Int!) {
    poolDayDatas(first: 90, orderBy: date, orderDirection: asc,
      where: { pool: $poolId, date_gt: $startTime }) {
      date liquidity sqrtPrice token0Price token1Price
      tvlUSD volumeUSD txCount open high low close
    }
  }
`;

export const POOL_HOUR_DATA_QUERY = gql`
  query GetPoolHourData($poolId: String!, $startTime: Int!) {
    poolHourDatas(first: 168, orderBy: periodStartUnix, orderDirection: asc,
      where: { pool: $poolId, periodStartUnix_gt: $startTime }) {
      periodStartUnix liquidity token0Price token1Price
      tvlUSD volumeUSD txCount open high low close
    }
  }
`;

export const RECENT_SWAPS_QUERY = gql`
  query GetRecentSwaps($poolId: String!, $first: Int) {
    swaps(first: $first, orderBy: timestamp, orderDirection: desc,
      where: { pool: $poolId }) {
      id timestamp sender recipient amount0 amount1 amountUSD tick
    }
  }
`;

export const LP_POSITIONS_QUERY = gql`
  query GetLPPositions($poolId: String!) {
    mints(first: 50, orderBy: timestamp, orderDirection: desc, where: { pool: $poolId }) {
      id timestamp owner amount amount0 amount1 amountUSD tickLower tickUpper
    }
    burns(first: 50, orderBy: timestamp, orderDirection: desc, where: { pool: $poolId }) {
      id timestamp owner amount amount0 amount1 amountUSD tickLower tickUpper
    }
  }
`;

export const TOKENS_QUERY = gql`
  query GetTokens {
    tokens(first: 50, orderBy: volume, orderDirection: desc) {
      id symbol name decimals priceUSD volume txCount poolCount
    }
  }
`;

export const PROTOCOL_DAY_DATA_QUERY = gql`
  query GetProtocolDayData($startTime: Int!) {
    mintondexDayDatas(first: 90, orderBy: date, orderDirection: asc,
      where: { date_gt: $startTime }) {
      date volumeUSD tvlUSD txCount feesUSD
    }
  }
`;

export const COINGECKO_PAIRS_QUERY = gql`
  query CoinGeckoPairs {
    pools(first: 100, orderBy: volumeUSD, orderDirection: desc) {
      id
      token0 { id symbol name decimals totalSupply priceUSD }
      token1 { id symbol name decimals totalSupply priceUSD }
      feeTier liquidity token0Price token1Price
      volumeUSD txCount totalValueLockedUSD
      totalValueLockedToken0 totalValueLockedToken1 createdAtTimestamp
    }
  }
`;
