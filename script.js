// script.js — theme dropdown (loaded from themes.json) + slider & calculation logic + food optimizer

function ready(fn){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

/* THEME: custom dropdown, loaded from data/themes.json, with swatch previews + persistence */
ready(function(){
  const THEME_KEY = 'msm:theme';
  let THEMES = [];
  let currentId = 'default';

  const btn = document.getElementById('themeButton');
  const list = document.getElementById('themeList');
  const btnSwatch = document.getElementById('themeSwatchCurrent');
  const btnLabel = document.getElementById('themeButtonLabel');
  if(!btn || !list) return;

  function findTheme(id){
    return THEMES.find(t => t.id === id) || THEMES[0];
  }

  function setSwatch(el, theme){
    el.style.setProperty('--sw1', theme.accent);
    el.style.setProperty('--sw2', theme.accent2);
  }

  // Simple relative-luminance check to auto-pick readable button text per theme
  function relLuminance(hex){
    const c = hex.replace('#','');
    if(c.length !== 6) return 0.5;
    const r = parseInt(c.substring(0,2),16)/255;
    const g = parseInt(c.substring(2,4),16)/255;
    const b = parseInt(c.substring(4,6),16)/255;
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }
  function getButtonText(theme){
    const lum = (relLuminance(theme.accent) + relLuminance(theme.accent2)) / 2;
    return lum > 0.55 ? '#0b1220' : '#f5f7fa';
  }

  function buildList(){
    list.innerHTML = '';
    THEMES.forEach(theme => {
      const li = document.createElement('li');
      li.className = 'theme-option';
      li.id = 'themeOpt-' + theme.id;
      li.setAttribute('role', 'option');
      li.setAttribute('data-theme-id', theme.id);
      li.setAttribute('aria-selected', theme.id === currentId ? 'true' : 'false');
      li.tabIndex = -1;

      const sw = document.createElement('span');
      sw.className = 'theme-swatch';
      setSwatch(sw, theme);

      const label = document.createElement('span');
      label.textContent = theme.label;

      li.appendChild(sw);
      li.appendChild(label);
      li.addEventListener('click', () => {
        applyTheme(theme.id);
        closeList();
        btn.focus();
      });
      list.appendChild(li);
    });
  }

  function applyTheme(id){
    const theme = findTheme(id);
    if(!theme) return;
    currentId = theme.id;

    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    root.style.setProperty('--bg-1', theme.bg1);
    root.style.setProperty('--bg-2', theme.bg2);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-2', theme.accent2);
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--btn-text', getButtonText(theme));

    try { localStorage.setItem(THEME_KEY, theme.id); } catch(e) {}

    setSwatch(btnSwatch, theme);
    btnLabel.textContent = theme.label;
    list.querySelectorAll('.theme-option').forEach(li => {
      const isActive = li.getAttribute('data-theme-id') === theme.id;
      li.setAttribute('aria-selected', isActive ? 'true' : 'false');
      li.classList.toggle('is-active', isActive);
    });
  }

  function openList(){
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    const active = list.querySelector('.theme-option[aria-selected="true"]') || list.querySelector('.theme-option');
    if(active) active.focus();
  }
  function closeList(){
    list.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }
  function toggleList(){
    if(list.hidden) openList(); else closeList();
  }

  btn.addEventListener('click', toggleList);

  list.addEventListener('keydown', (e) => {
    const options = Array.from(list.querySelectorAll('.theme-option'));
    const idx = options.indexOf(document.activeElement);
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      const next = options[Math.min(options.length - 1, idx + 1)];
      if(next) next.focus();
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      const prev = options[Math.max(0, idx - 1)];
      if(prev) prev.focus();
    } else if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      const el = document.activeElement;
      if(el && el.classList.contains('theme-option')){
        applyTheme(el.getAttribute('data-theme-id'));
        closeList();
        btn.focus();
      }
    } else if(e.key === 'Escape'){
      closeList();
      btn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if(!list.hidden && !list.contains(e.target) && e.target !== btn){
      closeList();
    }
  });

  fetch('data/themes.json')
    .then(res => {
      if(!res.ok) throw new Error(`Failed to load themes.json: ${res.status}`);
      return res.json();
    })
    .then(data => {
      THEMES = data;
      buildList();
      const saved = (function(){ try { return localStorage.getItem(THEME_KEY); } catch(e) { return null; } })();
      applyTheme(saved || 'default');
    })
    .catch(err => {
      console.error('❌ Error loading themes:', err);
    });
});

/* SLIDERS and CALCULATION */

