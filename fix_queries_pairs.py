import io

qt = io.open("C:/mintondex/frontend/src/graphql/queries.ts", encoding="utf-8").read()

old = "pairsBase(first: 5, orderBy: volumeUSD, orderDirection: desc) {\n        id token0 { id symbol } token1 { id symbol } reserve0 reserve1 volumeUSD txCount\n      }\n      pairsQuote(first: 5, orderBy: vol"
new = "pairsBase(first: 5, orderBy: volumeUSD, orderDirection: desc) {\n        id token0 { id symbol } token1 { id symbol } reserve0 reserve1 token0Price token1Price volumeUSD txCount\n      }\n      pairsQuote(first: 5, orderBy: vol"

if old in qt:
    qt = qt.replace(old, new)
    # Also fix pairsQuote the same way
    qt = qt.replace(
        "orderDirection: desc) {\n        id token0 { id symbol } token1 { id symbol } reserve0 reserve1 volumeUSD txCount\n      }",
        "orderDirection: desc) {\n        id token0 { id symbol } token1 { id symbol } reserve0 reserve1 token0Price token1Price volumeUSD txCount\n      }"
    )
    io.open("C:/mintondex/frontend/src/graphql/queries.ts", "w", encoding="utf-8").write(qt)
    print("fixed! token0Price and token1Price added to pairsBase and pairsQuote")
else:
    print("ERROR: string not matched, printing context:")
    idx = qt.find("pairsBase")
    print(repr(qt[idx:idx+400]))
