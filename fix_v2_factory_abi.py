import io, json
abi = [
  {"anonymous":False,"inputs":[{"indexed":True,"name":"token0","type":"address"},{"indexed":True,"name":"token1","type":"address"},{"indexed":False,"name":"pair","type":"address"},{"indexed":False,"name":"","type":"uint256"}],"name":"PairCreated","type":"event"},
  {"inputs":[{"name":"tokenA","type":"address"},{"name":"tokenB","type":"address"}],"name":"createPair","outputs":[{"name":"pair","type":"address"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"getPair","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"allPairsLength","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"","type":"uint256"}],"name":"allPairs","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}
]
with io.open("C:/mintondex/subgraph/abis/Factory.json","w",encoding="utf-8") as f:
    json.dump(abi, f, indent=2)
print("saved Factory.json")