function setTextIf(id, text){ const el = document.getElementById(id); if(el) el.textContent = String(text); }
function setAriaIf(id, prop, val){ const el = document.getElementById(id); if(el) el.setAttribute(prop, String(val)); }

function updateClicksText(v){
  setTextIf('clicksValue', v);
  setAriaIf('clicksFed', 'aria-valuenow', v);
}

function updateCurrentText(raw){
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  if(!cur || !tgt) return;

  let n = Number(raw);
  if(isNaN(n)) n = Number(cur.value) || 1;
  n = Math.max(1, Math.min(19, n));

  const targetVal = Number(tgt.value) || 2;
  const maxAllowed = Math.max(1, Math.min(19, targetVal - 1));
  if(n > maxAllowed) n = maxAllowed;

  cur.value = String(n);
  setTextIf('currentValue', n);
  setAriaIf('currentLevel', 'aria-valuenow', n);

  const minForTarget = Math.max(2, n + 1);
  tgt.min = String(minForTarget);
  tgt.setAttribute('aria-valuemin', String(minForTarget));
}

function updateTargetText(raw){
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  if(!cur || !tgt) return;

  let n = Number(raw);
  if(isNaN(n)) n = Number(tgt.value) || 2;
  n = Math.max(2, Math.min(20, n));

  const curVal = Number(cur.value) || 1;
  const minAllowed = Math.max(2, curVal + 1);
  if(n < minAllowed) n = minAllowed;

  tgt.value = String(n);
  setTextIf('targetValue', n);
  setAriaIf('targetLevel', 'aria-valuenow', n);
}

function cumulativeToLevel(L, X){
  if(L <= 1) return 0;
  if(L <= 16) return 4 * X * (Math.pow(2, L - 1) - 1);
  const baseTo16 = 4 * X * (Math.pow(2, 15) - 1);
  const extraLevels = 12 * X * Math.pow(2, 14) * (Math.pow(1.5, L - 16) - 1);
  return baseTo16 + extraLevels;
}

function calculateFood(){
  const X = parseFloat(document.getElementById('foodX').value);
  const current = parseInt(document.getElementById('currentLevel').value, 10);
  const target = parseInt(document.getElementById('targetLevel').value, 10);
  const clicksFed = parseInt(document.getElementById('clicksFed').value, 10);
  const resultValue = document.getElementById('resultValue');

  if(isNaN(X) || isNaN(current) || isNaN(target) || target <= current){
    if(resultValue) resultValue.innerText = "Please enter valid numbers and ensure Target > Current.";
    return;
  }

  const totalToTarget = cumulativeToLevel(target, X);
  const totalToCurrent = cumulativeToLevel(current, X);
  let totalTreats = totalToTarget - totalToCurrent;

  // Each level takes exactly 4 feeds, and the cost of a level scales with the
  // doubling (or 1.5x past level 16) curve — so a feed already done on the
  // current level is worth a share of THAT level's cost, not a flat X.
  if(!isNaN(clicksFed) && clicksFed > 0){
    const nextLevelCost = cumulativeToLevel(current + 1, X) - cumulativeToLevel(current, X);
    const costPerFeed = nextLevelCost / 4;
    const foodAlreadyFed = clicksFed * costPerFeed;
    totalTreats = Math.max(0, totalTreats - foodAlreadyFed);
  }

  if(resultValue) resultValue.innerText = Math.round(totalTreats).toLocaleString();

  const optimizerInput = document.getElementById('optimizerTreats');
  if(optimizerInput) {
    optimizerInput.value = Math.round(totalTreats);
  }
}

  const totalToTarget = cumulativeToLevel(target, X);
  const totalToCurrent = cumulativeToLevel(current, X);
  let totalTreats = totalToTarget - totalToCurrent;
  const foodAlreadyFed = (isNaN(clicksFed) ? 0 : clicksFed * X);
  totalTreats = Math.max(0, totalTreats - foodAlreadyFed);

  if(resultValue) resultValue.innerText = Math.round(totalTreats).toLocaleString();

  const optimizerInput = document.getElementById('optimizerTreats');
  if(optimizerInput) {
    optimizerInput.value = Math.round(totalTreats);
  }

/* FOOD OPTIMIZER */

let foodDatabase = [];
let optimizer = null;

