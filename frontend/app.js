const CHAIN = {
  id: 46630,
  hexId: '0xb626',
  name: 'Robinhood Testnet',
  rpcUrl: 'https://rpc.testnet.chain.robinhood.com',
  explorer: 'https://explorer.testnet.chain.robinhood.com',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
};
const THEME_KEY = 'robinhood-ui-theme';

const FALLBACK_ALIASES = {
  comet: '0x7C5EE3f540A163947B32D178B3C9A83a65ED6E79',
  fauceteer: '0x34748D077492De9B04F77be6c420150D111fADA3',
};

const COMET_ABI = [
  'function baseToken() view returns (address)',
  'function baseTokenPriceFeed() view returns (address)',
  'function baseScale() view returns (uint64)',
  'function numAssets() view returns (uint8)',
  'function getAssetInfo(uint8) view returns (tuple(uint8 offset,address asset,address priceFeed,uint64 scale,uint64 borrowCollateralFactor,uint64 liquidateCollateralFactor,uint64 liquidationFactor,uint128 supplyCap))',
  'function getAssetInfoByAddress(address) view returns (tuple(uint8 offset,address asset,address priceFeed,uint64 scale,uint64 borrowCollateralFactor,uint64 liquidateCollateralFactor,uint64 liquidationFactor,uint128 supplyCap))',
  'function collateralBalanceOf(address,address) view returns (uint128)',
  'function balanceOf(address) view returns (uint256)',
  'function borrowBalanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function totalBorrow() view returns (uint256)',
  'function getReserves() view returns (int256)',
  'function totalsCollateral(address) view returns (uint128 totalSupplyAsset, uint128 _reserved)',
  'function isLiquidatable(address) view returns (bool)',
  'function isBorrowCollateralized(address) view returns (bool)',
  'function baseBorrowMin() view returns (uint104)',
  'function getPrice(address) view returns (uint256)',
  'function supply(address,uint256)',
  'function withdraw(address,uint256)',
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
];

const els = {
  connectBtn: document.getElementById('connect-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  walletAddress: document.getElementById('wallet-address'),
  networkStatus: document.getElementById('network-status'),
  cometAddress: document.getElementById('comet-address'),
  totalBorrow: document.getElementById('total-borrow'),
  marketCash: document.getElementById('market-cash'),
  borrowMin: document.getElementById('borrow-min'),
  reserves: document.getElementById('reserves'),
  baseSupply: document.getElementById('position-base-supply'),
  baseBorrow: document.getElementById('position-base-borrow'),
  totalCollateral: document.getElementById('position-total-collateral'),
  capacityUsed: document.getElementById('position-capacity-used'),
  health: document.getElementById('position-health'),
  liquidationTrigger: document.getElementById('position-liquidation-trigger'),
  liquidationThresholdNote: document.getElementById('liquidation-threshold-note'),
  liquidation: document.getElementById('liquidation-indicator'),
  collateralBreakdown: document.getElementById('collateral-breakdown'),
  assetSelect: document.getElementById('asset-select'),
  assetAmount: document.getElementById('asset-amount'),
  approveAssetBtn: document.getElementById('approve-asset-btn'),
  supplyAssetBtn: document.getElementById('supply-asset-btn'),
  withdrawAssetBtn: document.getElementById('withdraw-asset-btn'),
  baseAmount: document.getElementById('base-amount'),
  approveBaseBtn: document.getElementById('approve-base-btn'),
  borrowBaseBtn: document.getElementById('borrow-base-btn'),
  repayBaseBtn: document.getElementById('repay-base-btn'),
  marketsBody: document.getElementById('markets-body'),
  txLog: document.getElementById('tx-log'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  borrowCapacityBar: document.getElementById('borrow-capacity-bar'),
  borrowCapacityMeta: document.getElementById('borrow-capacity-meta'),
  healthFactorBar: document.getElementById('health-factor-bar'),
  healthFactorMeta: document.getElementById('health-factor-meta'),
  tabDashboardBtn: document.getElementById('tab-dashboard-btn'),
  tabMarketsBtn: document.getElementById('tab-markets-btn'),
  panelDashboard: document.getElementById('panel-dashboard'),
  panelMarkets: document.getElementById('panel-markets'),
};

const state = {
  aliases: { ...FALLBACK_ALIASES },
  injected: null,
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  comet: null,
  baseToken: null,
  base: null,
  collaterals: [],
  loading: false,
};

function requireConnected() {
  if (!state.account || !state.signer || !state.comet) {
    throw new Error('Connect wallet first');
  }
}

function getInjectedProvider() {
  const eth = window.ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    const metamask = eth.providers.find((p) => p && p.isMetaMask);
    return metamask || eth.providers[0];
  }
  return eth;
}

function log(message) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  els.txLog.textContent = `${line}\n${els.txLog.textContent}`.trim();
}

