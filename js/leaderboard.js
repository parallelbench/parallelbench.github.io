// Strategy color palette (built from metadata.json in initializeLeaderboard)
let STRATEGY_COLORS = {};

// Chip styles for strategy filter
const CHIP_ACTIVE = 'rounded-full px-3 py-1 text-xs font-medium border transition border-transparent text-white';
const CHIP_INACTIVE = 'rounded-full px-3 py-1 text-xs font-medium border transition border-slate-300 bg-white text-slate-500';

// ── CSV Parsing ──

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((value) => value.trim());
    if (values.length < 3 || values.every((value) => value === '')) continue;

    rows.push({
      task: values[0],
      tps: parseFloat(values[1]),
      accuracy: parseFloat(values[2]),
    });
  }

  return rows;
}

// ── Data Loading ──

async function loadModelsConfig() {
  const response = await fetch('data/metadata.json');
  if (!response.ok) throw new Error(`HTTP ${response.status} loading metadata.json`);
  return await response.json();
}

async function loadStrategyData(modelId, strategyId) {
  try {
    const response = await fetch(`data/figures/${modelId}/${strategyId}.csv`);
    if (!response.ok) return [];
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.warn(`Failed to load data for ${modelId}/${strategyId}:`, error);
    return [];
  }
}

function buildStrategyLookup(strategies) {
  const lookup = {};
  for (const strategy of strategies) {
    lookup[strategy.id] = strategy.displayName;
  }
  return lookup;
}

function buildStrategyColors(strategies) {
  const colors = {};
  for (const strategy of strategies) {
    colors[strategy.id] = strategy.color || '#94a3b8';
  }
  return colors;
}

let strategyLookup = {};

async function loadAllDataForModel(model) {
  const strategyDataMap = {};
  const loadPromises = model.strategies.map(async (strategyId) => {
    const data = await loadStrategyData(model.id, strategyId);
    if (data.length > 0) {
      strategyDataMap[strategyId] = {
        displayName: strategyLookup[strategyId] || strategyId,
        data: data,
      };
    }
  });
  await Promise.all(loadPromises);
  return strategyDataMap;
}

// ── Task Lookup ──

let taskIdToDisplayName = {};

function buildTaskLookup(tasksConfig) {
  taskIdToDisplayName = {};
  for (const category of Object.values(tasksConfig)) {
    for (const task of category.items) {
      taskIdToDisplayName[task.id] = task.displayName;
    }
  }
}

function getTaskDisplayName(taskId) {
  return taskIdToDisplayName[taskId] || taskId;
}

// ── Strategy Filter ──

let selectedStrategies = new Set();

let currentModelStrategies = [];

function generateStrategyFilter(strategyIds) {
  const container = document.getElementById('strategy-filter');
  container.innerHTML = '';
  selectedStrategies.clear();

  currentModelStrategies = strategyIds.map((id) => ({
    id,
    displayName: strategyLookup[id] || id,
  }));

  for (const strategy of currentModelStrategies) {
    selectedStrategies.add(strategy.id);
    const color = STRATEGY_COLORS[strategy.id] || '#94a3b8';

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = strategy.displayName;
    chip.dataset.strategyId = strategy.id;
    chip.className = CHIP_ACTIVE;
    chip.style.backgroundColor = color;

    chip.addEventListener('click', () => toggleStrategy(strategy.id, chip, color));
    chip.addEventListener('dblclick', () => isolateStrategy(strategy.id, color));
    container.appendChild(chip);
  }

  // Remove old listeners by replacing elements
  const allBtn = document.getElementById('strategy-filter-all');
  const noneBtn = document.getElementById('strategy-filter-none');
  const newAllBtn = allBtn.cloneNode(true);
  const newNoneBtn = noneBtn.cloneNode(true);
  allBtn.replaceWith(newAllBtn);
  noneBtn.replaceWith(newNoneBtn);

  newAllBtn.addEventListener('click', () => {
    selectedStrategies.clear();
    for (const s of currentModelStrategies) selectedStrategies.add(s.id);
    updateAllStrategyChipStyles(true);
    updateURL();
    renderCharts();
  });
  newNoneBtn.addEventListener('click', () => {
    selectedStrategies.clear();
    updateAllStrategyChipStyles(false);
    updateURL();
    renderCharts();
  });
}

