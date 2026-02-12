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
- To add more Robinhood stock tokens as collateral, create a migration under `deployments/robinhood/stocks/migrations/` once each token address is validated on-chain.

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
