const CHAIN = {
  id: 46630,
  hexId: '0xb626',
  name: 'Robinhood Testnet',
  rpcUrl: 'https://rpc.testnet.chain.robinhood.com',
  explorer: 'https://explorer.testnet.chain.robinhood.com',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
};
const THEME_KEY = 'robinhood-ui-theme';
const SAVINGS_KEY = 'robinhood-savings-allocations-v1';
const POINTS_KEY_PREFIX = 'robinhood-points-v1';
const CHATBOT_WELCOME = 'I can help with app usage (wallet setup, faucet, supply/borrow, savings, points, and risks). I cannot provide financial or investment advice.';
const CHATBOT_NO_ADVICE = 'I cannot provide financial, investment, tax, legal, or trading advice. I can only explain how to use this app and its mechanics.';
const SAVINGS_STRATEGIES = [
  { id: 'aave_gho', name: 'Aave Savings', asset: 'GHO', apy: 0.0425 },
  { id: 'ethena_usde', name: 'Ethena Savings', asset: 'USDe', apy: 0.058 },
  { id: 'sky_usds', name: 'Sky Savings', asset: 'USDS', apy: 0.0375 },
];

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
  pointsEarned: document.getElementById('position-points-earned'),
  pointsRate: document.getElementById('position-points-rate'),
  liquidationThresholdNote: document.getElementById('liquidation-threshold-note'),
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
  copyCometBtn: document.getElementById('copy-comet-btn'),
  cometExplorerLink: document.getElementById('comet-explorer-link'),
  borrowCapacityBar: document.getElementById('borrow-capacity-bar'),
  borrowCapacityMeta: document.getElementById('borrow-capacity-meta'),
  healthFactorBar: document.getElementById('health-factor-bar'),
  healthFactorMeta: document.getElementById('health-factor-meta'),
  healthZoneLabel: document.getElementById('health-zone-label'),
  healthZoneSafe: document.getElementById('health-zone-safe'),
  healthZoneCaution: document.getElementById('health-zone-caution'),
  healthZoneDanger: document.getElementById('health-zone-danger'),
  tabDashboardBtn: document.getElementById('tab-dashboard-btn'),
  tabHowtoBtn: document.getElementById('tab-howto-btn'),
  tabMarketsBtn: document.getElementById('tab-markets-btn'),
  tabSavingsBtn: document.getElementById('tab-savings-btn'),
  panelDashboard: document.getElementById('panel-dashboard'),
  panelHowto: document.getElementById('panel-howto'),
  panelMarkets: document.getElementById('panel-markets'),
  panelSavings: document.getElementById('panel-savings'),
  howtoAddNetworkBtn: document.getElementById('howto-add-network-btn'),
  savingsBaseSymbol: document.getElementById('savings-base-symbol'),
  savingsAllocationSymbol: document.getElementById('savings-allocation-symbol'),
  savingsBorrowed: document.getElementById('savings-borrowed'),
  savingsAllocated: document.getElementById('savings-allocated'),
  savingsUnallocated: document.getElementById('savings-unallocated'),
  savingsWeightedApy: document.getElementById('savings-weighted-apy'),
  savingsAnnualYield: document.getElementById('savings-annual-yield'),
  savingsMonthlyYield: document.getElementById('savings-monthly-yield'),
  savingsStrategiesBody: document.getElementById('savings-strategies-body'),
  savingsApplyBtn: document.getElementById('savings-apply-btn'),
  savingsResetBtn: document.getElementById('savings-reset-btn'),
  chatbotToggleBtn: document.getElementById('chatbot-toggle-btn'),
  chatbotPanel: document.getElementById('chatbot-panel'),
  chatbotCloseBtn: document.getElementById('chatbot-close-btn'),
  chatbotMessages: document.getElementById('chatbot-messages'),
  chatbotForm: document.getElementById('chatbot-form'),
  chatbotInput: document.getElementById('chatbot-input'),
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
  currentBaseBorrow: 0,
  currentCollateralUsd: 0,
  savingsAllocations: {},
  points: 0,
  pointsStorageKey: null,
  pointsLastUpdatedMs: Date.now(),
  pointsLastPersistMs: 0,
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
  const tabMap = {
    dashboard: {
      panel: els.panelDashboard,
      button: els.tabDashboardBtn,
    },
    howto: {
      panel: els.panelHowto,
      button: els.tabHowtoBtn,
    },
    markets: {
      panel: els.panelMarkets,
      button: els.tabMarketsBtn,
    },
    savings: {
      panel: els.panelSavings,
      button: els.tabSavingsBtn,
    },
  };

  Object.entries(tabMap).forEach(([key, entry]) => {
    const active = key === panel;
    entry.panel.classList.toggle('active', active);
    entry.button.classList.toggle('active', active);
  });
}

