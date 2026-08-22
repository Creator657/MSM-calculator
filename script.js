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
  // Delay applying until DOM is ready in case updatePickerDisplay needs elements
  document.addEventListener('DOMContentLoaded', function(){ applyTheme(saved || 'default'); if(select){ select.addEventListener('change', function(e){ applyTheme(e.target.value); }); } });
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

// wire up the picker interactions once DOM is ready
document.addEventListener('DOMContentLoaded', function(){
  const currentBtn = document.getElementById('currentThemeBtn');
  const grid = document.getElementById('themeGrid');
  if(!currentBtn || !grid) return;

  currentBtn.addEventListener('click', function(e){
    e.stopPropagation();
    const isOpen = grid.style.display === 'grid';
    grid.style.display = isOpen ? 'none' : 'grid';
    currentBtn.setAttribute('aria-expanded', String(!isOpen));
    grid.setAttribute('aria-hidden', String(isOpen));
    if(!isOpen){
      // focus first item for accessibility
      const first = grid.querySelector('.theme-item'); if(first) first.focus();
    }
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

    // keyboard selection
    item.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); item.click(); }
    });
  });

  // close on escape when grid focussed
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ if(grid){ grid.style.display='none'; grid.setAttribute('aria-hidden','true'); currentBtn.setAttribute('aria-expanded','false'); } } });
});

// --- UI glue for sliders and inputs ---
// Make these functions global so inline oninput attributes continue to work
function updateClicksText(val) {
    const el = document.getElementById('clicksValue');
    if(el) el.innerText = val;
    const range = document.getElementById('clicksFed');
    if(range) range.setAttribute('aria-valuenow', String(val));
}

function updateCurrentText(val){
    const el = document.getElementById('currentValue');
    const currentRange = document.getElementById('currentLevel');
    const targetRange = document.getElementById('targetLevel');
    if(!currentRange || !targetRange) return;

    // Clamp value to allowed range
    let num = Number(val);
    const maxAllowed = Number(targetRange.value) - 1; // current must be <= target-1
    if(isNaN(num)) num = Number(currentRange.value);
    if(num > maxAllowed){
      // prevent moving target by clamping current
      num = maxAllowed;
      currentRange.value = String(num);
    }

    if(el) el.innerText = String(num);
    currentRange.setAttribute('aria-valuenow', String(num));

    // adjust target's minimum so target >= current+1
    const minForTarget = Math.max(2, num + 1);
    targetRange.min = String(minForTarget);
    targetRange.setAttribute('aria-valuemin', String(minForTarget));
}

function updateTargetText(val){
    const el = document.getElementById('targetValue');
    const currentRange = document.getElementById('currentLevel');
    const targetRange = document.getElementById('targetLevel');
    if(!currentRange || !targetRange) return;

    let num = Number(val);
    if(isNaN(num)) num = Number(targetRange.value);

    // Ensure target is at least current+1
    const minAllowed = Math.max(2, Number(currentRange.value) + 1);
    if(num < minAllowed){
      num = minAllowed;
      targetRange.value = String(num);
    }

    if(el) el.innerText = String(num);
    targetRange.setAttribute('aria-valuenow', String(num));
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

// Attach calculate handler to button and attach robust listeners to sliders
document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('calculateBtn');
  if(btn) btn.addEventListener('click', calculateFood);

  const cur = document.getElementById('currentLevel');
  const tgt = document.getElementById('targetLevel');
  const clicks = document.getElementById('clicksFed');

  if(cur){ cur.addEventListener('input', function(e){ updateCurrentText(e.target.value); }); }
  if(tgt){ tgt.addEventListener('input', function(e){ updateTargetText(e.target.value); }); }
  if(clicks){ clicks.addEventListener('input', function(e){ updateClicksText(e.target.value); }); }

  // initialize displays
  if(cur) updateCurrentText(cur.value);
  if(tgt) updateTargetText(tgt.value);
  if(clicks) updateClicksText(clicks.value);

});
