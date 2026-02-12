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
  '0xc9f9c86933092bbbfff3ccb4b105a4a94bf3bd4e': {
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
