import baseRelationConfig from '../../relations';

export default {
  ...baseRelationConfig,
  'rUSD:priceFeed': {
    artifact: 'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
  },
  'AAPL:priceFeed': {
    artifact: 'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
  },
  'TSLA:priceFeed': {
    artifact: 'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
  },
  'AMZN:priceFeed': {
    artifact: 'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
  },
  'PLTR:priceFeed': {
    artifact: 'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
  },
  'NFLX:priceFeed': {
    artifact: 'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
  },
  'AMD:priceFeed': {
    artifact: 'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
  },
  '0xc9f9c86933092bbbfff3ccb4b105a4a94bf3bd4e': {
    artifact: 'contracts/ERC20.sol:ERC20',
  },
  '0x5884ad2f920c162cfbbacc88c9c51aa75ec09e02': {
    artifact: 'contracts/ERC20.sol:ERC20',
  },
  '0x1fbe1a0e43594b3455993b5de5fd0a7a266298d0': {
    artifact: 'contracts/ERC20.sol:ERC20',
  },
  '0x3b8262a63d25f0477c4dde23f83cfe22cb768c93': {
    artifact: 'contracts/ERC20.sol:ERC20',
  },
  '0x71178bac73cbeb415514eb542a8995b82669778d': {
    artifact: 'contracts/ERC20.sol:ERC20',
  },
  // In this testnet deployment governor/pauseGuardian can be an EOA.
  // Force local ABI resolution so spider does not try Etherscan imports for that address.
  timelock: {
    artifact: 'contracts/ERC20.sol:ERC20',
  },
  configurator: {
    delegates: {
      field: {
        slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
      },
    },
    relations: {
      configuratorAdmin: {
        field: {
          slot: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
        },
      },
      // Disable this relation for robinhood testnet because spider tries to import
      // unknown factory addresses from Etherscan v2, which this toolchain can't handle here.
      cometFactory: {
        field: async () => null,
      },
    },
  },
  rewards: {
    relations: {
      rewardToken: {
        field: async () => null,
      },
    },
  },
};