function fmtAmount(value, decimals = 2) {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function fmtUsd(value) {
  if (!Number.isFinite(value)) return '-';
  return `$${fmtAmount(value, 2)}`;
}

function bnToFloat(value, decimals) {
  return Number(ethers.utils.formatUnits(value, decimals));
}

function decimalsFromScale(scaleBn) {
  const s = scaleBn.toString();
  return Math.max(0, s.length - 1);
}

function shortenAddress(address) {
  if (!address) return '-';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function setActiveTab(panel) {
  const dashboard = panel === 'dashboard';
  els.panelDashboard.classList.toggle('active', dashboard);
  els.panelMarkets.classList.toggle('active', !dashboard);
  els.tabDashboardBtn.classList.toggle('active', dashboard);
  els.tabMarketsBtn.classList.toggle('active', !dashboard);
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', nextTheme);
  if (els.themeToggleBtn) {
    els.themeToggleBtn.textContent = nextTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
  localStorage.setItem(THEME_KEY, nextTheme);
}

function initializeTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
    return;
  }
  const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(preferDark ? 'dark' : 'light');
}

async function loadAliases() {
  const paths = [
    '/deployments/robinhood/stocks/aliases.json',
    '../deployments/robinhood/stocks/aliases.json',
    './deployments/robinhood/stocks/aliases.json',
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) continue;
      const aliases = await res.json();
      state.aliases = { ...FALLBACK_ALIASES, ...aliases };
      return;
    } catch (err) {
      // Try next path.
    }
  }

  log('Using fallback contract addresses (aliases.json not found via fetch).');
}

async function ensureWallet() {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error('MetaMask not detected. Install MetaMask to use this dApp.');
  }
  state.injected = injected;

  if (!state.provider) {
    state.provider = new ethers.providers.Web3Provider(injected, 'any');
  }

  const accounts = await injected.request({ method: 'eth_requestAccounts' });
  state.account = ethers.utils.getAddress(accounts[0]);
  state.signer = state.provider.getSigner();

  const network = await state.provider.getNetwork();
  state.chainId = network.chainId;

  if (network.chainId !== CHAIN.id) {
    await switchToRobinhood();
    const n2 = await state.provider.getNetwork();
    state.chainId = n2.chainId;
  }

  if (state.chainId !== CHAIN.id) {
    throw new Error(`Wrong network. Please switch wallet to ${CHAIN.name}.`);
  }
}

async function switchToRobinhood() {
  if (!state.injected) throw new Error('Wallet provider not available');
  try {
    await state.injected.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN.hexId }],
    });
  } catch (switchErr) {
    if (switchErr.code === 4902) {
      await state.injected.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CHAIN.hexId,
            chainName: CHAIN.name,
            rpcUrls: [CHAIN.rpcUrl],
            blockExplorerUrls: [CHAIN.explorer],
            nativeCurrency: CHAIN.nativeCurrency,
          },
        ],
      });
      return;
    }
    throw switchErr;
  }
}

