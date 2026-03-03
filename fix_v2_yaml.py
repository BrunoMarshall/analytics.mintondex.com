import io
yaml = """specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: Factory
    network: mainnet
    source:
      address: "0x13B94479b80bcC600B46A14BEbCE378DA16210d6"
      abi: Factory
      startBlock: 2703337
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Pair
        - Token
      abis:
        - name: Factory
          file: ./abis/Factory.json
        - name: ERC20
          file: ./abis/ERC20.json
        - name: Pair
          file: ./abis/Pool.json
      eventHandlers:
        - event: PairCreated(indexed address,indexed address,address,uint256)
          handler: handlePairCreated
      file: ./src/factory.ts
templates:
  - kind: ethereum/contract
    name: Pair
    network: mainnet
    source:
      abi: Pair
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Pair
        - Swap
        - Mint
        - Burn
        - Token
        - PairDayData
      abis:
        - name: Pair
          file: ./abis/Pool.json
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: Mint(indexed address,uint256,uint256)
          handler: handleMint
        - event: Burn(indexed address,uint256,uint256,indexed address)
          handler: handleBurn
        - event: Swap(indexed address,uint256,uint256,uint256,uint256,indexed address)
          handler: handleSwap
        - event: Sync(uint112,uint112)
          handler: handleSync
      file: ./src/pair.ts
"""
with io.open("C:/mintondex/subgraph/subgraph.yaml","w",encoding="utf-8") as f:
    f.write(yaml)
print("saved subgraph.yaml")
