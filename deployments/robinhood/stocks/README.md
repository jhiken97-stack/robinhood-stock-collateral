# Robinhood Testnet Stocks Market

This deployment targets Robinhood public testnet (`chainId=46630`) and configures a Compound v3 market with:
- Base asset: `rUSD` (locally deployed 6-decimal faucet token)
- Collateral asset: Robinhood `AAPL` stock token

## Deploy

```bash
ROBINHOOD_RPC_LINK="https://rpc.testnet.chain.robinhood.com" \
RH_AAPL_PRICE_USD="200" \
RH_PRICE_UPDATER="0xYOUR_UPDATER_ADDRESS" \
yarn hardhat deploy --network robinhood --deployment stocks --no-verify --no-verify-impl
```

## Notes

- `RH_AAPL_PRICE_USD` sets the initial AAPL/USD oracle value for `ManualPriceFeed`.
- `RH_PRICE_UPDATER` optionally sets a separate address allowed to update feed prices (defaults to deployer).
- `RH_STABLE_MAX_CHANGE_BPS` and `RH_STOCK_MAX_CHANGE_BPS` control max per-update change guardrails.
- `--no-verify --no-verify-impl` avoids a known verify-task issue in this repo.

## Add Another Stock Collateral (Step 2)

Use the reusable migration:
`deployments/robinhood/stocks/migrations/1760638800_add_stock_collateral.ts`

Option A: deploy a new `ManualPriceFeed` for the stock

```bash
ROBINHOOD_RPC_LINK="https://rpc.testnet.chain.robinhood.com" \
RH_STOCK_ALIAS="NVDA" \
RH_STOCK_ADDRESS="0xYOUR_NVDA_TOKEN_ADDRESS" \
RH_STOCK_DECIMALS="18" \
RH_STOCK_INITIAL_PRICE_USD="620.00" \
RH_STOCK_PRICE_UPDATER="0xYOUR_UPDATER_ADDRESS" \
RH_STOCK_MAX_CHANGE_BPS="2000" \
RH_STOCK_BORROW_CF="0.45" \
RH_STOCK_LIQUIDATE_CF="0.60" \
RH_STOCK_LIQUIDATION_FACTOR="0.92" \
RH_STOCK_SUPPLY_CAP_TOKENS="100000" \
yarn hardhat migrate 1760638800_add_stock_collateral --network robinhood --deployment stocks --enact --no-enacted
```

Option B: reuse an existing price feed (skip manual feed deploy)

```bash
ROBINHOOD_RPC_LINK="https://rpc.testnet.chain.robinhood.com" \
RH_STOCK_ALIAS="NVDA" \
RH_STOCK_ADDRESS="0xYOUR_NVDA_TOKEN_ADDRESS" \
RH_STOCK_DECIMALS="18" \
RH_STOCK_PRICE_FEED_ADDRESS="0xEXISTING_FEED_ADDRESS" \
RH_STOCK_BORROW_CF="0.45" \
RH_STOCK_LIQUIDATE_CF="0.60" \
RH_STOCK_LIQUIDATION_FACTOR="0.92" \
RH_STOCK_SUPPLY_CAP_TOKENS="100000" \
yarn hardhat migrate 1760638800_add_stock_collateral --network robinhood --deployment stocks --enact --no-enacted
```

If spider/import issues appear later for a new stock alias, add entries in
`deployments/robinhood/stocks/relations.ts` for:
- `"<ALIAS>:priceFeed"` -> `contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed` (if manual feed)
- `"<stock token address lowercased>"` -> `contracts/ERC20.sol:ERC20`

## Smoke test

```bash
npx hardhat run scripts/robinhood-smoke.ts --network robinhood
```

## Update prices

```bash
PRICE_RUSD="1.00" PRICE_TSLA="205.25" npx hardhat run scripts/robinhood-update-prices.ts --network robinhood
```

Price env names are `PRICE_<ALIAS>` from `deployments/robinhood/stocks/aliases.json`.

Use `DRY_RUN=true` to preview updates without sending transactions.