function toggleStrategy(strategyId, chip, color) {
  if (selectedStrategies.has(strategyId)) {
    selectedStrategies.delete(strategyId);
    chip.className = CHIP_INACTIVE;
    chip.style.backgroundColor = '';
  } else {
    selectedStrategies.add(strategyId);
    chip.className = CHIP_ACTIVE;
    chip.style.backgroundColor = color;
  }
  updateURL();
  renderCharts();
}

function isolateStrategy(strategyId, color) {
  selectedStrategies.clear();
  selectedStrategies.add(strategyId);
  updateAllStrategyChipStyles(false);
  const chip = document.querySelector(`#strategy-filter button[data-strategy-id="${strategyId}"]`);
  if (chip) {
    chip.className = CHIP_ACTIVE;
    chip.style.backgroundColor = color;
  }
  updateURL();
  renderCharts();
}

function updateAllStrategyChipStyles(active) {
  const chips = document.querySelectorAll('#strategy-filter button[data-strategy-id]');
  chips.forEach((chip) => {
    const id = chip.dataset.strategyId;
    const color = STRATEGY_COLORS[id] || '#94a3b8';
    if (active) {
      chip.className = CHIP_ACTIVE;
      chip.style.backgroundColor = color;
    } else {
      chip.className = CHIP_INACTIVE;
      chip.style.backgroundColor = '';
    }
  });
}

function getFilteredStrategyDataMap(strategyDataMap) {
  const filtered = {};
  for (const [strategyId, info] of Object.entries(strategyDataMap)) {
    if (selectedStrategies.has(strategyId)) {
      filtered[strategyId] = info;
    }
  }
  return filtered;
}

// ── Chart Rendering ──

function collectTaskIds(strategyDataMap) {
  const taskIds = new Set();
  for (const strategyInfo of Object.values(strategyDataMap)) {
    for (const row of strategyInfo.data) {
      if (row.task !== 'avg') taskIds.add(row.task);
    }
  }
  return taskIds;
}

function purgePerTaskCharts() {
  const container = document.getElementById('per-task-charts');
  for (const el of container.querySelectorAll('[id^="chart-"]')) {
    Plotly.purge(el);
  }
}

