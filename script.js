// Theme switching + persistence and picker UI
(function(){
  const THEME_KEY = 'msm:theme';
  const select = document.getElementById('themeSelect');

  function applyTheme(name){
    if(!name) name = 'default';
    document.documentElement.setAttribute('data-theme', name);
    try{ localStorage.setItem(THEME_KEY, name); }catch(e){}
    if(select) select.value = name;
    updatePickerDisplay(name);
  }

  const saved = (function(){try{return localStorage.getItem(THEME_KEY);}catch(e){return null;}})();
  document.addEventListener('DOMContentLoaded', function(){ applyTheme(saved || 'default'); if(select){ select.addEventListener('change', function(e){ applyTheme(e.target.value); }); } });
})();

const THEME_SWATCHES = {
  'default': ['#0f1724','#122033'],
  'plant-island':['#7dd77d','#5aa85a'],
  'cold-island':['#8ec6ff','#bfe8ff'],
  'air-island':['#bfe7ff','#f1e6d6'],
  'water-island':['#3dd1c9','#6b8cff'],
  'earth-island':['#d9903e','#b86a2b'],
  'fire-haven':['#ff7043','#ffb86b'],
  'fire-oasis':['#ff7a59','#ffb199'],
  'light-island':['#ffd27a','#ffc4a3'],
  'psychic-island':['#d25bd9','#ff78d1'],
  'faerie-island':['#ff77c2','#bcd78f'],
  'bone-island':['#c9b99a','#8b7b6e'],
  'magical-sanctum':['#6f4cff','#d6b33b'],
  'wublin-island':['#ff2d95','#08f7fe'],
  'ethereal-island':['#b54bff','#00e5ff'],
  'plasma-islet':['#ff2d9c','#ff6ea6'],
  'mech-islet':['#f7d547','#9aa3ab'],
  'shadow-islet':['#7b6cff','#6b5a7a'],
  'crystal-islet':['#00d29b','#58e0b0']
};

function updatePickerDisplay(name){
  const btnLabel = document.getElementById('currentLabel');
  const swatch = document.getElementById('currentSwatch');
  if(btnLabel) btnLabel.textContent = (name || 'default').split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
  if(swatch && THEME_SWATCHES[name]) swatch.style.background = `linear-gradient(90deg, ${THEME_SWATCHES[name][0]}, ${THEME_SWATCHES[name][1]})`;
  const grid = document.getElementById('themeGrid');
  const btn = document.getElementById('currentThemeBtn');
  if(btn && grid) btn.setAttribute('aria-expanded', String(grid.style.display === 'grid'));
}

// Picker interactions
document.addEventListener('DOMContentLoaded', function(){
  const currentBtn = document.getElementById('currentThemeBtn');
  const grid = document.getElementById('themeGrid');
  if(currentBtn && grid){
    currentBtn.addEventListener('click', function(e){
      e.stopPropagation();
      const isOpen = grid.style.display === 'grid';
      grid.style.display = isOpen ? 'none' : 'grid';
      currentBtn.setAttribute('aria-expanded', String(!isOpen));
      grid.setAttribute('aria-hidden', String(isOpen));
      if(!isOpen){ const first = grid.querySelector('.theme-item'); if(first) first.focus(); }
    });

    document.addEventListener('click', function(){ if(grid){ grid.style.display = 'none'; grid.setAttribute('aria-hidden','true'); currentBtn.setAttribute('aria-expanded','false'); } });

    document.querySelectorAll('.theme-item').forEach(function(item){
      item.addEventListener('click', function(e){
        const theme = item.getAttribute('data-theme');
        applyTheme(theme);
        grid.style.display = 'none';
        grid.setAttribute('aria-hidden','true');
        currentBtn.setAttribute('aria-expanded','false');
        e.stopPropagation();
      });
      item.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); item.click(); } });
    });

    document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ if(grid){ grid.style.display='none'; grid.setAttribute('aria-hidden','true'); currentBtn.setAttribute('aria-expanded','false'); } } });
  }
});

// --- Slider & calculation logic ---

