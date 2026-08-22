// script.js — theme dropdown + reliable slider & calculation logic

function ready(fn){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

/* THEME: visible dropdown, persistence */
ready(function(){
  const THEME_KEY = 'msm:theme';
  const select = document.getElementById('themeSelect');

  function applyTheme(name){
    if(!name) name = 'default';
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem(THEME_KEY, name); } catch(e) {}
    if(select) select.value = name;
  }

  // restore saved theme and wire select change
  const saved = (function(){ try { return localStorage.getItem(THEME_KEY); } catch(e) { return null; } })();
  applyTheme(saved || 'default');

  if(select){
    select.addEventListener('change', function(e){ applyTheme(e.target.value); });
  }
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
  n = Math.max(1, Math.min(19, n)); // clamp to 1..19

  // allow current up to (target - 1) but DO NOT move target
  const targetVal = Number(tgt.value) || 2;
  const maxAllowed = Math.max(1, Math.min(19, targetVal - 1));
  if(n > maxAllowed) n = maxAllowed;

  cur.value = String(n);
  setTextIf('currentValue', n);
  setAriaIf('currentLevel', 'aria-valuenow', n);

  // update target.min for accessibility (do not change target.value)
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
  n = Math.max(2, Math.min(20, n)); // clamp 2..20

  // ensure target >= current + 1; clamp target (do not move current)
  const curVal = Number(cur.value) || 1;
  const minAllowed = Math.max(2, curVal + 1);
  if(n < minAllowed) n = minAllowed;

  tgt.value = String(n);
  setTextIf('targetValue', n);
  setAriaIf('targetLevel', 'aria-valuenow', n);
}

// cumulative formula unchanged
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
  const foodAlreadyFed = (isNaN(clicksFed) ? 0 : clicksFed * X);
  totalTreats = Math.max(0, totalTreats - foodAlreadyFed);

  if(resultValue) resultValue.innerText = Math.round(totalTreats).toLocaleString();
}

/* Attach listeners after DOM ready and initialize labels */
ready(function(){
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
