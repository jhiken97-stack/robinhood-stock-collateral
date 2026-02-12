import { expect } from 'chai';
import { utils } from 'ethers';
import { DeploymentManager } from '../../../../plugins/deployment_manager/DeploymentManager';
import { migration } from '../../../../plugins/deployment_manager/Migration';
import { exp, wait } from '../../../../src/deploy';

interface Vars {
  stockAlias: string;
  stockAddress: string;
  stockDecimals: number;
  borrowCF: number;
  liquidateCF: number;
  liquidationFactor: number;
  supplyCapTokens: number;
  priceFeedAddress: string;
}

function mustEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
}

function envAddress(dm: DeploymentManager, key: string): string {
  const value = mustEnv(key).trim();
  if (!dm.hre.ethers.utils.isAddress(value)) {
    throw new Error(`${key} must be a valid 0x address, got \`${value}\``);
  }
  return dm.hre.ethers.utils.getAddress(value);
}

function envAlias(key: string): string {
  const value = mustEnv(key).trim().toUpperCase();
  if (!/^[A-Z0-9]{1,16}$/.test(value)) {
    throw new Error(`${key} must be 1-16 chars [A-Z0-9], got \`${value}\``);
  }
  return value;
}

function maybeEnvAddress(dm: DeploymentManager, key: string): string | undefined {
  const raw = process.env[key];
  if (!raw || !raw.trim()) return undefined;
  const value = raw.trim();
  if (!dm.hre.ethers.utils.isAddress(value)) {
    throw new Error(`${key} must be a valid 0x address, got \`${value}\``);
  }
  return dm.hre.ethers.utils.getAddress(value);
}

function envNumber(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (!raw) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var ${key}`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be a positive number, got \`${raw}\``);
  }
  return value;
}

function envInteger(key: string, fallback?: number): number {
  const value = envNumber(key, fallback);
  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer, got \`${value}\``);
  }
  return value;
}