function setCometUi(address) {
  if (!address) {
    els.cometAddress.textContent = '-';
    if (els.cometExplorerLink) {
      els.cometExplorerLink.href = CHAIN.explorer;
    }
    return;
  }
  const value = address;
  els.cometAddress.textContent = `${shortenAddress(value)} (${value})`;
  if (els.cometExplorerLink) {
    els.cometExplorerLink.href = `${CHAIN.explorer}/address/${value}`;
  }
}

function setChatbotOpen(open) {
  const isOpen = !!open;
  if (els.chatbotPanel) {
    els.chatbotPanel.hidden = !isOpen;
  }
  if (els.chatbotToggleBtn) {
    els.chatbotToggleBtn.setAttribute('aria-expanded', String(isOpen));
  }
  if (isOpen && els.chatbotInput) {
    els.chatbotInput.focus();
  }
}

function addChatbotMessage(role, text) {
  if (!els.chatbotMessages) return;
  const row = document.createElement('div');
  row.className = `chatbot-msg ${role}`;
  row.textContent = text;
  els.chatbotMessages.appendChild(row);
  els.chatbotMessages.scrollTop = els.chatbotMessages.scrollHeight;
}

function getCollateralAssetSymbols() {
  const symbols = state.collaterals
    .map((asset) => asset.symbol)
    .filter((symbol) => symbol && symbol !== 'UNKNOWN');

  if (symbols.length > 0) return symbols;

  const reserved = new Set([
    'comet',
    'fauceteer',
    'timelock',
    'configurator',
    'rewards',
    'cometFactory',
    'assetListFactory',
    'cometAdmin',
    'configuratorAdmin',
    'cometExt',
    'rUSD',
  ]);

  return Object.keys(state.aliases)
    .filter((key) => !key.includes(':') && !reserved.has(key))
    .filter((key) => /^[A-Za-z0-9]+$/.test(key))
    .sort((a, b) => a.localeCompare(b));
}

function isAdviceRequest(question) {
  const q = question.toLowerCase();
  const advicePatterns = [
    /\bshould i\b/,
    /\bwhat should i\b/,
    /\bbuy\b/,
    /\bsell\b/,
    /\binvest\b/,
    /\btrade\b/,
    /\bprofit\b/,
    /\breturn\b/,
    /\bprice target\b/,
    /\bportfolio\b/,
    /\bbest strategy\b/,
    /\bwhich strategy\b/,
    /\bworth it\b/,
    /\brecommend\b/,
    /\bprediction\b/,
    /\bmoon\b/,
    /\bfinancial advice\b/,
  ];
  return advicePatterns.some((pattern) => pattern.test(q));
}

