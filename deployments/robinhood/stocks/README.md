# Robinhood Testnet Stocks Market

This deployment targets Robinhood public testnet (`chainId=46630`) and configures a Compound v3 market with:
- Base asset: `rUSD` (locally deployed 6-decimal faucet token)
- Collateral asset: Robinhood `AAPL` stock token

## Deploy

```bash
ROBINHOOD_RPC_LINK="https://rpc.testnet.chain.robinhood.com" \
RH_AAPL_PRICE_USD="200" \
yarn hardhat deploy --network robinhood --deployment stocks --no-verify --no-verify-impl
```

## Notes

- `RH_AAPL_PRICE_USD` sets the initial AAPL/USD oracle value for `ConstantPriceFeed`.
- `--no-verify --no-verify-impl` avoids a known verify-task issue in this repo.
- To add more Robinhood stock tokens as collateral, create a migration under `deployments/robinhood/stocks/migrations/` once each token address is validated on-chain.

## Smoke test

```bash
npx hardhat run scripts/robinhood-smoke.ts --network robinhood
```
