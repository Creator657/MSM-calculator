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

// Updates the text label next to the slider in real-time
function updateClicksText(val) {
    document.getElementById('clicksValue').innerText = val;
    const range = document.getElementById('clicksFed');
    if(range) range.setAttribute('aria-valuenow', String(val));
}

function calculateFood() {
    const X = parseFloat(document.getElementById('foodX').value);
    const L = parseInt(document.getElementById('levelL').value);
    const clicksFed = parseInt(document.getElementById('clicksFed').value);
    
    const resultValue = document.getElementById('resultValue');
    if (isNaN(X) || isNaN(L) || L < 1) {
        if(resultValue) resultValue.innerText = "Please enter valid numbers.";
        return;
    }

    // 1. Calculate the total required to go from Level 1 up to Target Level
    let totalTreats = 0;

    if (L <= 16) {
        totalTreats = 4 * X * (Math.pow(2, L - 1) - 1);
    } else {
        const baseTo16 = 4 * X * (Math.pow(2, 15) - 1);
        const extraLevels = 12 * X * Math.pow(2, 14) * (Math.pow(1.5, L - 16) - 1);
        totalTreats = baseTo16 + extraLevels;
    }

    // 2. Subtract the amount of food already consumed by previous clicks on Level 1
    const foodAlreadyFed = clicksFed * X;
    totalTreats = totalTreats - foodAlreadyFed;

    // Safety fallback in case user target is level 1 and clicks are fed
    if (totalTreats < 0) totalTreats = 0;

    if(resultValue) resultValue.innerText = Math.round(totalTreats).toLocaleString();
}

// Attach calculate handler to button (keeps existing calculate if redefined elsewhere)
(function(){
  const btn = document.getElementById('calculateBtn');
  if(!btn) return;
  btn.addEventListener('click', function(){
    if(typeof calculateFood === 'function') return calculateFood();
  });
})();
