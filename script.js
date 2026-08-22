// Theme switching (simple dropdown) + slider & calculation logic
(function(){
  const THEME_KEY = 'msm:theme';
  const select = document.getElementById('themeSelect');

  function applyTheme(name){
    if(!name) name = 'default';
    document.documentElement.setAttribute('data-theme', name);
    try{ localStorage.setItem(THEME_KEY, name); }catch(e){}
    if(select) select.value = name;
  }

  // init after DOM ready
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function(){
    const saved = (function(){try{return localStorage.getItem(THEME_KEY);}catch(e){return null;}})();
    applyTheme(saved || 'default');
    if(select) select.addEventListener('change', function(e){ applyTheme(e.target.value); });
  });
})();

// --- Slider & calculation logic ---

console.debug('[script.js] loaded');

function updateClicksText(val) {
  console.debug('[script] updateClicksText', val);
  const el = document.getElementById('clicksValue');
  if (el) el.textContent = String(val);
  const r = document.getElementById('clicksFed');
  if (r) r.setAttribute('aria-valuenow', String(val));
}

function updateCurrentText(raw) {
  console.debug('[script] updateCurrentText', raw);
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  const label = document.getElementById('currentValue');
  if (!cur || !tgt) return;

  let n = Number(raw);
  if (isNaN(n)) n = Number(cur.value) || 1;
  n = Math.max(1, Math.min(19, n));

  const targetVal = Number(tgt.value) || 2;
  const maxAllowed = Math.max(1, Math.min(19, targetVal - 1));
  if (n > maxAllowed) n = maxAllowed;

  cur.value = String(n);
  if (label) label.textContent = String(n);
  cur.setAttribute('aria-valuenow', String(n));

  const minForTarget = Math.max(2, n + 1);
  tgt.min = String(minForTarget);
  tgt.setAttribute('aria-valuemin', String(minForTarget));
}

function updateTargetText(raw) {
  console.debug('[script] updateTargetText', raw);
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  const label = document.getElementById('targetValue');
  if (!cur || !tgt) return;

  let n = Number(raw);
  if (isNaN(n)) n = Number(tgt.value) || 2;
  n = Math.max(2, Math.min(20, n));

  const curVal = Number(cur.value) || 1;
  const minAllowed = Math.max(2, curVal + 1);
  if (n < minAllowed) n = minAllowed;

  tgt.value = String(n);
  if (label) label.textContent = String(n);
  tgt.setAttribute('aria-valuenow', String(n));
}

function cumulativeToLevel(L, X) {
  if (L <= 1) return 0;
  if (L <= 16) return 4 * X * (Math.pow(2, L - 1) - 1);
  const baseTo16 = 4 * X * (Math.pow(2, 15) - 1);
  const extraLevels = 12 * X * Math.pow(2, 14) * (Math.pow(1.5, L - 16) - 1);
  return baseTo16 + extraLevels;
}

function calculateFood() {
  console.debug('[script] calculateFood');
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

(function(){
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function(){
    console.debug('[script] init sliders');
    const cur = document.getElementById('currentLevel');
    const tgt = document.getElementById('targetLevel');
    const clicks = document.getElementById('clicksFed');
    const btn = document.getElementById('calculateBtn');

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
  });
})();
