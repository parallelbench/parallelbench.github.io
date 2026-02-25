// ── Shared Constants ──

const CHIP_ACTIVE =
  'rounded-full px-3 py-1 text-xs font-medium border transition border-transparent text-white';
const CHIP_INACTIVE =
  'rounded-full px-3 py-1 text-xs font-medium border transition border-slate-300 bg-white text-slate-500';

const DEFAULT_THRESHOLD = 75;

// ── Shared State ──

let STRATEGY_COLORS = {};
let strategyLookup = {};
let taskIdToDisplayName = {};
let familyLookup = {};
let modelFamilyMap = {};
let modelsConfig = null;
let currentThreshold = null;

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
  if (!response.ok)
    throw new Error(`HTTP ${response.status} loading metadata.json`);
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

// ── Task Lookup ──

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

// ── Family Grouping ──

function groupModelsByFamily(models) {
  const familyOrder = (modelsConfig.modelFamilies || []).map((f) => f.id);
  const groups = {};

  for (const model of models) {
    const familyId = model.family || 'other';
    if (!groups[familyId]) groups[familyId] = [];
    groups[familyId].push(model);
  }

  const sorted = [];
  for (const fId of familyOrder) {
    if (groups[fId]) {
      sorted.push({ familyId: fId, models: groups[fId] });
      delete groups[fId];
    }
  }
  for (const [familyId, models] of Object.entries(groups)) {
    sorted.push({ familyId, models });
  }

  return sorted;
}

// ── View Tab Selector ──

function generateViewTabSelector(activePage) {
  const container = document.getElementById('view-tab-selector');
  container.innerHTML = '';

  const thresholdParam =
    currentThreshold && currentThreshold !== DEFAULT_THRESHOLD
      ? `?threshold=${currentThreshold}`
      : '';

  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard', path: 'leaderboard/' },
    { id: 'chart', label: 'Chart', path: 'chart/' },
  ];

  for (const tab of tabs) {
    if (tab.id === activePage) {
      const span = document.createElement('span');
      span.textContent = tab.label;
      span.className =
        'rounded-lg px-6 py-2 text-sm font-semibold bg-white text-slate-900 shadow-sm transition cursor-default';
      container.appendChild(span);
    } else {
      const link = document.createElement('a');
      link.textContent = tab.label;
      link.href = `/${tab.path}${thresholdParam}`;
      link.className =
        'rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700';
      container.appendChild(link);
    }
  }
}

// ── Shared Initialization ──

async function initializeCommon() {
  modelsConfig = await loadModelsConfig();

  if (modelsConfig.strategies) {
    strategyLookup = buildStrategyLookup(modelsConfig.strategies);
    STRATEGY_COLORS = buildStrategyColors(modelsConfig.strategies);
  }

  if (modelsConfig.tasks) {
    buildTaskLookup(modelsConfig.tasks);
  }

  if (modelsConfig.modelFamilies) {
    familyLookup = {};
    for (const family of modelsConfig.modelFamilies) {
      familyLookup[family.id] = family.displayName;
    }
  }

  modelFamilyMap = {};
  for (const model of modelsConfig.models) {
    if (model.family) {
      modelFamilyMap[model.id] = model.family;
    }
  }

  return modelsConfig;
}
