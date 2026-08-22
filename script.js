// Theme switching + persistence and existing app logic
(function(){
  const THEME_KEY = 'msm:theme';
  const select = document.getElementById('themeSelect');

  function applyTheme(name){
    if(!name) name = 'default';
    document.documentElement.setAttribute('data-theme', name);
    try{ localStorage.setItem(THEME_KEY, name); }catch(e){}
    if(select) select.value = name;
  }

  // restore saved theme on load
  const saved = (function(){try{return localStorage.getItem(THEME_KEY);}catch(e){return null;}})();
  applyTheme(saved || 'default');

  if(select){
    select.addEventListener('change', function(e){ applyTheme(e.target.value); });
  }
})();

// --- UI glue for sliders and inputs ---
function updateClicksText(val) {
    const el = document.getElementById('clicksValue');
    if(el) el.innerText = val;
    const range = document.getElementById('clicksFed');
    if(range) range.setAttribute('aria-valuenow', String(val));
}

function updateCurrentText(val){
    const el = document.getElementById('currentValue');
    if(el) el.innerText = val;
    const range = document.getElementById('currentLevel');
    if(range) range.setAttribute('aria-valuenow', String(val));
    // ensure target is at least current + 1
    const target = document.getElementById('targetLevel');
    if(target){
      const min = Number(val) + 1;
      target.min = min;
      target.setAttribute('aria-valuemin', String(min));
      if(Number(target.value) <= Number(val)){
        target.value = min;
        updateTargetText(target.value);
      }
    }
}

function updateTargetText(val){
    const el = document.getElementById('targetValue');
    if(el) el.innerText = val;
    const range = document.getElementById('targetLevel');
    if(range) range.setAttribute('aria-valuenow', String(val));
    // ensure target is at least current + 1; if not, nudge current down
    const current = document.getElementById('currentLevel');
    if(current){
      const cur = Number(current.value);
      const tgt = Number(val);
      if(tgt <= cur){
        const newCur = Math.max(1, tgt - 1);
        current.value = newCur;
        updateCurrentText(current.value);
      }
    }
}

// Helper: cumulative treats required from level 1 up to level L (same logic as before)
function cumulativeToLevel(L, X){
  if(L <= 1) return 0;
  if (L <= 16) {
    return 4 * X * (Math.pow(2, L - 1) - 1);
  } else {
    const baseTo16 = 4 * X * (Math.pow(2, 15) - 1);
    const extraLevels = 12 * X * Math.pow(2, 14) * (Math.pow(1.5, L - 16) - 1);
    return baseTo16 + extraLevels;
  }
}

function calculateFood() {
    const X = parseFloat(document.getElementById('foodX').value);
    const current = parseInt(document.getElementById('currentLevel').value, 10);
    const target = parseInt(document.getElementById('targetLevel').value, 10);
    const clicksFed = parseInt(document.getElementById('clicksFed').value, 10);
    
    const resultValue = document.getElementById('resultValue');
    if (isNaN(X) || isNaN(current) || isNaN(target) || target <= current) {
        if(resultValue) resultValue.innerText = "Please enter valid numbers and ensure Target > Current.";
        return;
    }

    // total needed from level current up to target (exclusive of current progress):
    const totalToTarget = cumulativeToLevel(target, X);
    const totalToCurrent = cumulativeToLevel(current, X);
    let totalTreats = totalToTarget - totalToCurrent;

    // subtract food already fed on the current level (clicksFed * X)
    const foodAlreadyFed = (isNaN(clicksFed) ? 0 : clicksFed * X);
    totalTreats = totalTreats - foodAlreadyFed;

    if (totalTreats < 0) totalTreats = 0;

    if(resultValue) resultValue.innerText = Math.round(totalTreats).toLocaleString();
}

// Attach calculate handler to button
(function(){
  const btn = document.getElementById('calculateBtn');
  if(!btn) return;
  btn.addEventListener('click', function(){
    calculateFood();
  });
})();

// Initialize displays on load
(function(){
  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  const clicks = document.getElementById('clicksFed');
  if(cur) updateCurrentText(cur.value);
  if(tgt) updateTargetText(tgt.value);
  if(clicks) updateClicksText(clicks.value);
})();
