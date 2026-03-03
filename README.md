# Mintondex Analytics Portal
analytics.mintondex.com | Real-time DEX analytics on Shardeum

## Quick Start (3 steps)

### 1. Configure addresses
- subgraph/subgraph.yaml line 7: replace 0xYOUR_FACTORY_ADDRESS_HERE
- subgraph/src/pool.ts lines 5-7: replace WSHM, USDC, WSHM_USDC_POOL addresses

### 2. Deploy Subgraph (The Graph)
cd subgraph
npm install
npm install -g @graphprotocol/graph-cli
graph auth --product hosted-service YOUR_ACCESS_TOKEN
graph codegen && graph build
graph deploy --product hosted-service BrunoMarshall/mintondex

Your endpoint: https://api.thegraph.com/subgraphs/name/BrunoMarshall/mintondex

### 3. Run Frontend Locally
cd frontend
cp env.example .env.local
(edit .env.local - set REACT_APP_SUBGRAPH_URL to your endpoint above)
npm install
npm start
(opens http://localhost:3000)

### 4. Build for Production
cd frontend && npm run build
(output in frontend/build/)

## Deploy to Contabo VPS

ssh root@YOUR_VPS_IP
apt update && apt install nginx git certbot python3-certbot-nginx -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install nodejs -y

git clone https://github.com/BrunoMarshall/analytics.mintondex.com /var/www/analytics-src
cd /var/www/analytics-src/frontend
cp env.example .env.local
nano .env.local  (set your subgraph URL)
npm install && npm run build

mkdir -p /var/www/analytics.mintondex.com
cp -r build/* /var/www/analytics.mintondex.com/

Copy nginx_config.txt content to: /etc/nginx/sites-available/analytics.mintondex.com
ln -s /etc/nginx/sites-available/analytics.mintondex.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d analytics.mintondex.com

## Namecheap DNS Setup

1. Login to Namecheap -> Domain List -> Manage mintondex.com
2. Advanced DNS tab -> Add New Record:
   Type:  A Record
   Host:  analytics
   Value: YOUR_CONTABO_VPS_IP
   TTL:   Automatic
3. Wait 5-30 min for propagation

## Git Commit (Git Bash on Windows)

cd "C:/Users/User/OneDrive/Área de Trabalho/Shardeum projects/analytics_mintondex_com"
git init
git remote add origin https://github.com/BrunoMarshall/analytics.mintondex.com.git
git add .
git commit -m "feat: complete analytics portal - subgraph + React frontend"
git branch -M main
git push -u origin main

For future updates:
git add . && git commit -m "your message" && git push

## CoinGecko DEX Listing

Your subgraph provides all CoinGecko required data:
  Pool addresses          -> pools.id
  Token contracts         -> pools.token0.id, pools.token1.id
  Token symbols/names     -> pools.token0.symbol, pools.token0.name
  Token decimals          -> pools.token0.decimals
  Token total supply      -> pools.token0.totalSupply
  Current price USD       -> pools.token0Price * SHM_USD_price
  24h trading volume      -> poolDayDatas[latest].volumeUSD
  Historical prices       -> poolDayDatas.token0Price array
  TVL / liquidity         -> pools.totalValueLockedUSD
  LP supply               -> sum(mints.amount) - sum(burns.amount)
  Recent trades           -> swaps entity

Submit listing: https://www.coingecko.com/en/methodology

## Project Structure

analytics_mintondex_com/
├── README.md
├── nginx_config.txt           <- VPS web server config
├── subgraph/
│   ├── subgraph.yaml          <- CONFIGURE FACTORY ADDRESS HERE
│   ├── schema.graphql         <- All entity types
│   ├── package.json
│   ├── abis/Factory.json
│   ├── abis/Pool.json
│   ├── abis/ERC20.json
│   └── src/
│       ├── factory.ts         <- handlePoolCreated
│       └── pool.ts            <- handleSwap/Mint/Burn + price/TVL calc
└── frontend/
    ├── package.json
    ├── env.example            <- copy to .env.local
    ├── public/index.html
    └── src/
        ├── App.tsx            <- Routes
        ├── index.tsx          <- Entry point
        ├── styles/global.css  <- Dark theme UI
        ├── graphql/queries.ts <- Apollo client + all GraphQL queries
        ├── utils/format.ts    <- formatUSD, formatDate, formatFee, etc
        ├── components/
        │   ├── Layout.tsx     <- Navbar + footer
        │   ├── StatCard.tsx   <- Metric card
        │   ├── Charts.tsx     <- TVL, Volume, Price, Liquidity charts
        │   ├── PoolsTable.tsx <- Searchable pool list
        │   ├── SwapsTable.tsx <- Recent swaps
        │   └── LPPositions.tsx <- Mint/Burn LP activity
        └── pages/
            ├── HomePage.tsx      <- Protocol overview
            ├── PoolsPage.tsx     <- All pools
            ├── PoolDetailPage.tsx <- Pool with all 4 charts
            └── TokensPage.tsx    <- Token list
