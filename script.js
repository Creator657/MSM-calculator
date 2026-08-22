// Theme switching + persistence and existing app logic
(function(){
  const THEME_KEY = 'msm:theme';
  const select = document.getElementById('themeSelect');

  function applyTheme(name){
    if(!name) name = 'default';
    document.documentElement.setAttribute('data-theme', name);
    try{ localStorage.setItem(THEME_KEY, name); }catch(e){}
    if(select) select.value = name;
    // update custom picker display
    updatePickerDisplay(name);
  }

  // restore saved theme on load
  const saved = (function(){try{return localStorage.getItem(THEME_KEY);}catch(e){return null;}})();
  applyTheme(saved || 'default');

  if(select){
    select.addEventListener('change', function(e){ applyTheme(e.target.value); });
  }
})();

// --- Theme picker UI glue ---
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
  // update aria-expanded
  const grid = document.getElementById('themeGrid');
  const btn = document.getElementById('currentThemeBtn');
  if(btn && grid) btn.setAttribute('aria-expanded', String(grid.style.display === 'grid'));
}

// wire up the picker interactions
(function(){
  const currentBtn = document.getElementById('currentThemeBtn');
  const grid = document.getElementById('themeGrid');
  if(!currentBtn || !grid) return;

  currentBtn.addEventListener('click', function(e){
    e.stopPropagation();
    const isOpen = grid.style.display === 'grid';
    grid.style.display = isOpen ? 'none' : 'grid';
    currentBtn.setAttribute('aria-expanded', String(!isOpen));
    grid.setAttribute('aria-hidden', String(isOpen));
  });

  // click outside to close
  document.addEventListener('click', function(){ if(grid) { grid.style.display = 'none'; grid.setAttribute('aria-hidden','true'); currentBtn.setAttribute('aria-expanded','false'); } });

  // each theme item
  document.querySelectorAll('.theme-item').forEach(function(item){
    item.addEventListener('click', function(e){
      const theme = item.getAttribute('data-theme');
      applyTheme(theme);
      grid.style.display = 'none';
      grid.setAttribute('aria-hidden','true');
      currentBtn.setAttribute('aria-expanded','false');
      e.stopPropagation();
    });
  });

  // close on escape when grid focussed
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ if(grid){ grid.style.display='none'; grid.setAttribute('aria-hidden','true'); currentBtn.setAttribute('aria-expanded','false'); } } });
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
  // update picker display from saved theme
  const savedTheme = (function(){try{return localStorage.getItem('msm:theme');}catch(e){return null;}})() || 'default';
  updatePickerDisplay(savedTheme);
})();
