# Robinhood Stocks Frontend

This is a no-build static dApp for your Robinhood testnet Compound v3 market.

## Features

- Connect MetaMask and enforce `chainId=46630`
- View protocol stats: total borrow, market cash, reserves, base borrow minimum
- View all collateral markets with:
  - price
  - your collateral posted
  - protocol collateral posted
  - supply cap
  - borrow CF and liquidate CF
- View your position:
  - base supplied
  - base borrowed
  - borrow-capacity used
  - health factor + liquidation indicator
- Execute core actions:
  - approve asset
  - supply asset
  - withdraw asset
  - approve base
  - borrow base
  - repay base

## Run

From repo root:

```bash
cd "/Users/jordanhiken/Documents/New project/compound-robinhood"
python3 -m http.server 4173
```

Open:

- `http://localhost:4173/frontend/`

## Wallet setup

If MetaMask does not auto-add network, use:

- Network Name: `Robinhood Testnet`
- RPC URL: `https://rpc.testnet.chain.robinhood.com`
- Chain ID: `46630`
- Symbol: `ETH`
- Explorer: `https://explorer.testnet.chain.robinhood.com`

## Notes

- The app reads `/deployments/robinhood/stocks/aliases.json` when served from repo root.
- Fallback Comet address is hardcoded to your deployed market.
- Health factor is UI-calculated from current prices and collateral factors; protocol liquidation truth still comes from `isLiquidatable`.