// Exposed for inline oninput attributes
function updateClicksText(val) {
  const el = document.getElementById('clicksValue');
  if (el) el.textContent = String(val);
  const r = document.getElementById('clicksFed');
  if (r) r.setAttribute('aria-valuenow', String(val));
}

function updateCurrentText(raw) {
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  const label = document.getElementById('currentValue');
  if (!cur || !tgt) return;

  let n = Number(raw);
  if (isNaN(n)) n = Number(cur.value) || 1;

  // enforce global bounds
  n = Math.max(1, Math.min(19, n));

  // compute max allowed for current so target > current remains true
  const targetVal = Number(tgt.value) || 2;
  const maxAllowed = Math.max(1, Math.min(19, targetVal - 1));

  // clamp current to maxAllowed; do NOT modify target.value
  if (n > maxAllowed) n = maxAllowed;

  cur.value = String(n);
  if (label) label.textContent = String(n);
  cur.setAttribute('aria-valuenow', String(n));

  // update target's minimum so assistive tech and keyboard users understand constraints
  const minForTarget = Math.max(2, n + 1);
  tgt.min = String(minForTarget);
  tgt.setAttribute('aria-valuemin', String(minForTarget));
}

function updateTargetText(raw) {
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  const label = document.getElementById('targetValue');
  if (!cur || !tgt) return;

  let n = Number(raw);
  if (isNaN(n)) n = Number(tgt.value) || 2;

  // enforce global bounds
  n = Math.max(2, Math.min(20, n));

  // ensure target >= current + 1 (clamp target instead of moving current)
  const curVal = Number(cur.value) || 1;
  const minAllowed = Math.max(2, curVal + 1);
  if (n < minAllowed) n = minAllowed;

  tgt.value = String(n);
  if (label) label.textContent = String(n);
  tgt.setAttribute('aria-valuenow', String(n));
}

// cumulative calculation unchanged
function cumulativeToLevel(L, X) {
  if (L <= 1) return 0;
  if (L <= 16) return 4 * X * (Math.pow(2, L - 1) - 1);
  const baseTo16 = 4 * X * (Math.pow(2, 15) - 1);
  const extraLevels = 12 * X * Math.pow(2, 14) * (Math.pow(1.5, L - 16) - 1);
  return baseTo16 + extraLevels;
}

function calculateFood() {
  const X = parseFloat(document.getElementById('foodX').value);
  const current = parseInt(document.getElementById('currentLevel').value, 10);
  const target = parseInt(document.getElementById('targetLevel').value, 10);
  const clicksFed = parseInt(document.getElementById('clicksFed').value, 10);
  const resultValue = document.getElementById('resultValue');

  if (isNaN(X) || isNaN(current) || isNaN(target) || target <= current) {
    if (resultValue) resultValue.innerText = "Please enter valid numbers and ensure Target > Current.";
    return;
  }

  const totalToTarget = cumulativeToLevel(target, X);
  const totalToCurrent = cumulativeToLevel(current, X);
  let totalTreats = totalToTarget - totalToCurrent;
  const foodAlreadyFed = (isNaN(clicksFed) ? 0 : clicksFed * X);
  totalTreats = Math.max(0, totalTreats - foodAlreadyFed);

  if (resultValue) resultValue.innerText = Math.round(totalTreats).toLocaleString();
}

// attach robust listeners after DOM ready and initialize labels
(function initSliders() {
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(function () {
    const cur = document.getElementById('currentLevel');
    const tgt = document.getElementById('targetLevel');
    const clicks = document.getElementById('clicksFed');
    const btn = document.getElementById('calculateBtn');

    if (cur) { cur.addEventListener('input', function (e) { updateCurrentText(e.target.value); }); updateCurrentText(cur.value); }
    if (tgt) { tgt.addEventListener('input', function (e) { updateTargetText(e.target.value); }); updateTargetText(tgt.value); }
    if (clicks) { clicks.addEventListener('input', function (e) { updateClicksText(e.target.value); }); updateClicksText(clicks.value); }
    if (btn) btn.addEventListener('click', calculateFood);
  });
})();
