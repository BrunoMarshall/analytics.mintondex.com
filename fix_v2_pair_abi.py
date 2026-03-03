import io, json
abi = [
  {"anonymous":False,"inputs":[{"indexed":True,"name":"sender","type":"address"},{"indexed":False,"name":"amount0","type":"uint256"},{"indexed":False,"name":"amount1","type":"uint256"},{"indexed":True,"name":"to","type":"address"}],"name":"Mint","type":"event"},
  {"anonymous":False,"inputs":[{"indexed":True,"name":"sender","type":"address"},{"indexed":False,"name":"amount0","type":"uint256"},{"indexed":False,"name":"amount1","type":"uint256"},{"indexed":True,"name":"to","type":"address"}],"name":"Burn","type":"event"},
  {"anonymous":False,"inputs":[{"indexed":True,"name":"sender","type":"address"},{"indexed":False,"name":"amount0In","type":"uint256"},{"indexed":False,"name":"amount1In","type":"uint256"},{"indexed":False,"name":"amount0Out","type":"uint256"},{"indexed":False,"name":"amount1Out","type":"uint256"},{"indexed":True,"name":"to","type":"address"}],"name":"Swap","type":"event"},
  {"anonymous":False,"inputs":[{"indexed":False,"name":"reserve0","type":"uint112"},{"indexed":False,"name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},
  {"inputs":[],"name":"token0","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"token1","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getReserves","outputs":[{"name":"reserve0","type":"uint112"},{"name":"reserve1","type":"uint112"},{"name":"blockTimestampLast","type":"uint32"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
]
with io.open("C:/mintondex/subgraph/abis/Pool.json","w",encoding="utf-8") as f:
    json.dump(abi, f, indent=2)
print("saved Pool.json (Pair ABI)")
