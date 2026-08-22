// Updates the text label next to the slider in real-time
function updateClicksText(val) {
    document.getElementById('clicksValue').innerText = val;
}

function calculateFood() {
    const X = parseFloat(document.getElementById('foodX').value);
    const L = parseInt(document.getElementById('levelL').value);
    const clicksFed = parseInt(document.getElementById('clicksFed').value);
    
    if (isNaN(X) || isNaN(L) || L < 1) {
        document.getElementById('resultDisplay').innerText = "Please enter valid numbers.";
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

    document.getElementById('resultDisplay').innerText = "Total Treats: " + Math.round(totalTreats).toLocaleString();
}

