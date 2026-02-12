import hre from 'hardhat';
import fs from 'fs';
import path from 'path';

type AliasMap = Record<string, string>;
type RootMap = Record<string, string>;

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function getDeploymentDir() {
  return path.resolve(__dirname, '../deployments/robinhood/stocks');
}

function findCollateralAlias(aliases: AliasMap): string {
  const alias = Object.keys(aliases).find((key) => {
    if (key === 'rUSD') return false;
    if (key.endsWith(':priceFeed')) return false;
    return Boolean(aliases[`${key}:priceFeed`]);
  });

  if (!alias) {
    throw new Error('Could not find collateral alias in aliases.json');
  }
  return alias;
}

async function main() {
  const deploymentDir = getDeploymentDir();
  const aliasesPath = path.join(deploymentDir, 'aliases.json');
  const rootsPath = path.join(deploymentDir, 'roots.json');

  const aliases = readJson<AliasMap>(aliasesPath);
  const roots = readJson<RootMap>(rootsPath);

  const cometAddress = roots.comet;
  const baseTokenAddress = aliases.rUSD;
  const collateralAlias = findCollateralAlias(aliases);
  const collateralAddress = aliases[collateralAlias];

  if (!cometAddress || !baseTokenAddress || !collateralAddress) {
    throw new Error('Missing deployed addresses in roots/aliases. Re-run deployment first.');
  }

  const [signer] = await hre.ethers.getSigners();
  const user = signer.address;

  const comet = await hre.ethers.getContractAt(
    'contracts/CometInterface.sol:CometInterface',
    cometAddress,
    signer
  );
  const rUSD = await hre.ethers.getContractAt(
    'contracts/test/FaucetToken.sol:FaucetToken',
    baseTokenAddress,
    signer
  );
  const collateral = await hre.ethers.getContractAt(
    'contracts/ERC20.sol:ERC20',
    collateralAddress,
    signer
  );

  const collateralDecimals = await collateral.decimals();
  const baseBorrowMin = await comet.baseBorrowMin();
  const borrowAmount = process.env.BORROW_AMOUNT
    ? hre.ethers.utils.parseUnits(process.env.BORROW_AMOUNT, 6)
    : baseBorrowMin;
  const liquiditySeed = process.env.LIQUIDITY_SEED
    ? hre.ethers.utils.parseUnits(process.env.LIQUIDITY_SEED, 6)
    : borrowAmount.mul(100);
  const collateralAmount = process.env.COLLATERAL_AMOUNT
    ? hre.ethers.utils.parseUnits(process.env.COLLATERAL_AMOUNT, collateralDecimals)
    : hre.ethers.utils.parseUnits('1', collateralDecimals);

  console.log(`Network: ${hre.network.name}`);
  console.log(`User: ${user}`);
  console.log(`Comet: ${comet.address}`);
  console.log(`Base token (rUSD): ${rUSD.address}`);
  console.log(`Collateral (${collateralAlias}): ${collateral.address}`);
  console.log(`baseBorrowMin: ${baseBorrowMin.toString()}`);
  console.log(`borrowAmount: ${borrowAmount.toString()}`);
  console.log(`liquiditySeed: ${liquiditySeed.toString()}`);
  console.log(`collateralAmount: ${collateralAmount.toString()}`);

  const collateralBalance = await collateral.balanceOf(user);
  if (collateralBalance.lt(collateralAmount)) {
    throw new Error(
      `Insufficient ${collateralAlias} balance. Need ${collateralAmount.toString()}, have ${collateralBalance.toString()}`
    );
  }

  const marketCashBefore = await rUSD.balanceOf(comet.address);
  if (marketCashBefore.lt(liquiditySeed)) {
    console.log(`Seeding rUSD market liquidity to comet...`);
    const tx = await rUSD.allocateTo(comet.address, liquiditySeed);
    await tx.wait();
  }

  const approveBaseTx = await rUSD.approve(comet.address, hre.ethers.constants.MaxUint256);
  await approveBaseTx.wait();
  const approveCollateralTx = await collateral.approve(comet.address, hre.ethers.constants.MaxUint256);
  await approveCollateralTx.wait();

  console.log(`Supplying ${collateralAlias} collateral...`);
  const supplyCollateralTx = await comet.supply(collateral.address, collateralAmount);
  await supplyCollateralTx.wait();

  const baseSupplyBefore = await comet.balanceOf(user);
  if (baseSupplyBefore.gt(0)) {
    // Remove base supply so the next withdraw path is definitely borrow.
    console.log(`Withdrawing existing base supply (${baseSupplyBefore.toString()}) to isolate borrow test...`);
    const withdrawSupplyTx = await comet.withdraw(rUSD.address, baseSupplyBefore);
    await withdrawSupplyTx.wait();
  }

  const borrowBefore = await comet.borrowBalanceOf(user);
  console.log(`Borrow balance before: ${borrowBefore.toString()}`);

  console.log(`Borrowing rUSD via withdraw(${borrowAmount.toString()})...`);
  const borrowTx = await comet.withdraw(rUSD.address, borrowAmount);
  await borrowTx.wait();

  const borrowAfter = await comet.borrowBalanceOf(user);
  const marketCashAfter = await rUSD.balanceOf(comet.address);

  console.log(`Borrow balance after: ${borrowAfter.toString()}`);
  console.log(`Market cash after: ${marketCashAfter.toString()}`);

  if (borrowAfter.lte(borrowBefore)) {
    throw new Error('Borrow balance did not increase. Borrow smoke test failed.');
  }

  const delta = borrowAfter.sub(borrowBefore);
  console.log(`SUCCESS: borrow increased by ${delta.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
