import io

f = io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', encoding='utf-8').read()

# Add TokenIcon import
old1 = 'import { tokenPriceToUSD, formatSHMPrice } from "../utils/coingecko";'
new1 = 'import { tokenPriceToUSD, formatSHMPrice } from "../utils/coingecko";\nimport TokenIcon from "../components/TokenIcon";'

if old1 in f:
    f = f.replace(old1, new1)
    print("added TokenIcon import")
else:
    print("ERROR: import not found")

# Replace token icons in pools table
old2 = '                          <div className="token-icons">\n                            <div className="token-icon">{pool.token0.symbol.slice(0, 2)}</div>\n                            <div className="token-icon">{pool.token1.symbol.slice(0, 2)}</div>\n                          </div>'
new2 = '                          <div className="token-icons">\n                            <TokenIcon address={pool.token0.id} symbol={pool.token0.symbol} size={28} />\n                            <TokenIcon address={pool.token1.id} symbol={pool.token1.symbol} size={28} />\n                          </div>'

if old2 in f:
    f = f.replace(old2, new2)
    print("fixed pool token icons")
else:
    print("ERROR: token icons not found")

io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
