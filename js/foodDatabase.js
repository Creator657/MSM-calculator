// foodDatabase.js — loads and provides access to the food database

let _foodDB = [];
let _loaded = false;

function loadFoodDatabase() {
  return fetch('data/foods.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load foods.json: ${res.status}`);
      return res.json();
    })
    .then(data => {
      _foodDB = data;
      _loaded = true;
      return _foodDB;
    })
    .catch(err => {
      console.error('❌ Error loading food database:', err);
      _foodDB = [];
      _loaded = false;
      throw err;
    });
}

function getAllFoods() {
  return _foodDB;
}

function getFoodByName(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return _foodDB.find(f => f.name.toLowerCase() === lower) || null;
}

function getFoodsByOvenSize(size) {
  if (!size) return [];
  const lower = size.toLowerCase();
  return _foodDB.filter(f => f.minOvenSize.toLowerCase() === lower);
}

function getCostEfficiency(food) {
  if (!food || !food.cost) return 0;
  return food.treatsGiven / food.cost;
}

function getTimeEfficiency(food) {
  if (!food || !food.timeSeconds) return 0;
  return food.treatsGiven / food.timeSeconds;
}

function getFoodsSortedByEfficiency(type) {
  const sorted = [..._foodDB];
  if (type === 'time') {
    return sorted.sort((a, b) => getTimeEfficiency(b) - getTimeEfficiency(a));
  }
  // default to cost
  return sorted.sort((a, b) => getCostEfficiency(b) - getCostEfficiency(a));
}

function calculateProfit(food) {
  if (!food) return 0;
  return food.treatsGiven - food.cost;
}

function getBestFoodForBudget(budget, sortBy) {
  if (!budget || budget <= 0) return null;

  const affordable = _foodDB.filter(f => f.cost <= budget);
  if (!affordable.length) return null;

  const key = sortBy === 'time' ? getTimeEfficiency : getCostEfficiency;
  return affordable.reduce((best, f) => (key(f) > key(best) ? f : best), affordable[0]);
}

// Expose globally (no module bundler on this project)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadFoodDatabase,
    getAllFoods,
    getFoodByName,
    getFoodsByOvenSize,
    getCostEfficiency,
    getTimeEfficiency,
    getFoodsSortedByEfficiency,
    calculateProfit,
    getBestFoodForBudget
  };
}