function getChatbotAnswer(question) {
  const q = question.trim().toLowerCase();
  if (!q) return 'Please type a question.';

  if (isAdviceRequest(q)) {
    return CHATBOT_NO_ADVICE;
  }

  if (
    q.includes('collateral') &&
    (
      q.includes('what assets') ||
      q.includes('which assets') ||
      q.includes('can i provide') ||
      q.includes('accepted') ||
      q.includes('supported')
    )
  ) {
    const assets = getCollateralAssetSymbols();
    if (assets.length === 0) {
      return 'Collateral assets are not loaded yet. Connect wallet and click Refresh, then ask again.';
    }
    return `Supported collateral assets in this market: ${assets.join(', ')}.`;
  }

  if (
    q.includes('borrow') &&
    (
      q.includes('what asset') ||
      q.includes('which asset') ||
      q.includes('what can i borrow') ||
      q.includes('assets can i borrow') ||
      q.includes('borrowable')
    )
  ) {
    const baseSymbol = state.base?.symbol || 'rUSD';
    return `Borrowable asset is the base token only: ${baseSymbol}.`;
  }

  if (
    q.includes('supply') &&
    (
      q.includes('what assets') ||
      q.includes('which assets') ||
      q.includes('what can i supply')
    )
  ) {
    const baseSymbol = state.base?.symbol || 'rUSD';
    const collaterals = getCollateralAssetSymbols();
    if (collaterals.length === 0) {
      return `You can supply ${baseSymbol} as base, plus supported collateral assets once market data loads. Connect wallet and click Refresh.`;
    }
    return `You can supply base token ${baseSymbol}, and collateral assets: ${collaterals.join(', ')}.`;
  }

  if (q.includes('connect') && q.includes('wallet')) {
    return 'Use the Connect Wallet button at the top-right. Approve MetaMask, then ensure network is Robinhood Testnet.';
  }

  if (q.includes('network') || q.includes('chain id') || q.includes('rpc')) {
    return 'Robinhood Testnet settings: Chain ID 46630, RPC https://rpc.testnet.chain.robinhood.com, currency ETH.';
  }

  if (q.includes('faucet') || q.includes('test eth') || q.includes('testnet eth') || q.includes('claim token')) {
    return 'Open the Robinhood faucet from the How To Use tab and claim test ETH + available test tokens. Faucet requests can be rate-limited.';
  }

  if ((q.includes('supply') && q.includes('collateral')) || q.includes('deposit collateral')) {
    return 'Go to Dashboard > Actions > Collateral. Select a token, click Approve, then Supply.';
  }

  if (q.includes('borrow')) {
    return 'Go to Dashboard > Actions > Base. Enter amount and click Borrow Base. Keep health factor above 1.00.';
  }

  if (q.includes('repay') || q.includes('withdraw collateral')) {
    return 'Use Dashboard > Actions. Repay with Repay Base. Withdraw collateral with Withdraw in the Collateral section.';
  }

  if (q.includes('savings') || q.includes('strategy')) {
    return 'Savings tab is a simulated allocation flow on testnet. Set allocation amounts, click Apply Allocations, and note the 0.1% admin fee disclosure.';
  }

  if (q.includes('point')) {
    return 'Points accrue in real time at 1 point per minute per $1 of supplied collateral. Stored per wallet+chain+site in your browser.';
  }

  if (q.includes('liquidation') || q.includes('health factor') || q.includes('hf')) {
    return 'Liquidation trigger is health factor 1.00. Use the HF bar and risk zone indicator on Dashboard to monitor position health.';
  }

  if (q.includes('report') || q.includes('bug') || q.includes('issue')) {
    return 'Use the Report Issue link in the footer to open a GitHub issue.';
  }

  if (q.includes('terms') || q.includes('tos')) {
    return 'Terms of Service is linked in the footer.';
  }

  return 'I can help with: wallet setup, network config, faucet, supply/borrow flow, savings simulation, points, liquidation risk, and issue reporting.';
}

function handleChatbotSubmit() {
  const value = (els.chatbotInput?.value || '').trim();
  if (!value) return;
  addChatbotMessage('user', value);
  const answer = getChatbotAnswer(value);
  addChatbotMessage('assistant', answer);
  if (els.chatbotInput) els.chatbotInput.value = '';
}