async function loadMarket() {
  state.comet = new ethers.Contract(state.aliases.comet, COMET_ABI, state.signer || state.provider);

  const baseTokenAddress = await state.comet.baseToken();
  state.baseToken = new ethers.Contract(baseTokenAddress, ERC20_ABI, state.signer || state.provider);

  const [baseSymbol, baseDecimals] = await Promise.all([
    state.baseToken.symbol(),
    state.baseToken.decimals(),
  ]);

  state.base = {
    address: baseTokenAddress,
    symbol: baseSymbol,
    decimals: Number(baseDecimals),
  };

  const numAssets = Number(await state.comet.numAssets());
  const assets = [];

  for (let i = 0; i < numAssets; i += 1) {
    const info = await state.comet.getAssetInfo(i);
    const token = new ethers.Contract(info.asset, ERC20_ABI, state.signer || state.provider);

    let symbol = 'UNKNOWN';
    let decimals = decimalsFromScale(info.scale);
    try {
      symbol = await token.symbol();
      decimals = Number(await token.decimals());
    } catch (_) {
      // Keep fallback symbol/decimals if token metadata is inaccessible.
    }

    const priceRaw = await state.comet.getPrice(info.priceFeed);

    const priceUsd = bnToFloat(priceRaw, 8);

    assets.push({
      symbol,
      address: info.asset,
      priceFeed: info.priceFeed,
      decimals,
      priceUsd,
      supplyCap: bnToFloat(info.supplyCap, decimals),
      borrowCF: bnToFloat(info.borrowCollateralFactor, 18),
      liquidateCF: bnToFloat(info.liquidateCollateralFactor, 18),
    });
  }

  state.collaterals = assets;
  els.cometAddress.textContent = `${shortenAddress(state.aliases.comet)} (${state.aliases.comet})`;
  renderAssetSelect();
}

function renderAssetSelect() {
  const items = [state.base, ...state.collaterals];
  els.assetSelect.innerHTML = items
    .map((asset) => `<option value="${asset.address}">${asset.symbol} (${shortenAddress(asset.address)})</option>`)
    .join('');
}

