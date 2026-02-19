import hre from 'hardhat';
import fs from 'fs';
import path from 'path';

type AliasMap = Record<string, string>;
type FeedMap = Record<string, string>;

interface RelayConfig {
  dryRun: boolean;
  maxStalenessSeconds: number;
  minUpdateDeltaBps: number;
  onlyAliases: Set<string>;
  sourceRpcUrl: string;
  feedMap: FeedMap;
}

interface RelayStats {
  updated: number;
  skipped: number;
  failed: number;
}

const SOURCE_FEED_ABI = [
  'function decimals() view returns (uint8)',
  'function description() view returns (string)',
  'function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)',
];

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function boolEnv(name: string, defaultValue: boolean = false): boolean {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function intEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return Math.floor(parsed);
}

function loadFeedMap(): FeedMap {
  const inline = process.env.CHAINLINK_FEED_MAP_JSON;
  const mapFile = process.env.CHAINLINK_FEED_MAP_FILE;

  if (!inline && !mapFile) {
    throw new Error(
      'Set CHAINLINK_FEED_MAP_JSON or CHAINLINK_FEED_MAP_FILE. Example: {"TSLA":"0x...", "AMZN":"0x..."}'
    );
  }

  const parsed = inline
    ? (JSON.parse(inline) as FeedMap)
    : readJson<FeedMap>(path.resolve(process.cwd(), mapFile as string));

  const normalized: FeedMap = {};
  for (const [alias, address] of Object.entries(parsed)) {
    if (!alias || !address) continue;
    normalized[alias.toUpperCase()] = address;
  }
  return normalized;
}

function normalizeAliases(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean)
  );
}

function rescaleAnswer(
  answer: import('ethers').BigNumber,
  sourceDecimals: number,
  targetDecimals: number
): import('ethers').BigNumber {
  if (sourceDecimals === targetDecimals) return answer;
  if (sourceDecimals < targetDecimals) {
    return answer.mul(hre.ethers.BigNumber.from(10).pow(targetDecimals - sourceDecimals));
  }
  return answer.div(hre.ethers.BigNumber.from(10).pow(sourceDecimals - targetDecimals));
}

