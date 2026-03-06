import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

# Add shmMarketCap state after mexcHistory state
f = f.replace(
    "  const [mexcHistory, setMexcHistory] = useState<number[][]>([]);",
    "  const [mexcHistory, setMexcHistory] = useState<number[][]>([]);\n  const [shmMarketCap, setShmMarketCap] = useState<number>(0);"
)

# Add useEffect to fetch CoinGecko market cap
f = f.replace(
    "  useEffect(() => {\n    fetch(\"/api/shm-history\")",
    """  useEffect(() => {
    fetch("/api/shm-marketcap")
      .then(r => r.json())
      .then(d => { const mc = d?.shardeum?.usd_market_cap ?? 0; if (mc > 0) setShmMarketCap(mc); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/shm-history")"""
)

# Use shmMarketCap for SHM row
f = f.replace(
    'priceUSD: shmPrice, marketCap: 0, volume: 0,',
    'priceUSD: shmPrice, marketCap: shmMarketCap, volume: 0,'
)

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved")