async function refreshUi() {
  if (!state.comet || !state.baseToken) return;

  const base = state.base;
  const account = state.account;

  const [
    totalBorrowRaw,
    baseBorrowMinRaw,
    reservesRaw,
    marketCashRaw,
    baseSupplyRaw,
    baseBorrowRaw,
    basePriceFeedAddress,
    isLiquidatable,
    isBorrowCollateralized,
  ] = await Promise.all([
    state.comet.totalBorrow(),
    state.comet.baseBorrowMin(),
    state.comet.getReserves(),
    state.baseToken.balanceOf(state.aliases.comet),
    account ? state.comet.balanceOf(account) : ethers.constants.Zero,
    account ? state.comet.borrowBalanceOf(account) : ethers.constants.Zero,
    state.comet.baseTokenPriceFeed(),
    account ? state.comet.isLiquidatable(account) : false,
    account ? state.comet.isBorrowCollateralized(account) : true,
  ]);
  const basePriceRaw = await state.comet.getPrice(basePriceFeedAddress);

  const totalBorrow = bnToFloat(totalBorrowRaw, base.decimals);
  const baseBorrowMin = bnToFloat(baseBorrowMinRaw, base.decimals);
  const reserves = bnToFloat(reservesRaw, base.decimals);
  const marketCash = bnToFloat(marketCashRaw, base.decimals);
  const baseSupply = bnToFloat(baseSupplyRaw, base.decimals);
  const baseBorrow = bnToFloat(baseBorrowRaw, base.decimals);
  const basePrice = bnToFloat(basePriceRaw, 8);

  els.totalBorrow.textContent = `${fmtAmount(totalBorrow, 2)} ${base.symbol}`;
  els.marketCash.textContent = `${fmtAmount(marketCash, 2)} ${base.symbol}`;
  els.borrowMin.textContent = `${fmtAmount(baseBorrowMin, 4)} ${base.symbol}`;
  els.reserves.textContent = `${fmtAmount(reserves, 2)} ${base.symbol}`;

  let collateralBorrowPowerUsd = 0;
  let collateralLiqPowerUsd = 0;
  const collateralBreakdown = [];
  const rowHtml = [];

  for (const market of state.collaterals) {
    const token = new ethers.Contract(market.address, ERC20_ABI, state.signer || state.provider);
    const [postedRaw, totalsRaw, priceRaw, walletBalanceRaw] = await Promise.all([
      account ? state.comet.collateralBalanceOf(account, market.address) : ethers.constants.Zero,
      state.comet.totalsCollateral(market.address),
      state.comet.getPrice(market.priceFeed),
      account ? token.balanceOf(account) : ethers.constants.Zero,
    ]);

    const livePriceUsd = bnToFloat(priceRaw, 8);
    const totalSuppliedRaw = totalsRaw.totalSupplyAsset ?? totalsRaw[0];
    const totalSupplied = bnToFloat(totalSuppliedRaw, market.decimals);
    const walletBalance = bnToFloat(walletBalanceRaw, market.decimals);
    const walletBalanceLabel = account ? `${fmtAmount(walletBalance, 4)} ${market.symbol}` : '-';
    const posted = bnToFloat(postedRaw, market.decimals);
    const postedUsd = posted * livePriceUsd;
    if (postedUsd > 0) {
      collateralBreakdown.push({ symbol: market.symbol, usd: postedUsd });
    }
    collateralBorrowPowerUsd += postedUsd * market.borrowCF;
    collateralLiqPowerUsd += postedUsd * market.liquidateCF;

    rowHtml.push(`
      <tr>
        <td><strong>${market.symbol}</strong><br/><span class="mono">${shortenAddress(market.address)}</span></td>
        <td>${fmtUsd(livePriceUsd)}</td>
        <td>${walletBalanceLabel}</td>
        <td>${fmtAmount(posted, 4)} ${market.symbol}</td>
        <td>${fmtAmount(totalSupplied, 2)} ${market.symbol}</td>
        <td>${fmtAmount(market.supplyCap, 2)} ${market.symbol}</td>
        <td>${(market.borrowCF * 100).toFixed(2)}%</td>
        <td>${(market.liquidateCF * 100).toFixed(2)}%</td>
      </tr>
    `);
  }

  els.marketsBody.innerHTML = rowHtml.join('') || '<tr><td colspan="8">No collateral assets found.</td></tr>';

  const baseSupplyUsd = baseSupply * basePrice;
  const baseBorrowUsd = baseBorrow * basePrice;
  const totalCollateralUsd = collateralBreakdown.reduce((sum, row) => sum + row.usd, 0);

  const borrowCapacityUsd = baseSupplyUsd + collateralBorrowPowerUsd;
  const liquidationCapacityUsd = baseSupplyUsd + collateralLiqPowerUsd;
  const liquidationBorrowBase = basePrice > 0 ? liquidationCapacityUsd / basePrice : 0;

  const healthFactor = baseBorrowUsd <= 0 ? Number.POSITIVE_INFINITY : liquidationCapacityUsd / baseBorrowUsd;
  const capacityUsed = borrowCapacityUsd <= 0 ? 0 : (baseBorrowUsd / borrowCapacityUsd) * 100;

  els.baseSupply.textContent = `${fmtAmount(baseSupply, 4)} ${base.symbol} (${fmtUsd(baseSupplyUsd)})`;
  els.baseBorrow.textContent = `${fmtAmount(baseBorrow, 4)} ${base.symbol} (${fmtUsd(baseBorrowUsd)})`;
  els.totalCollateral.textContent = fmtUsd(totalCollateralUsd);
  els.capacityUsed.textContent = `${fmtAmount(Math.max(0, capacityUsed), 2)}%`;
  els.health.textContent = Number.isFinite(healthFactor) ? fmtAmount(healthFactor, 3) : 'Infinity';
  els.liquidationTrigger.textContent = '1.00';

  if (!account) {
    els.borrowCapacityBar.style.width = '0%';
    els.borrowCapacityBar.style.background = '#9fafaa';
    els.borrowCapacityMeta.textContent = 'Connect wallet';
    els.healthFactorBar.style.width = '0%';
    els.healthFactorBar.style.background = '#9fafaa';
    els.healthFactorMeta.textContent = 'Connect wallet';
  } else {
    const usedPctRaw = Math.max(0, capacityUsed);
    const usedPctClamped = Math.min(usedPctRaw, 100);
    els.borrowCapacityBar.style.width = `${usedPctClamped}%`;
    els.borrowCapacityMeta.textContent = `${fmtAmount(usedPctRaw, 2)}% used`;
    els.borrowCapacityBar.style.background =
      usedPctRaw < 65 ? 'linear-gradient(90deg, #00c805 0%, #22d44f 100%)' :
      usedPctRaw < 85 ? 'linear-gradient(90deg, #f5a623 0%, #ffc857 100%)' :
      'linear-gradient(90deg, #ff574d 0%, #ff7e6f 100%)';

    if (!Number.isFinite(healthFactor)) {
      els.healthFactorBar.style.width = '100%';
      els.healthFactorBar.style.background = 'linear-gradient(90deg, #00c805 0%, #22d44f 100%)';
      els.healthFactorMeta.textContent = 'No active borrow';
    } else {
      const hfPct = Math.max(0, Math.min((healthFactor / 2) * 100, 100));
      els.healthFactorBar.style.width = `${hfPct}%`;
      els.healthFactorMeta.textContent = `HF ${fmtAmount(healthFactor, 3)}`;
      els.healthFactorBar.style.background =
        healthFactor < 1.1 ? 'linear-gradient(90deg, #ff574d 0%, #ff7e6f 100%)' :
        healthFactor < 1.5 ? 'linear-gradient(90deg, #f5a623 0%, #ffc857 100%)' :
        'linear-gradient(90deg, #00c805 0%, #22d44f 100%)';
    }
  }

  if (!account) {
    els.liquidationThresholdNote.textContent = 'Liquidation begins when health factor falls below 1.00.';
    els.collateralBreakdown.innerHTML = '<li class="breakdown-item"><span>Connect wallet</span><span>-</span></li>';
  } else if (totalCollateralUsd <= 0) {
    els.liquidationThresholdNote.textContent = 'Supply collateral to establish borrow capacity.';
    els.collateralBreakdown.innerHTML = '<li class="breakdown-item"><span>No collateral supplied</span><span>-</span></li>';
  } else {
    els.liquidationThresholdNote.textContent =
      `At current prices, liquidation begins around ${fmtAmount(liquidationBorrowBase, 4)} ${base.symbol} borrowed (${fmtUsd(liquidationCapacityUsd)}).`;
    const breakdownHtml = collateralBreakdown
      .sort((a, b) => b.usd - a.usd)
      .map((row) => {
        const pct = totalCollateralUsd > 0 ? (row.usd / totalCollateralUsd) * 100 : 0;
        return `<li class=\"breakdown-item\"><span>${row.symbol}</span><span>${fmtUsd(row.usd)} (${fmtAmount(pct, 1)}%)</span></li>`;
      })
      .join('');
    els.collateralBreakdown.innerHTML = breakdownHtml;
  }

  const liq = els.liquidation;
  liq.className = 'pill';
  if (!account) {
    liq.classList.add('neutral');
    liq.textContent = 'Connect wallet to calculate liquidation risk';
  } else if (isLiquidatable || healthFactor < 1) {
    liq.classList.add('bad');
    liq.textContent = 'Liquidatable now';
  } else if (!isBorrowCollateralized || healthFactor < 1.2) {
    liq.classList.add('bad');
    liq.textContent = 'High risk of liquidation';
  } else if (healthFactor < 1.5) {
    liq.classList.add('watch');
    liq.textContent = 'Watch closely';
  } else if (baseBorrowUsd === 0) {
    liq.classList.add('neutral');
    liq.textContent = 'No active borrow';
  } else {
    liq.classList.add('good');
    liq.textContent = 'Healthy collateralization';
  }
}