function calcDiffBps(
  current: import('ethers').BigNumber,
  next: import('ethers').BigNumber
): import('ethers').BigNumber {
  if (current.isZero()) return hre.ethers.BigNumber.from(10_000);
  const diff = current.gt(next) ? current.sub(next) : next.sub(current);
  return diff.mul(10_000).div(current);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadRelayConfig(): RelayConfig {
  const sourceRpcUrl = process.env.SOURCE_RPC_URL;
  if (!sourceRpcUrl) {
    throw new Error('Missing SOURCE_RPC_URL');
  }

  return {
    dryRun: boolEnv('DRY_RUN', false),
    maxStalenessSeconds: intEnv('MAX_SOURCE_STALENESS_SECONDS', 24 * 60 * 60),
    minUpdateDeltaBps: intEnv('MIN_UPDATE_DELTA_BPS', 0),
    onlyAliases: normalizeAliases(process.env.ONLY_ALIASES),
    sourceRpcUrl,
    feedMap: loadFeedMap(),
  };
}

async function relayOnce(
  config: RelayConfig,
  signer: import('ethers').Signer,
  sourceProvider: import('ethers').providers.Provider
): Promise<RelayStats> {
  const deploymentDir = path.resolve(__dirname, '../deployments/robinhood/stocks');
  const aliasesPath = path.join(deploymentDir, 'aliases.json');
  const aliases = readJson<AliasMap>(aliasesPath);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [alias, manualFeedAddress] of Object.entries(aliases)) {
    if (!alias.endsWith(':priceFeed')) continue;

    const tokenAlias = alias.replace(':priceFeed', '').toUpperCase();
    if (config.onlyAliases.size > 0 && !config.onlyAliases.has(tokenAlias)) continue;

    const sourceFeedAddress = config.feedMap[tokenAlias];
    if (!sourceFeedAddress) {
      console.log(`\n${tokenAlias}: skipped (no source feed mapping)`);
      skipped++;
      continue;
    }

    try {
      const manualFeed = await hre.ethers.getContractAt(
        'contracts/pricefeeds/ManualPriceFeed.sol:ManualPriceFeed',
        manualFeedAddress,
        signer
      );
      const sourceFeed = new hre.ethers.Contract(sourceFeedAddress, SOURCE_FEED_ABI, sourceProvider);

      const [manualDecimals, sourceDecimals, sourceDescription, sourceRound, currentRound] = await Promise.all([
        manualFeed.decimals(),
        sourceFeed.decimals(),
        sourceFeed.description().catch(() => 'unknown'),
        sourceFeed.latestRoundData(),
        manualFeed.latestRoundData(),
      ]);

      const sourceAnswer = hre.ethers.BigNumber.from(sourceRound.answer.toString());
      if (sourceAnswer.lte(0)) {
        throw new Error(`invalid source answer ${sourceAnswer.toString()}`);
      }

      const sourceUpdatedAt = Number(sourceRound.updatedAt.toString());
      if (sourceUpdatedAt <= 0) {
        throw new Error('source feed returned updatedAt=0');
      }
      const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - sourceUpdatedAt);
      if (ageSeconds > config.maxStalenessSeconds) {
        throw new Error(`source feed is stale (${ageSeconds}s old)`);
      }

      const nextAnswer = rescaleAnswer(sourceAnswer, Number(sourceDecimals), Number(manualDecimals));
      const currentAnswer = hre.ethers.BigNumber.from(currentRound.answer.toString());
      if (nextAnswer.lte(0)) {
        throw new Error(`rescaled answer invalid (${nextAnswer.toString()})`);
      }

      const deltaBps = calcDiffBps(currentAnswer, nextAnswer);

      console.log(`\n${tokenAlias}:priceFeed @ ${manualFeedAddress}`);
      console.log(`- source feed: ${sourceFeedAddress}`);
      console.log(`- source desc: ${sourceDescription}`);
      console.log(`- source answer:  ${sourceAnswer.toString()} (decimals=${sourceDecimals})`);
      console.log(`- manual current: ${currentAnswer.toString()} (decimals=${manualDecimals})`);
      console.log(`- manual next:    ${nextAnswer.toString()}`);
      console.log(`- source age:     ${ageSeconds}s`);
      console.log(`- delta:          ${deltaBps.toString()} bps`);

      if (deltaBps.lt(config.minUpdateDeltaBps)) {
        console.log('- skipped (delta below MIN_UPDATE_DELTA_BPS)');
        skipped++;
        continue;
      }

      if (currentAnswer.eq(nextAnswer)) {
        console.log('- skipped (no change)');
        skipped++;
        continue;
      }

      if (config.dryRun) {
        console.log('- skipped (dry run)');
        skipped++;
        continue;
      }

      const tx = await manualFeed.setRoundData(nextAnswer);
      const receipt = await tx.wait();
      console.log(`- updated in tx ${receipt.transactionHash}`);
      updated++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${tokenAlias}: failed - ${message}`);
      failed++;
    }
  }

  return { updated, skipped, failed };
}

async function main() {
  if (hre.network.name !== 'robinhood') {
    throw new Error(`This script is intended for robinhood network, got ${hre.network.name}`);
  }

  const config = loadRelayConfig();
  const pollIntervalSeconds = intEnv('POLL_INTERVAL_SECONDS', 0);
  const continuous = pollIntervalSeconds > 0;

  if (continuous && pollIntervalSeconds < 5) {
    console.warn(
      `Warning: POLL_INTERVAL_SECONDS=${pollIntervalSeconds} is very aggressive and may create frequent tx attempts.`
    );
  }

  const [signer] = await hre.ethers.getSigners();
  const sourceProvider = new hre.ethers.providers.JsonRpcProvider(config.sourceRpcUrl);

  console.log(`Updater: ${await signer.getAddress()}`);
  console.log(`Target network: ${hre.network.name}`);
  console.log(`Source RPC: ${config.sourceRpcUrl}`);
  console.log(`Dry run: ${config.dryRun}`);
  console.log(`MAX_SOURCE_STALENESS_SECONDS=${config.maxStalenessSeconds}`);
  console.log(`MIN_UPDATE_DELTA_BPS=${config.minUpdateDeltaBps}`);
  if (config.onlyAliases.size > 0) {
    console.log(`ONLY_ALIASES=${Array.from(config.onlyAliases).join(',')}`);
  }

  if (!continuous) {
    const stats = await relayOnce(config, signer, sourceProvider);
    console.log('\nSummary');
    console.log(`- updated: ${stats.updated}`);
    console.log(`- skipped: ${stats.skipped}`);
    console.log(`- failed:  ${stats.failed}`);
    if (stats.failed > 0) {
      throw new Error(`Relay completed with ${stats.failed} failure(s)`);
    }
    return;
  }

  console.log(`Continuous mode enabled: polling every ${pollIntervalSeconds}s`);
  let iteration = 0;
  for (;;) {
    iteration++;
    const startedAt = Date.now();
    console.log(`\n===== Relay iteration ${iteration} @ ${new Date(startedAt).toISOString()} =====`);

    try {
      const stats = await relayOnce(config, signer, sourceProvider);
      console.log(`Iteration ${iteration} summary: updated=${stats.updated}, skipped=${stats.skipped}, failed=${stats.failed}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Iteration ${iteration} fatal error: ${message}`);
    }

    const elapsedMs = Date.now() - startedAt;
    const waitMs = Math.max(0, pollIntervalSeconds * 1000 - elapsedMs);
    if (waitMs > 0) {
      console.log(`Sleeping ${Math.round(waitMs / 1000)}s before next relay...`);
      await sleep(waitMs);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