function generatePerTaskCharts(strategyDataMap) {
  const container = document.getElementById('per-task-charts');
  purgePerTaskCharts();
  container.innerHTML = '';

  const allTaskIds = collectTaskIds(strategyDataMap);
  const visibleTaskIds = [...allTaskIds];

  if (visibleTaskIds.length === 0) {
    container.innerHTML =
      '<p class="text-sm text-slate-400 text-center col-span-2 py-8">No data available.</p>';
    return;
  }

  // Sort by task order in metadata.json
  const taskOrder = Object.values(modelsConfig.tasks).flatMap((cat) =>
    cat.items.map((t) => t.id),
  );
  visibleTaskIds.sort(
    (a, b) => (taskOrder.indexOf(a) === -1 ? 999 : taskOrder.indexOf(a)) -
              (taskOrder.indexOf(b) === -1 ? 999 : taskOrder.indexOf(b)),
  );

  for (const taskId of visibleTaskIds) {
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-slate-200 bg-white p-4';

    const chartDiv = document.createElement('div');
    const chartDivId = `chart-${taskId}`;
    chartDiv.id = chartDivId;
    chartDiv.style.width = '100%';
    chartDiv.style.height = '450px';
    card.appendChild(chartDiv);
    container.appendChild(card);

    const traces = [];
    for (const [strategyId, strategyInfo] of Object.entries(strategyDataMap)) {
      const rows = strategyInfo.data
        .filter((row) => row.task === taskId)
        .sort((a, b) => a.tps - b.tps || b.accuracy - a.accuracy);
      if (rows.length === 0) continue;

      traces.push({
        x: rows.map((row) => row.tps),
        y: rows.map((row) => row.accuracy),
        mode: 'lines+markers',
        type: 'scatter',
        name: strategyInfo.displayName,
        marker: {
          size: 7,
          color: STRATEGY_COLORS[strategyId] || '#94a3b8',
          line: { width: 1, color: 'white' },
        },
        line: {
          color: STRATEGY_COLORS[strategyId] || '#94a3b8',
          width: 2,
        },
        hovertemplate:
          'TPS: %{x}<br>' +
          'Accuracy: %{y}%' +
          '<extra>' +
          strategyInfo.displayName +
          '</extra>',
      });
    }

    const layout = {
      title: {
        text: getTaskDisplayName(taskId),
        font: { family: 'Inter, sans-serif', size: 15, color: '#0f172a' },
        x: 0.5,
      },
      xaxis: {
        title: {
          text: '# Tokens per Step (TPS)',
          font: { family: 'Inter, sans-serif', size: 12, color: '#475569' },
        },
        tickvals: [1, 2, 4, 8, 16, 32],
        gridcolor: '#e2e8f0',
        zerolinecolor: '#cbd5e1',
        tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
      },
      yaxis: {
        title: {
          text: 'Accuracy (%)',
          font: { family: 'Inter, sans-serif', size: 12, color: '#475569' },
        },
        range: [0, 105],
        dtick: 10,
        gridcolor: '#e2e8f0',
        zerolinecolor: '#cbd5e1',
        tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
      },
      legend: {
        orientation: 'h',
        y: -0.25,
        x: 0.5,
        xanchor: 'center',
        font: { family: 'Inter, sans-serif', size: 10 },
      },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      margin: { t: 40, r: 20, b: 40, l: 50 },
      hovermode: 'closest',
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(chartDivId, traces, layout, config);
  }
}

function generateAverageChart(strategyDataMap) {
  const container = document.getElementById('average-chart');
  Plotly.purge(container);

  const traces = [];
  for (const [strategyId, strategyInfo] of Object.entries(strategyDataMap)) {
    const rows = strategyInfo.data
      .filter((row) => row.task === 'avg')
      .sort((a, b) => a.tps - b.tps || b.accuracy - a.accuracy);
    if (rows.length === 0) continue;

    traces.push({
      x: rows.map((row) => row.tps),
      y: rows.map((row) => row.accuracy),
      mode: 'lines+markers',
      type: 'scatter',
      name: strategyInfo.displayName,
      marker: {
        size: 7,
        color: STRATEGY_COLORS[strategyId] || '#94a3b8',
        line: { width: 1, color: 'white' },
      },
      line: {
        color: STRATEGY_COLORS[strategyId] || '#94a3b8',
        width: 2,
      },
      hovertemplate:
        'TPS: %{x}<br>' +
        'Accuracy: %{y}%' +
        '<extra>' +
        strategyInfo.displayName +
        '</extra>',
    });
  }

  if (traces.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  const layout = {
    title: {
      text: 'Average Results',
      font: { family: 'Inter, sans-serif', size: 15, color: '#0f172a' },
      x: 0.5,
    },
    xaxis: {
      title: {
        text: '# Tokens per Step (TPS)',
        font: { family: 'Inter, sans-serif', size: 12, color: '#475569' },
      },
      tickvals: [1, 2, 4, 8, 16, 32],
      range: [0, 34],
      gridcolor: '#e2e8f0',
      zerolinecolor: '#cbd5e1',
      tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
    },
    yaxis: {
      title: {
        text: 'Accuracy (%)',
        font: { family: 'Inter, sans-serif', size: 12, color: '#475569' },
      },
      range: [0, 105],
      dtick: 10,
      gridcolor: '#e2e8f0',
      zerolinecolor: '#cbd5e1',
      tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
    },
    legend: {
      orientation: 'h',
      y: -0.25,
      x: 0.5,
      xanchor: 'center',
      font: { family: 'Inter, sans-serif', size: 10 },
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    margin: { t: 40, r: 20, b: 40, l: 50 },
    hovermode: 'closest',
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  Plotly.newPlot('average-chart', traces, layout, config);
}

// ── UI: Model Tabs ──

function generateModelTabs(models, activeModelId) {
  const selector = document.getElementById('model-selector');
  selector.innerHTML = '';

  models.forEach((model) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = model.displayName;
    button.dataset.modelId = model.id;

    const isActive = model.id === activeModelId;

    if (model.strategies.length === 0) {
      button.disabled = true;
      button.className =
        'rounded-lg px-5 py-2 text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed';
      button.title = 'Coming soon';
    } else if (isActive) {
      button.className =
        'rounded-lg px-5 py-2 text-sm font-semibold bg-slate-900 text-white transition';
    } else {
      button.className =
        'rounded-lg px-5 py-2 text-sm font-semibold border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 hover:border-slate-400';
    }

    button.addEventListener('click', () => handleModelSelection(model.id));
    selector.appendChild(button);
  });
}

// ── UI: State Management ──

function showLoading() {
  document.getElementById('chart-loading').classList.remove('hidden');
  document.getElementById('per-task-charts').innerHTML = '';
  document.getElementById('average-chart').style.display = 'none';
  document.getElementById('chart-empty').classList.add('hidden');
}

function showEmpty() {
  document.getElementById('chart-loading').classList.add('hidden');
  document.getElementById('per-task-charts').innerHTML = '';
  document.getElementById('average-chart').style.display = 'none';
  document.getElementById('chart-empty').classList.remove('hidden');
}

function showCharts() {
  document.getElementById('chart-loading').classList.add('hidden');
  document.getElementById('chart-empty').classList.add('hidden');
}

// ── Leaderboard Table ──

async function loadLeaderboardData(modelId) {
  try {
    const response = await fetch(`data/leaderboard/${modelId}.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn(`Failed to load leaderboard data for ${modelId}:`, error);
    return null;
  }
}

function generateThresholdSelector(thresholds, activeThreshold) {
  const container = document.getElementById('threshold-selector');
  container.innerHTML = '';

  thresholds.forEach((threshold) => {
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
      generateThresholdSelector(thresholds, threshold);
      renderLeaderboardTable();
    });

    container.appendChild(button);
  });
}

function renderLeaderboardTable() {
  const tableBody = document.getElementById('leaderboard-table-body');
  const tableContainer = document.getElementById('leaderboard-table-container');

  if (!currentLeaderboardData || !currentThreshold) {
    tableContainer.classList.add('hidden');
    return;
  }

  const results = currentLeaderboardData.results;
  const entries = [];

  for (const [strategyId, thresholdData] of Object.entries(results)) {
    const tps = thresholdData[String(currentThreshold)];
    if (tps !== undefined) {
      entries.push({
        strategyId,
        displayName: strategyLookup[strategyId] || strategyId,
        tps,
      });
    }
  }

  if (entries.length === 0) {
    tableContainer.classList.add('hidden');
    return;
  }

  entries.sort((a, b) => b.tps - a.tps);

  tableContainer.classList.remove('hidden');
  tableBody.innerHTML = '';

  entries.forEach((entry, index) => {
    const color = STRATEGY_COLORS[entry.strategyId] || '#94a3b8';
    const row = document.createElement('tr');
    row.className =
      'border-b border-slate-100 last:border-0' +
      (index % 2 === 1 ? ' bg-slate-50/50' : '');

    const rankCell = document.createElement('td');
    rankCell.className = 'px-6 py-4 text-sm font-medium text-slate-500';
    rankCell.textContent = index + 1;

    const strategyCell = document.createElement('td');
    strategyCell.className = 'px-6 py-4';
    const cellWrapper = document.createElement('div');
    cellWrapper.className = 'flex items-center gap-2';
    const colorDot = document.createElement('span');
    colorDot.className = 'inline-block w-3 h-3 rounded-full shrink-0';
    colorDot.style.backgroundColor = color;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'text-sm font-medium text-slate-900';
    nameSpan.textContent = entry.displayName;
    cellWrapper.appendChild(colorDot);
    cellWrapper.appendChild(nameSpan);
    strategyCell.appendChild(cellWrapper);

    const tpsCell = document.createElement('td');
    tpsCell.className = 'px-6 py-4 text-right text-sm font-semibold text-slate-900';
    tpsCell.textContent = entry.tps;

    row.appendChild(rankCell);
    row.appendChild(strategyCell);
    row.appendChild(tpsCell);
    tableBody.appendChild(row);
  });
}

// ── Main Logic ──

let modelsConfig = null;
let currentModelId = null;
let currentStrategyDataMap = null;
let currentLeaderboardData = null;
let currentThreshold = null;

function renderCharts() {
  if (!currentStrategyDataMap) return;

  const filtered = getFilteredStrategyDataMap(currentStrategyDataMap);

  if (Object.keys(filtered).length === 0) {
    showEmpty();
    return;
  }

  showCharts();
  generateAverageChart(filtered);
  generatePerTaskCharts(filtered);
}

function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  const model = params.get('model');
  const strategies = params.get('strategies');
  return {
    model,
    strategies: strategies ? strategies.split(',') : null,
  };
}

function updateURL() {
  const url = new URL(window.location);
  if (currentModelId) {
    url.searchParams.set('model', currentModelId);
  }
  const modelStrategyIds = currentModelStrategies.map((s) => s.id);
  const allSelected = modelStrategyIds.every((id) => selectedStrategies.has(id));
  if (allSelected || selectedStrategies.size === 0) {
    url.searchParams.delete('strategies');
  } else {
    url.searchParams.set('strategies', [...selectedStrategies].join(','));
  }
  window.history.replaceState({}, '', url);
}

async function handleModelSelection(modelId) {
  currentModelId = modelId;
  const model = modelsConfig.models.find((m) => m.id === modelId);

  generateStrategyFilter(model.strategies);
  generateModelTabs(modelsConfig.models, modelId);
  updateURL();
  showLoading();

  const [strategyData, leaderboardData] = await Promise.all([
    loadAllDataForModel(model),
    loadLeaderboardData(modelId),
  ]);

  currentStrategyDataMap = strategyData;
  currentLeaderboardData = leaderboardData;

  // Render leaderboard table
  const tableSection = document.getElementById('leaderboard-table-section');
  if (currentLeaderboardData && currentLeaderboardData.thresholds.length > 0) {
    currentThreshold = currentLeaderboardData.thresholds[0];
    generateThresholdSelector(currentLeaderboardData.thresholds, currentThreshold);
    renderLeaderboardTable();
    tableSection.classList.remove('hidden');
  } else {
    tableSection.classList.add('hidden');
  }

  renderCharts();
}

async function initializeLeaderboard() {
  try {
    modelsConfig = await loadModelsConfig();

    // Build strategy lookup and colors
    if (modelsConfig.strategies) {
      strategyLookup = buildStrategyLookup(modelsConfig.strategies);
      STRATEGY_COLORS = buildStrategyColors(modelsConfig.strategies);
    }

    // Build task lookup
    if (modelsConfig.tasks) {
      buildTaskLookup(modelsConfig.tasks);
    }

    const urlParams = getURLParams();
    const requestedModel = urlParams.model
      ? modelsConfig.models.find((m) => m.id === urlParams.model && m.strategies.length > 0)
      : null;

    const initialModel = requestedModel || modelsConfig.models.find(
      (model) => model.strategies.length > 0,
    );

    if (initialModel) {
      generateModelTabs(modelsConfig.models, initialModel.id);
      await handleModelSelection(initialModel.id);

      // Apply strategy filter from URL after model is loaded
      if (urlParams.strategies) {
        const validIds = new Set(initialModel.strategies);
        const filtered = urlParams.strategies.filter((id) => validIds.has(id));
        if (filtered.length > 0) {
          selectedStrategies.clear();
          filtered.forEach((id) => selectedStrategies.add(id));
          updateAllStrategyChipStyles(false);
          for (const chip of document.querySelectorAll('#strategy-filter button[data-strategy-id]')) {
            const id = chip.dataset.strategyId;
            if (selectedStrategies.has(id)) {
              const color = STRATEGY_COLORS[id] || '#94a3b8';
              chip.className = CHIP_ACTIVE;
              chip.style.backgroundColor = color;
            }
          }
          updateURL();
          renderCharts();
        } else {
          // No valid strategies found — remove invalid parameter from URL
          const url = new URL(window.location);
          url.searchParams.delete('strategies');
          window.history.replaceState({}, '', url);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize leaderboard:', error);
  }
}

// Mobile menu toggle (same pattern as main.js)
const toggleButton = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');

if (toggleButton && mobileNav) {
  toggleButton.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
  });
}

initializeLeaderboard();