function selectedAsset() {
  const address = els.assetSelect.value;
  if (address === state.base.address) return state.base;
  return state.collaterals.find((x) => x.address.toLowerCase() === address.toLowerCase());
}

function parseAmountInput(input, decimals) {
  const raw = input.trim();
  if (!raw || Number(raw) <= 0) {
    throw new Error('Enter an amount greater than 0');
  }
  return ethers.utils.parseUnits(raw, decimals);
}

async function runTx(label, txPromise) {
  const tx = await txPromise;
  log(`${label}: submitted ${tx.hash}`);
  const receipt = await tx.wait();
  log(`${label}: confirmed in block ${receipt.blockNumber}`);
  await refreshUi();
}

async function approveAsset() {
  requireConnected();
  const asset = selectedAsset();
  if (!asset) throw new Error('Select an asset');
  const token = new ethers.Contract(asset.address, ERC20_ABI, state.signer);
  await runTx(`Approve ${asset.symbol}`, token.approve(state.aliases.comet, ethers.constants.MaxUint256));
}

async function supplyAsset() {
  requireConnected();
  const asset = selectedAsset();
  if (!asset) throw new Error('Select an asset');
  const amount = parseAmountInput(els.assetAmount.value, asset.decimals);
  await runTx(`Supply ${asset.symbol}`, state.comet.connect(state.signer).supply(asset.address, amount));
}

async function withdrawAsset() {
  requireConnected();
  const asset = selectedAsset();
  if (!asset) throw new Error('Select an asset');
  const amount = parseAmountInput(els.assetAmount.value, asset.decimals);
  await runTx(`Withdraw ${asset.symbol}`, state.comet.connect(state.signer).withdraw(asset.address, amount));
}