export default migration('1760638800_add_stock_collateral', {
  async prepare(deploymentManager: DeploymentManager): Promise<Vars> {
    const signer = await deploymentManager.getSigner();

    const stockAlias = envAlias('RH_STOCK_ALIAS');
    const stockAddress = envAddress(deploymentManager, 'RH_STOCK_ADDRESS');
    const stockDecimals = envInteger('RH_STOCK_DECIMALS', 18);
    if (stockDecimals > 18) {
      throw new Error('RH_STOCK_DECIMALS must be <= 18');
    }

    const existingPriceFeed = maybeEnvAddress(deploymentManager, 'RH_STOCK_PRICE_FEED_ADDRESS');

    const borrowCF = envNumber('RH_STOCK_BORROW_CF', 0.45);
    const liquidateCF = envNumber('RH_STOCK_LIQUIDATE_CF', 0.60);
    const liquidationFactor = envNumber('RH_STOCK_LIQUIDATION_FACTOR', 0.92);
    const supplyCapTokens = envNumber('RH_STOCK_SUPPLY_CAP_TOKENS', 100_000);

    if (!(borrowCF < liquidateCF && liquidateCF <= 1 && liquidationFactor <= 1)) {
      throw new Error(
        'Invalid collateral factors; require borrowCF < liquidateCF <= 1 and liquidationFactor <= 1'
      );
    }

    let priceFeedAddress = existingPriceFeed;
    if (!priceFeedAddress) {
      const initialPriceUsd = envNumber('RH_STOCK_INITIAL_PRICE_USD');
      const updater = process.env.RH_STOCK_PRICE_UPDATER
        ? envAddress(deploymentManager, 'RH_STOCK_PRICE_UPDATER')
        : signer.address;
      const maxChangeBps = envInteger('RH_STOCK_MAX_CHANGE_BPS', 2_000);
      if (maxChangeBps > 10_000) {
        throw new Error('RH_STOCK_MAX_CHANGE_BPS must be <= 10000');
      }

      const priceFeed = await deploymentManager.deploy(
        `${stockAlias}:priceFeed`,
        'pricefeeds/ManualPriceFeed.sol',
        [
          8,
          `${stockAlias} / USD (Manual)`,
          signer.address,
          updater,
          maxChangeBps,
          exp(initialPriceUsd, 8),
        ]
      );
      priceFeedAddress = priceFeed.address;
    }

    return {
      stockAlias,
      stockAddress,
      stockDecimals,
      borrowCF,
      liquidateCF,
      liquidationFactor,
      supplyCapTokens,
      priceFeedAddress,
    };
  },

  async enact(
    deploymentManager: DeploymentManager,
    _govDeploymentManager: DeploymentManager,
    vars: Vars
  ): Promise<void> {
    const trace = deploymentManager.tracer();
    const { comet, configurator, cometAdmin } = await deploymentManager.getContracts();

    const stock = await deploymentManager.existing(
      vars.stockAlias,
      vars.stockAddress,
      'robinhood',
      'contracts/ERC20.sol:ERC20'
    );

    const priceFeed = await deploymentManager.existing(
      `${vars.stockAlias}:priceFeed`,
      vars.priceFeedAddress,
      'robinhood',
      'contracts/IPriceFeed.sol:IPriceFeed'
    );

    // Prevent accidental duplicate asset additions.
    const config = await configurator.getConfiguration(comet.address);
    const alreadyExists = config.assetConfigs.some(
      (assetConfig: any) => assetConfig.asset.toLowerCase() === stock.address.toLowerCase()
    );
    if (alreadyExists) {
      throw new Error(`${vars.stockAlias} already exists as collateral in this market`);
    }

    const assetConfig = {
      asset: stock.address,
      priceFeed: priceFeed.address,
      decimals: vars.stockDecimals,
      borrowCollateralFactor: exp(vars.borrowCF, 18),
      liquidateCollateralFactor: exp(vars.liquidateCF, 18),
      liquidationFactor: exp(vars.liquidationFactor, 18),
      supplyCap: exp(vars.supplyCapTokens, vars.stockDecimals),
    };

    trace(`Adding ${vars.stockAlias} collateral with feed ${priceFeed.address}`);
    trace(await wait(configurator.addAsset(comet.address, assetConfig)));

    trace('Deploying and upgrading Comet implementation');
    trace(await wait(cometAdmin.deployAndUpgradeTo(configurator.address, comet.address)));
  },

  async enacted(): Promise<boolean> {
    return false;
  },

  async verify(
    deploymentManager: DeploymentManager,
    _govDeploymentManager: DeploymentManager,
    _preMigrationBlockNumber: number
  ) {
    const stockAlias = envAlias('RH_STOCK_ALIAS');
    const stockAddress = envAddress(deploymentManager, 'RH_STOCK_ADDRESS');
    const stockDecimals = envInteger('RH_STOCK_DECIMALS', 18);
    const borrowCF = envNumber('RH_STOCK_BORROW_CF', 0.45);
    const liquidateCF = envNumber('RH_STOCK_LIQUIDATE_CF', 0.60);
    const liquidationFactor = envNumber('RH_STOCK_LIQUIDATION_FACTOR', 0.92);
    const supplyCapTokens = envNumber('RH_STOCK_SUPPLY_CAP_TOKENS', 100_000);
    const externalPriceFeedAddress = maybeEnvAddress(deploymentManager, 'RH_STOCK_PRICE_FEED_ADDRESS');

    const { comet, configurator } = await deploymentManager.getContracts();
    const stock = await deploymentManager.existing(
      stockAlias,
      stockAddress,
      'robinhood',
      'contracts/ERC20.sol:ERC20'
    );

    const info = await comet.getAssetInfoByAddress(stock.address);
    expect(info.asset).to.equal(stock.address);
    expect(info.scale).to.equal(exp(1, stockDecimals));
    expect(info.borrowCollateralFactor).to.equal(exp(borrowCF, 18));
    expect(info.liquidateCollateralFactor).to.equal(exp(liquidateCF, 18));
    expect(info.liquidationFactor).to.equal(exp(liquidationFactor, 18));
    expect(info.supplyCap).to.equal(exp(supplyCapTokens, stockDecimals));

    const cfg = (await configurator.getConfiguration(comet.address)).assetConfigs[Number(info.offset)];
    const feedAlias = `${stockAlias}:priceFeed`;
    const aliasedFeedAddress = await deploymentManager.readAlias('robinhood', 'stocks', feedAlias);
    const expectedFeedAddress = externalPriceFeedAddress || aliasedFeedAddress || cfg.priceFeed;
    expect(cfg.asset).to.equal(stock.address);
    expect(info.priceFeed).to.equal(expectedFeedAddress);
    expect(cfg.priceFeed).to.equal(expectedFeedAddress);
    expect(cfg.decimals).to.equal(stockDecimals);
    expect(cfg.borrowCollateralFactor).to.equal(exp(borrowCF, 18));
    expect(cfg.liquidateCollateralFactor).to.equal(exp(liquidateCF, 18));
    expect(cfg.liquidationFactor).to.equal(exp(liquidationFactor, 18));
    expect(cfg.supplyCap).to.equal(exp(supplyCapTokens, stockDecimals));

    // Optional sanity check for manual feeds deployed by this migration.
    if (!externalPriceFeedAddress) {
      const feedAddress = aliasedFeedAddress || cfg.priceFeed;
      const feed = await deploymentManager.cast(
        feedAddress,
        'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed'
      );
      const round = await feed.latestRoundData();
      expect(round.answer.gt(0)).to.equal(true);
      expect(utils.isAddress(await feed.owner())).to.equal(true);
      expect(utils.isAddress(await feed.updater())).to.equal(true);
    }
  },
});
