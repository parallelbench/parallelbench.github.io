// ── Leaderboard Page Logic ──
// Depends on: js/common.js (loaded first)

let allLeaderboardData = {};

async function loadAllLeaderboardData() {
  allLeaderboardData = {};
  const loadPromises = modelsConfig.models
    .filter((m) => m.strategies.length > 0)
    .map(async (model) => {
      const data = await loadLeaderboardData(model.id);
      if (data) {
        allLeaderboardData[model.id] = data;
      }
    });
  await Promise.all(loadPromises);
}

// ── Combined Leaderboard Table ──

function generateCombinedThresholdSelector(activeThreshold) {
  const container = document.getElementById('combined-threshold-selector');
  container.innerHTML = '';

  const allThresholds = new Set();
  for (const data of Object.values(allLeaderboardData)) {
    for (const t of data.thresholds) {
      allThresholds.add(t);
    }
  }
  const thresholds = [...allThresholds].sort((a, b) => b - a);

  for (const threshold of thresholds) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${threshold}%`;
    button.dataset.threshold = threshold;

    if (threshold === activeThreshold) {
      button.className =
        'rounded-lg px-4 py-1.5 text-sm font-semibold bg-slate-900 text-white transition';
    } else {
      button.className =
        'rounded-lg px-4 py-1.5 text-sm font-semibold border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50';
    }

    button.addEventListener('click', () => {
      currentThreshold = threshold;
      generateCombinedThresholdSelector(threshold);
      renderCombinedLeaderboardTable();
      generateViewTabSelector('leaderboard');
      updateLeaderboardURL();
    });

    container.appendChild(button);
  }

  return thresholds;
}

function renderCombinedLeaderboardTable() {
  const tableBody = document.getElementById('combined-leaderboard-table-body');

  const modelDisplayNames = {};
  for (const model of modelsConfig.models) {
    modelDisplayNames[model.id] = model.displayName;
  }

  const entries = [];
  for (const [modelId, data] of Object.entries(allLeaderboardData)) {
    for (const [strategyId, thresholdData] of Object.entries(data.results)) {
      const tps = thresholdData[String(currentThreshold)];
      if (tps !== undefined && tps > 0) {
        entries.push({
          modelId,
          modelDisplayName: modelDisplayNames[modelId] || modelId,
          strategyId,
          strategyDisplayName: strategyLookup[strategyId] || strategyId,
          tps,
        });
      }
    }
  }

  entries.sort((a, b) => b.tps - a.tps);

  tableBody.innerHTML = '';

  if (entries.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4" class="px-6 py-8 text-center text-sm text-slate-400">No methods meet this accuracy threshold.</td></tr>';
    return;
  }

  entries.forEach((entry, index) => {
    const color = STRATEGY_COLORS[entry.strategyId] || '#94a3b8';
    const row = document.createElement('tr');
    row.className =
      'border-b border-slate-100 last:border-0' +
      (index % 2 === 1 ? ' bg-slate-50/50' : '');

    const rankCell = document.createElement('td');
    rankCell.className = 'px-6 py-4 text-sm font-medium text-slate-500';
    rankCell.textContent = index + 1;

    const modelCell = document.createElement('td');
    modelCell.className = 'px-6 py-4 text-sm font-medium text-slate-900';
    modelCell.textContent = entry.modelDisplayName;

    const strategyCell = document.createElement('td');
    strategyCell.className = 'px-6 py-4';
    const cellWrapper = document.createElement('div');
    cellWrapper.className = 'flex items-center gap-2';
    const colorDot = document.createElement('span');
    colorDot.className = 'inline-block w-3 h-3 rounded-full shrink-0';
    colorDot.style.backgroundColor = color;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'text-sm font-medium text-slate-900';
    nameSpan.textContent = entry.strategyDisplayName;
    cellWrapper.appendChild(colorDot);
    cellWrapper.appendChild(nameSpan);
    strategyCell.appendChild(cellWrapper);

    const tpsCell = document.createElement('td');
    tpsCell.className =
      'px-6 py-4 text-right text-sm font-semibold text-slate-900';
    tpsCell.textContent = entry.tps;

    row.appendChild(rankCell);
    row.appendChild(modelCell);
    row.appendChild(strategyCell);
    row.appendChild(tpsCell);
    tableBody.appendChild(row);
  });
}

// ── URL Management ──

function getLeaderboardURLParams() {
  const params = new URLSearchParams(window.location.search);
  const threshold = params.get('threshold');
  return {
    threshold: threshold ? Number(threshold) : null,
  };
}

function updateLeaderboardURL() {
  const url = new URL(window.location);

  if (currentThreshold && currentThreshold !== DEFAULT_THRESHOLD) {
    url.searchParams.set('threshold', currentThreshold);
  } else {
    url.searchParams.delete('threshold');
  }

  window.history.replaceState({}, '', url);
}

// ── Initialization ──

async function initializeLeaderboard() {
  try {
    await initializeCommon();

    const urlParams = getLeaderboardURLParams();

    // Render tab selector
    generateViewTabSelector('leaderboard');

    // Load all leaderboard data
    await loadAllLeaderboardData();

    // Determine initial threshold
    const allThresholds = new Set();
    for (const data of Object.values(allLeaderboardData)) {
      for (const t of data.thresholds) {
        allThresholds.add(t);
      }
    }
    const sortedThresholds = [...allThresholds].sort((a, b) => b - a);

    if (
      urlParams.threshold &&
      sortedThresholds.includes(urlParams.threshold)
    ) {
      currentThreshold = urlParams.threshold;
    } else if (sortedThresholds.includes(DEFAULT_THRESHOLD)) {
      currentThreshold = DEFAULT_THRESHOLD;
    } else if (sortedThresholds.length > 0) {
      currentThreshold = sortedThresholds[0];
    }

    // Render table
    generateCombinedThresholdSelector(currentThreshold);
    renderCombinedLeaderboardTable();

    // Hide loading, show table
    document.getElementById('leaderboard-loading').classList.add('hidden');
    document
      .getElementById('leaderboard-table-wrapper')
      .classList.remove('hidden');
  } catch (error) {
    console.error('Failed to initialize leaderboard:', error);
  }
}

// Mobile menu toggle
const toggleButton = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');

if (toggleButton && mobileNav) {
  toggleButton.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
  });
}

initializeLeaderboard();
