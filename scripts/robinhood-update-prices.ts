import hre from 'hardhat';
import fs from 'fs';
import path from 'path';

type AliasMap = Record<string, string>;

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function toEnvKeyPrefix(alias: string): string {
  return alias.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function mustParsePriceToAnswer(priceStr: string, decimals: number): string {
  const answer = hre.ethers.utils.parseUnits(priceStr, decimals);
  if (answer.lte(0)) {
    throw new Error(`Price must be > 0, got ${priceStr}`);
  }
  return answer.toString();
}

async function main() {
  if (hre.network.name !== 'robinhood') {
    throw new Error(`This script is intended for robinhood network, got ${hre.network.name}`);
  }

  const deploymentDir = path.resolve(__dirname, '../deployments/robinhood/stocks');
  const aliasesPath = path.join(deploymentDir, 'aliases.json');
  const aliases = readJson<AliasMap>(aliasesPath);

  const [signer] = await hre.ethers.getSigners();
  const dryRun = process.env.DRY_RUN === 'true';
  let updated = 0;

  console.log(`Updater: ${signer.address}`);
  console.log(`Dry run: ${dryRun}`);

  for (const [alias, address] of Object.entries(aliases)) {
    if (!alias.endsWith(':priceFeed')) continue;

    const tokenAlias = alias.replace(':priceFeed', '');
    const envKey = `PRICE_${toEnvKeyPrefix(tokenAlias)}`;
    const rawPrice = process.env[envKey];
    if (!rawPrice) continue;

    const feed = await hre.ethers.getContractAt(
      'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
      address,
      signer
    );

    const decimals = await feed.decimals();
    const newAnswer = mustParsePriceToAnswer(rawPrice, decimals);
    const current = await feed.latestRoundData();

    console.log(`\n${alias} @ ${address}`);
    console.log(`- env ${envKey}=${rawPrice}`);
    console.log(`- current answer: ${current.answer.toString()}`);
    console.log(`- new answer:     ${newAnswer}`);

    if (dryRun) {
      console.log('- skipped (dry run)');
      continue;
    }

    const tx = await feed.setRoundData(newAnswer);
    const receipt = await tx.wait();
    console.log(`- updated in tx ${receipt.transactionHash}`);
    updated++;
  }

  if (updated === 0) {
    console.log('No price updates submitted. Set env vars like PRICE_RUSD and PRICE_TSLA (or PRICE_AAPL if alias exists).');
  } else {
    console.log(`\nDone. Updated ${updated} feed(s).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