function initializeChatbot() {
  if (!els.chatbotMessages) return;
  els.chatbotMessages.innerHTML = '';
  addChatbotMessage('assistant', CHATBOT_WELCOME);
  setChatbotOpen(false);
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
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

function sanitizeAllocationValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function loadSavingsAllocations() {
  const base = Object.fromEntries(SAVINGS_STRATEGIES.map((s) => [s.id, 0]));
  try {
    const raw = localStorage.getItem(SAVINGS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    for (const strategy of SAVINGS_STRATEGIES) {
      base[strategy.id] = sanitizeAllocationValue(parsed[strategy.id]);
    }
    return base;
  } catch (_) {
    return base;
  }
}

function saveSavingsAllocations(allocations) {
  localStorage.setItem(SAVINGS_KEY, JSON.stringify(allocations));
}

function getBaseSymbol() {
  return state.base?.symbol || 'rUSD';
}

function getPointsStorageKey() {
  if (!state.account || !state.chainId) return null;
  return `${POINTS_KEY_PREFIX}:${state.chainId}:${state.account.toLowerCase()}`;
}

function renderPoints() {
  const earned = Number.isFinite(state.points) ? state.points : 0;
  const ratePerMinute = Number.isFinite(state.currentCollateralUsd) ? Math.max(0, state.currentCollateralUsd) : 0;
  els.pointsEarned.textContent = fmtAmount(earned, 2);
  els.pointsRate.textContent = `${fmtAmount(ratePerMinute, 2)} pts/min`;
}

function persistPointsState() {
  if (!state.pointsStorageKey) return;
  try {
    localStorage.setItem(state.pointsStorageKey, JSON.stringify({
      points: Number.isFinite(state.points) ? state.points : 0,
      lastUpdatedMs: Number.isFinite(state.pointsLastUpdatedMs) ? state.pointsLastUpdatedMs : Date.now(),
      collateralUsd: Number.isFinite(state.currentCollateralUsd) ? Math.max(0, state.currentCollateralUsd) : 0,
    }));
    state.pointsLastPersistMs = Date.now();
  } catch (_) {
    // Ignore storage write failures so UI updates continue.
  }
}

function accruePointsNow(nowMs = Date.now()) {
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const previousMs = Number.isFinite(state.pointsLastUpdatedMs) ? state.pointsLastUpdatedMs : safeNow;
  const deltaSec = Math.max(0, (safeNow - previousMs) / 1000);
  if (deltaSec > 0) {
    const ratePerSec = Math.max(0, state.currentCollateralUsd || 0) / 60;
    state.points = Math.max(0, (state.points || 0) + ratePerSec * deltaSec);
  }
  state.pointsLastUpdatedMs = safeNow;
}

function resetPointsView() {
  state.currentCollateralUsd = 0;
  state.points = 0;
  state.pointsStorageKey = null;
  state.pointsLastUpdatedMs = Date.now();
  state.pointsLastPersistMs = 0;
  renderPoints();
}

function hydratePointsForAccount() {
  const nextKey = getPointsStorageKey();

  if (state.pointsStorageKey && state.pointsStorageKey !== nextKey) {
    persistPointsState();
  }

  if (!nextKey) {
    resetPointsView();
    return;
  }

  state.pointsStorageKey = nextKey;
  state.currentCollateralUsd = 0;
  state.points = 0;

  const nowMs = Date.now();
  try {
    const raw = localStorage.getItem(nextKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedPoints = Number(parsed.points);
      const savedCollateralUsd = Number(parsed.collateralUsd);
      const savedLastUpdatedMs = Number(parsed.lastUpdatedMs);

      state.points = Number.isFinite(savedPoints) ? Math.max(0, savedPoints) : 0;

      if (
        Number.isFinite(savedCollateralUsd) &&
        Number.isFinite(savedLastUpdatedMs) &&
        savedLastUpdatedMs > 0 &&
        savedLastUpdatedMs <= nowMs
      ) {
        const offlineDeltaSec = (nowMs - savedLastUpdatedMs) / 1000;
        state.points += Math.max(0, savedCollateralUsd) * (offlineDeltaSec / 60);
      }
    }
  } catch (_) {
    state.points = 0;
  }

  state.pointsLastUpdatedMs = nowMs;
  state.pointsLastPersistMs = 0;
  renderPoints();
  persistPointsState();
}

function tickPoints() {
  if (!state.account || state.chainId !== CHAIN.id) {
    return;
  }
  accruePointsNow();
  renderPoints();
  if (Date.now() - state.pointsLastPersistMs > 10000) {
    persistPointsState();
  }
}

function setHealthZone(zone, label) {
  const entries = [
    ['safe', els.healthZoneSafe],
    ['caution', els.healthZoneCaution],
    ['danger', els.healthZoneDanger],
  ];

  entries.forEach(([key, element]) => {
    if (!element) return;
    element.classList.toggle('active', key === zone);
  });

  if (els.healthZoneLabel) {
    els.healthZoneLabel.textContent = label;
  }
}

function readSavingsAllocationsFromInputs() {
  const result = {};
  const inputs = els.savingsStrategiesBody.querySelectorAll('[data-savings-id]');
  inputs.forEach((input) => {
    const id = input.getAttribute('data-savings-id');
    result[id] = sanitizeAllocationValue(input.value);
  });
  return result;
}

function setSavingsMetrics(allocations) {
  const borrowed = Math.max(0, state.currentBaseBorrow || 0);
  const allocated = SAVINGS_STRATEGIES.reduce((sum, s) => sum + (allocations[s.id] || 0), 0);
  const unallocated = Math.max(0, borrowed - allocated);
  const weightedApy = allocated > 0
    ? SAVINGS_STRATEGIES.reduce((sum, s) => sum + (allocations[s.id] || 0) * s.apy, 0) / allocated
    : 0;
  const annualYield = allocated * weightedApy;
  const monthlyYield = annualYield / 12;
  const baseSymbol = getBaseSymbol();

  els.savingsBaseSymbol.textContent = baseSymbol;
  if (els.savingsAllocationSymbol) {
    els.savingsAllocationSymbol.textContent = baseSymbol;
  }
  els.savingsBorrowed.textContent = `${fmtAmount(borrowed, 4)} ${baseSymbol}`;
  els.savingsAllocated.textContent = `${fmtAmount(allocated, 4)} ${baseSymbol}`;
  els.savingsUnallocated.textContent = `${fmtAmount(unallocated, 4)} ${baseSymbol}`;
  els.savingsWeightedApy.textContent = `${fmtAmount(weightedApy * 100, 2)}%`;
  els.savingsAnnualYield.textContent = `${fmtAmount(annualYield, 4)} ${baseSymbol}`;
  els.savingsMonthlyYield.textContent = `${fmtAmount(monthlyYield, 4)} ${baseSymbol}`;
}

function renderSavingsRows() {
  const borrowed = Math.max(0, state.currentBaseBorrow || 0);

  els.savingsStrategiesBody.innerHTML = SAVINGS_STRATEGIES.map((strategy) => {
    const amount = sanitizeAllocationValue(state.savingsAllocations[strategy.id]);
    const share = borrowed > 0 ? (amount / borrowed) * 100 : 0;

    return `
      <tr>
        <td><strong>${strategy.name}</strong></td>
        <td>${strategy.asset}</td>
        <td>${fmtAmount(strategy.apy * 100, 2)}%</td>
        <td>
          <input
            class="savings-allocation-input"
            type="number"
            min="0"
            step="any"
            data-savings-id="${strategy.id}"
            value="${amount}"
            placeholder="0.0"
          />
        </td>
        <td>${fmtAmount(share, 2)}%</td>
      </tr>
    `;
  }).join('');
}

function renderSavings() {
  renderSavingsRows();
  setSavingsMetrics(state.savingsAllocations);
}

function applySavingsAllocations() {
  const next = readSavingsAllocationsFromInputs();
  const borrowed = Math.max(0, state.currentBaseBorrow || 0);
  const allocated = SAVINGS_STRATEGIES.reduce((sum, s) => sum + (next[s.id] || 0), 0);
  const baseSymbol = getBaseSymbol();

  if (allocated > borrowed + 1e-9) {
    throw new Error(`Allocation exceeds borrowed amount (${fmtAmount(borrowed, 4)} ${baseSymbol})`);
  }

  state.savingsAllocations = next;
  saveSavingsAllocations(next);
  renderSavings();
  log(`Saved savings allocations (${fmtAmount(allocated, 4)} ${baseSymbol}).`);
}

function resetSavingsAllocations() {
  state.savingsAllocations = Object.fromEntries(SAVINGS_STRATEGIES.map((s) => [s.id, 0]));
  saveSavingsAllocations(state.savingsAllocations);
  renderSavings();
  log('Reset savings allocations.');
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

async function addOrSwitchNetworkFromHowTo() {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error('MetaMask not detected. Install MetaMask to add Robinhood testnet.');
  }
  state.injected = injected;
  if (!state.provider) {
    state.provider = new ethers.providers.Web3Provider(injected, 'any');
  }
  await switchToRobinhood();
  const network = await state.provider.getNetwork();
  state.chainId = network.chainId;
  setConnectedUi();
  log('Robinhood testnet added/switched in wallet.');
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
  setCometUi(state.aliases.comet);
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
  accruePointsNow();

  const [
    totalBorrowRaw,
    baseBorrowMinRaw,
    reservesRaw,
    marketCashRaw,
    baseSupplyRaw,
    baseBorrowRaw,
    basePriceFeedAddress,
  ] = await Promise.all([
    state.comet.totalBorrow(),
    state.comet.baseBorrowMin(),
    state.comet.getReserves(),
    state.baseToken.balanceOf(state.aliases.comet),
    account ? state.comet.balanceOf(account) : ethers.constants.Zero,
    account ? state.comet.borrowBalanceOf(account) : ethers.constants.Zero,
    state.comet.baseTokenPriceFeed(),
  ]);
  const basePriceRaw = await state.comet.getPrice(basePriceFeedAddress);

  const totalBorrow = bnToFloat(totalBorrowRaw, base.decimals);
  const baseBorrowMin = bnToFloat(baseBorrowMinRaw, base.decimals);
  const reserves = bnToFloat(reservesRaw, base.decimals);
  const marketCash = bnToFloat(marketCashRaw, base.decimals);
  const baseSupply = bnToFloat(baseSupplyRaw, base.decimals);
  const baseBorrow = bnToFloat(baseBorrowRaw, base.decimals);
  const basePrice = bnToFloat(basePriceRaw, 8);
  state.currentBaseBorrow = baseBorrow;

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
  state.currentCollateralUsd = account ? totalCollateralUsd : 0;
  renderPoints();
  persistPointsState();

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
    setHealthZone(null, 'Connect wallet');
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
      setHealthZone('safe', 'Safe');
    } else {
      const hfPct = Math.max(0, Math.min((healthFactor / 2) * 100, 100));
      els.healthFactorBar.style.width = `${hfPct}%`;
      els.healthFactorMeta.textContent = `HF ${fmtAmount(healthFactor, 3)}`;
      els.healthFactorBar.style.background =
        healthFactor < 1.1 ? 'linear-gradient(90deg, #ff574d 0%, #ff7e6f 100%)' :
        healthFactor < 1.5 ? 'linear-gradient(90deg, #f5a623 0%, #ffc857 100%)' :
        'linear-gradient(90deg, #00c805 0%, #22d44f 100%)';
      if (healthFactor < 1.1) {
        setHealthZone('danger', 'Danger');
      } else if (healthFactor < 1.5) {
        setHealthZone('caution', 'Caution');
      } else {
        setHealthZone('safe', 'Safe');
      }
    }
  }

  if (!account) {
    els.liquidationThresholdNote.textContent = 'Liquidation begins when health factor falls below 1.00.';
    els.collateralBreakdown.innerHTML = '<li class="breakdown-item"><span>Connect wallet</span><span>-</span></li>';
  } else if (totalCollateralUsd <= 0) {
    els.liquidationThresholdNote.textContent = 'Supply collateral to establish borrow capacity.';
    els.collateralBreakdown.innerHTML = '<li class="breakdown-item"><span>No collateral supplied</span><span>-</span></li>';
  } else {
    els.liquidationThresholdNote.textContent = 'Liquidation begins when health factor falls below 1.00.';
    const breakdownHtml = collateralBreakdown
      .sort((a, b) => b.usd - a.usd)
      .map((row) => {
        const pct = totalCollateralUsd > 0 ? (row.usd / totalCollateralUsd) * 100 : 0;
        return `<li class=\"breakdown-item\"><span>${row.symbol}</span><span>${fmtUsd(row.usd)} (${fmtAmount(pct, 1)}%)</span></li>`;
      })
      .join('');
    els.collateralBreakdown.innerHTML = breakdownHtml;
  }

  renderSavings();
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
    hydratePointsForAccount();
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
  els.copyCometBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.aliases.comet);
      log('Copied Comet address');
    } catch (e) {
      log(`Copy error: ${e.message || e}`);
    }
  });
  els.tabDashboardBtn.addEventListener('click', () => setActiveTab('dashboard'));
  els.tabHowtoBtn.addEventListener('click', () => setActiveTab('howto'));
  els.tabMarketsBtn.addEventListener('click', () => setActiveTab('markets'));
  els.tabSavingsBtn.addEventListener('click', () => setActiveTab('savings'));
  els.howtoAddNetworkBtn.addEventListener('click', () => addOrSwitchNetworkFromHowTo().catch((e) => log(`Network setup error: ${e.message || e}`)));

  els.approveAssetBtn.addEventListener('click', () => approveAsset().catch((e) => log(`Approve error: ${e.message || e}`)));
  els.supplyAssetBtn.addEventListener('click', () => supplyAsset().catch((e) => log(`Supply error: ${e.message || e}`)));
  els.withdrawAssetBtn.addEventListener('click', () => withdrawAsset().catch((e) => log(`Withdraw error: ${e.message || e}`)));

  els.approveBaseBtn.addEventListener('click', () => approveBase().catch((e) => log(`Approve base error: ${e.message || e}`)));
  els.borrowBaseBtn.addEventListener('click', () => borrowBase().catch((e) => log(`Borrow error: ${e.message || e}`)));
  els.repayBaseBtn.addEventListener('click', () => repayBase().catch((e) => log(`Repay error: ${e.message || e}`)));
  els.savingsApplyBtn.addEventListener('click', () => {
    try {
      applySavingsAllocations();
    } catch (e) {
      log(`Savings apply error: ${e.message || e}`);
    }
  });
  els.savingsResetBtn.addEventListener('click', () => resetSavingsAllocations());
  els.savingsStrategiesBody.addEventListener('input', () => {
    const preview = readSavingsAllocationsFromInputs();
    setSavingsMetrics(preview);
  });
  els.chatbotToggleBtn.addEventListener('click', () => {
    const shouldOpen = els.chatbotPanel ? els.chatbotPanel.hidden : true;
    setChatbotOpen(shouldOpen);
  });
  els.chatbotCloseBtn.addEventListener('click', () => setChatbotOpen(false));
  els.chatbotForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleChatbotSubmit();
  });

  const injected = getInjectedProvider();
  if (injected && injected.on) {
    injected.on('accountsChanged', () => connectAndLoad().catch(() => {}));
    injected.on('chainChanged', () => connectAndLoad().catch(() => {}));
  }
}

async function bootstrap() {
  wireEvents();
  initializeTheme();
  initializeChatbot();
  setActiveTab('dashboard');
  renderPoints();
  state.savingsAllocations = loadSavingsAllocations();
  await loadAliases();
  setCometUi(state.aliases.comet);
  renderSavings();
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

  setInterval(() => {
    tickPoints();
  }, 1000);

  window.addEventListener('beforeunload', () => {
    accruePointsNow();
    persistPointsState();
  });
}

bootstrap().catch((e) => {
  log(`Bootstrap error: ${e.message || e}`);
});