async function approveBase() {
  requireConnected();
  const token = new ethers.Contract(state.base.address, ERC20_ABI, state.signer);
  await runTx(`Approve ${state.base.symbol}`, token.approve(state.aliases.comet, ethers.constants.MaxUint256));
}

async function borrowBase() {
  requireConnected();
  const amount = parseAmountInput(els.baseAmount.value, state.base.decimals);
  await runTx(`Borrow ${state.base.symbol}`, state.comet.connect(state.signer).withdraw(state.base.address, amount));
}

async function repayBase() {
  requireConnected();
  const amount = parseAmountInput(els.baseAmount.value, state.base.decimals);
  await runTx(`Repay ${state.base.symbol}`, state.comet.connect(state.signer).supply(state.base.address, amount));
}

function setConnectedUi() {
  if (state.account) {
    els.walletAddress.textContent = `${shortenAddress(state.account)} (${state.account})`;
  } else {
    els.walletAddress.textContent = 'Not connected';
  }

  const onRightChain = state.chainId === CHAIN.id;
  els.networkStatus.textContent = onRightChain
    ? `${CHAIN.name} (chainId ${CHAIN.id})`
    : `Wrong chain (${state.chainId || 'unknown'})`;
  els.networkStatus.className = `value ${onRightChain ? '' : 'warning'}`;

  els.connectBtn.textContent = state.account ? 'Connected' : 'Connect Wallet';
}

async function connectAndLoad() {
  if (state.loading) return;
  state.loading = true;
  try {
    await loadAliases();
    await ensureWallet();
    setConnectedUi();
    await loadMarket();
    await refreshUi();
    log('Market loaded successfully.');
  } catch (err) {
    log(`Error: ${err.message || err}`);
    throw err;
  } finally {
    state.loading = false;
    setConnectedUi();
  }
}

function wireEvents() {
  els.connectBtn.addEventListener('click', () => connectAndLoad().catch(() => {}));
  els.refreshBtn.addEventListener('click', () => refreshUi().catch((e) => log(`Refresh error: ${e.message || e}`)));
  els.themeToggleBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
  els.tabDashboardBtn.addEventListener('click', () => setActiveTab('dashboard'));
  els.tabMarketsBtn.addEventListener('click', () => setActiveTab('markets'));

  els.approveAssetBtn.addEventListener('click', () => approveAsset().catch((e) => log(`Approve error: ${e.message || e}`)));
  els.supplyAssetBtn.addEventListener('click', () => supplyAsset().catch((e) => log(`Supply error: ${e.message || e}`)));
  els.withdrawAssetBtn.addEventListener('click', () => withdrawAsset().catch((e) => log(`Withdraw error: ${e.message || e}`)));

  els.approveBaseBtn.addEventListener('click', () => approveBase().catch((e) => log(`Approve base error: ${e.message || e}`)));
  els.borrowBaseBtn.addEventListener('click', () => borrowBase().catch((e) => log(`Borrow error: ${e.message || e}`)));
  els.repayBaseBtn.addEventListener('click', () => repayBase().catch((e) => log(`Repay error: ${e.message || e}`)));

  const injected = getInjectedProvider();
  if (injected && injected.on) {
    injected.on('accountsChanged', () => connectAndLoad().catch(() => {}));
    injected.on('chainChanged', () => connectAndLoad().catch(() => {}));
  }
}

async function bootstrap() {
  wireEvents();
  initializeTheme();
  setActiveTab('dashboard');
  await loadAliases();
  els.cometAddress.textContent = `${shortenAddress(state.aliases.comet)} (${state.aliases.comet})`;
  if (!getInjectedProvider()) {
    log('No injected wallet found. In MetaMask extension, enable site access for localhost.');
  }
  setConnectedUi();

  if (window.ethereum && window.ethereum.selectedAddress) {
    await connectAndLoad().catch(() => {});
  }

  setInterval(() => {
    if (state.account && state.comet && !state.loading) {
      refreshUi().catch((e) => log(`Auto-refresh error: ${e.message || e}`));
    }
  }, 30000);
}

bootstrap().catch((e) => {
  log(`Bootstrap error: ${e.message || e}`);
});
