import { Deployed, DeploymentManager } from '../../../plugins/deployment_manager';
import { debug, DeploySpec, deployComet, exp, wait } from '../../../src/deploy';

const RH_STOCK_ADDRESSES = {
  // Robinhood docs list this as a testnet stock token contract.
  // Keep this verified address as the default and add other stocks via migrations
  // after validating they are live on-chain.
  AAPL: '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E',
};

function positiveIntegerFromEnv(key: string, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > max) {
    throw new Error(`${key} must be a positive integer <= ${max}, got \`${raw}\``);
  }
  return parsed;
}

function addressFromEnv(deploymentManager: DeploymentManager, key: string, fallback: string): string {
  const raw = process.env[key];
  if (!raw) return fallback;
  const { ethers } = deploymentManager.hre;
  if (!ethers.utils.isAddress(raw)) {
    throw new Error(`${key} must be a valid 0x address, got \`${raw}\``);
  }
  return ethers.utils.getAddress(raw);
}

function priceFromEnv(symbol: string, fallback: number): number {
  const key = `RH_${symbol}_PRICE_USD`;
  const raw = process.env[key];
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive number, got \`${raw}\``);
  }
  return parsed;
}

async function assertContractCode(deploymentManager: DeploymentManager, label: string, address: string) {
  const code = await deploymentManager.hre.ethers.provider.getCode(address);
  if (code === '0x') {
    throw new Error(`${label} at ${address} has no bytecode on-chain. Update the address before deploying.`);
  }
}

async function validateERC20Metadata(token: any, symbol: string, expectedDecimals: number) {
  const tokenDecimals = Number(await token.decimals());
  if (tokenDecimals !== expectedDecimals) {
    throw new Error(`${symbol} decimals mismatch: expected ${expectedDecimals}, got ${tokenDecimals}`);
  }
}

export default async function deploy(
  deploymentManager: DeploymentManager,
  deploySpec: DeploySpec
): Promise<Deployed> {
  const deployed = await deployContracts(deploymentManager, deploySpec);
  await seedBaseLiquidity(deploymentManager);
  return deployed;
}

async function deployContracts(
  deploymentManager: DeploymentManager,
  deploySpec: DeploySpec
): Promise<Deployed> {
  const signer = await deploymentManager.getSigner();
  const manualFeedUpdater = addressFromEnv(deploymentManager, 'RH_PRICE_UPDATER', signer.address);
  const stableMaxChangeBps = positiveIntegerFromEnv('RH_STABLE_MAX_CHANGE_BPS', 200, 10_000);
  const stockMaxChangeBps = positiveIntegerFromEnv('RH_STOCK_MAX_CHANGE_BPS', 2_000, 10_000);
  const fauceteer = await deploymentManager.deploy('fauceteer', 'test/Fauceteer.sol', []);

  // Base asset for this market: a local 6-decimal test USD token.
  const rUSD = await deploymentManager.deploy('rUSD', 'test/FaucetToken.sol', [
    exp(50_000_000, 6),
    'Robinhood USD',
    6,
    'rUSD',
  ]);

  const AAPL = await deploymentManager.existing(
    'AAPL',
    RH_STOCK_ADDRESSES.AAPL,
    'robinhood',
    'contracts/ERC20.sol:ERC20'
  );
  await assertContractCode(deploymentManager, 'AAPL', AAPL.address);
  await validateERC20Metadata(AAPL, 'AAPL', 18);

  // Manual price feeds (8 decimals, Chainlink-compatible interface).
  await deploymentManager.deploy('rUSD:priceFeed', 'pricefeeds/ManualPriceFeed.sol', [
    8,
    'rUSD / USD (Manual)',
    signer.address,
    manualFeedUpdater,
    stableMaxChangeBps,
    exp(1, 8),
  ]);

  await deploymentManager.deploy('AAPL:priceFeed', 'pricefeeds/ManualPriceFeed.sol', [
    8,
    'AAPL / USD (Manual)',
    signer.address,
    manualFeedUpdater,
    stockMaxChangeBps,
    exp(priceFromEnv('AAPL', 200), 8),
  ]);

  const deployed = await deployComet(
    deploymentManager,
    deploySpec,
    {
      governor: signer.address,
      pauseGuardian: signer.address,
    },
    true
  );
  return { ...deployed, fauceteer };
}

async function seedBaseLiquidity(deploymentManager: DeploymentManager) {
  const signer = await deploymentManager.getSigner();
  const contracts = await deploymentManager.contracts();
  const rUSD = contracts.get('rUSD')!;
  const fauceteer = contracts.get('fauceteer')!;

  await deploymentManager.idempotent(
    async () => (await rUSD.balanceOf(fauceteer.address)).eq(0),
    async () => {
      debug('Minting rUSD to fauceteer');
      await wait(rUSD.connect(signer).allocateTo(fauceteer.address, exp(10_000_000, 6)));
    }
  );

  await deploymentManager.idempotent(
    async () => (await rUSD.balanceOf(signer.address)).lt(exp(1_000_000, 6)),
    async () => {
      debug('Minting rUSD to deployer');
      await wait(rUSD.connect(signer).allocateTo(signer.address, exp(1_000_000, 6)));
    }
  );
}