async function initializeFoodOptimizer() {
  try {
    const response = await fetch('data/foods.json');
    foodDatabase = await response.json();
    optimizer = new FoodOptimizer(foodDatabase);
    console.log('✅ Food database loaded!', foodDatabase);
  } catch (error) {
    console.error('❌ Error loading food database:', error);
  }
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function displayRecipe(result) {
  const container = document.getElementById('recipeContainer');
  if (!container) return;

  let html = '<div class="recipe-list">';

  for (let item of result.recipe) {
    html += `
      <div class="recipe-item">
        <div class="recipe-header">
          <span class="food-name">${item.name}</span>
          <span class="quantity">×${item.quantity}</span>
        </div>
        <div class="recipe-stats">
          <div class="stat">
            <span class="stat-label">Treats:</span>
            <span class="stat-value">${item.treats.toLocaleString()}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Cost:</span>
            <span class="stat-value">${item.cost.toLocaleString()}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time:</span>
            <span class="stat-value">${formatTime(item.time)}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Oven:</span>
            <span class="stat-value">${item.ovenSize}</span>
          </div>
        </div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function displayComparison(allStrategies) {
  const container = document.getElementById('comparisonContainer');
  const resultsDiv = document.getElementById('comparisonResults');

  if (!resultsDiv) return;

  let html = '<div class="comparison-grid">';

  for (let strategy of ['fastest', 'efficient', 'balanced']) {
    const result = allStrategies[strategy];
    if (!result) continue;

    html += `
      <div class="strategy-card">
        <h5>${strategy === 'fastest' ? '⚡ Fastest' : strategy === 'efficient' ? '💰 Efficient' : '⚖️ Balanced'}</h5>
        <div class="strategy-details">
          <div>Cost: ${result.totalCost.toLocaleString()}</div>
          <div>Time: ${formatTime(result.totalTime)}</div>
          <div>Items: ${result.recipe.length}</div>
        </div>
      </div>
    `;
  }

  html += '</div>';
  resultsDiv.innerHTML = html;
  container.style.display = 'block';
}

function runOptimizer() {
  if (!optimizer) {
    alert('❌ Food database not loaded yet. Please refresh the page.');
    return;
  }

  const treatsInput = document.getElementById('optimizerTreats');
  const strategy = document.getElementById('strategySelect').value;
  const treats = parseInt(treatsInput.value, 10);

  if (isNaN(treats) || treats <= 0) {
    alert('⚠️ Please enter a valid treat goal!');
    return;
  }

  const result = optimizer.optimize(treats, strategy);
  const allStrategies = optimizer.getAllStrategies(treats);

  const resultsDiv = document.getElementById('optimizerResults');
  const summaryDiv = document.getElementById('optimizerSummary');

  if (summaryDiv) {
    summaryDiv.innerHTML = `
      <div class="summary-box">
        <div class="summary-line">📦 Strategy: <strong>${strategy.toUpperCase()}</strong></div>
        <div class="summary-line">🎯 Target: <strong>${treats.toLocaleString()}</strong> treats</div>
        <div class="summary-line">✅ Total: <strong>${result.totalTreats.toLocaleString()}</strong> treats</div>
        <div class="summary-line">💰 Cost: <strong>${result.totalCost.toLocaleString()}</strong></div>
        <div class="summary-line">⏱️ Time: <strong>${formatTime(result.totalTime)}</strong></div>
        <div class="summary-line">📋 Recipe: <strong>${result.recipe.length}</strong> food type(s)</div>
      </div>
    `;
  }

  displayRecipe(result);
  displayComparison(allStrategies);
  resultsDiv.style.display = 'block';
}

/* Attach listeners after DOM ready and initialize */
ready(function(){
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  const clicks = document.getElementById('clicksFed');
  const btn = document.getElementById('calculateBtn');
  const optimizeBtn = document.getElementById('optimizeBtn');

  if(cur){
    cur.addEventListener('input', function(e){ updateCurrentText(e.target.value); });
    cur.addEventListener('change', function(e){ updateCurrentText(e.target.value); });
    updateCurrentText(cur.value);
  }
  if(tgt){
    tgt.addEventListener('input', function(e){ updateTargetText(e.target.value); });
    tgt.addEventListener('change', function(e){ updateTargetText(e.target.value); });
    updateTargetText(tgt.value);
  }
  if(clicks){
    clicks.addEventListener('input', function(e){ updateClicksText(e.target.value); });
    clicks.addEventListener('change', function(e){ updateClicksText(e.target.value); });
    updateClicksText(clicks.value);
  }
  if(btn) btn.addEventListener('click', calculateFood);
  if(optimizeBtn) optimizeBtn.addEventListener('click', runOptimizer);

  initializeFoodOptimizer();
});
