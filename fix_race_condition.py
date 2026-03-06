import io

f = io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', encoding='utf-8').read()

old = """  useEffect(() => {
    if (!data?.tokens || !shmPrice) return;
    const fetchAll = async () => {
      const stats: Record<string, TokenStats> = {};
      for (const token of data.tokens) {
        try {
          const res = await fetch(SUBGRAPH, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: `{ tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { token: "${token.id}" }) { date priceUSD } }` })
          });
          const json = await res.json();
          const days = json?.data?.tokenDayDatas ?? [];
          if (days.length === 0) continue;
          const prices = days.map((d: any) => parseFloat(d.priceUSD) > 0 ? (1 / parseFloat(d.priceUSD)) * shmPrice : 0).filter((p: number) => p > 0);
          if (prices.length === 0) continue;
          const ath = Math.max(...prices);
          const atl = Math.min(...prices);
          const weekAgoTs = Math.floor(Date.now() / 1000) - 7 * 86400;
          const weekEntry = days.find((d: any) => d.date >= weekAgoTs) ?? days[0];
          stats[token.id] = {
            lastWeekPrice: parseFloat(weekEntry.priceUSD) > 0 ? (1 / parseFloat(weekEntry.priceUSD)) * shmPrice : 0,
            ath, atl
          };
        } catch {}
      }
      setTokenStats(stats);
    };
    fetchAll();
  }, [data, shmPrice]);"""

new = """  useEffect(() => {
    if (!data?.tokens || !shmPrice) return;
    let cancelled = false;
    const fetchAll = async () => {
      const stats: Record<string, TokenStats> = {};
      for (const token of data.tokens) {
        if (cancelled) return;
        try {
          const res = await fetch(SUBGRAPH, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: `{ tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { token: "${token.id}" }) { date priceUSD } }` })
          });
          const json = await res.json();
          const days = json?.data?.tokenDayDatas ?? [];
          if (days.length === 0) continue;
          const prices = days.map((d: any) => parseFloat(d.priceUSD) > 0 ? (1 / parseFloat(d.priceUSD)) * shmPrice : 0).filter((p: number) => p > 0);
          if (prices.length === 0) continue;
          const ath = Math.max(...prices);
          const atl = Math.min(...prices);
          const weekAgoTs = Math.floor(Date.now() / 1000) - 7 * 86400;
          const weekEntry = days.find((d: any) => d.date >= weekAgoTs) ?? days[0];
          stats[token.id] = {
            lastWeekPrice: parseFloat(weekEntry.priceUSD) > 0 ? (1 / parseFloat(weekEntry.priceUSD)) * shmPrice : 0,
            ath, atl
          };
        } catch {}
      }
      if (!cancelled) setTokenStats(stats);
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [data, shmPrice]);"""

if old in f:
    f = f.replace(old, new)
    print("✓ fixed race condition - added cancelled flag")
else:
    print("✗ exact string not found")

io.open('C:/mintondex/frontend/src/pages/TokensPage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
