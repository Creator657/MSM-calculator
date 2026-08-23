# MSM Calculator

A calculator for managing resources and optimizing choices in the game.

## Features

- **Food Database**: Complete pricing and cooking time data for all food items
- **Efficiency Calculations**: Compare foods by cost efficiency and time efficiency
- **Budget Optimizer**: Find the best food to cook with your available resources
- **Oven Size Tracker**: Filter foods by required oven size

## Food Database

The food database includes the following items with their properties:

| Food | Cost | Time | Treats | Oven Size |
|------|------|------|--------|-----------|
| Cupcakes | 50 | 30s | 5 | small |
| Cookies | 250 | 5m | 25 | small |
| Bread | 1,000 | 30m | 100 | small |
| Donuts | 5,000 | 1h | 500 | medium |
| Ice Cream | 15,000 | 3h | 1,500 | medium |
| Pizza | 75,000 | 6h | 7,500 | medium |
| Pie | 500,000 | 12h | 50,000 | large |
| Turkey | 1,000,000 | 1d | 100,000 | large |
| Cake | 5,000,000 | 2d | 500,000 | large |
| Big Salad | 10,000,000 | 2d | 1,000,000 | large |

## Usage

### Basic Setup

Include the food database module in your HTML:

```html
<script src="js/foodDatabase.js"></script>
```

Load the database when your page loads:

```javascript
loadFoodDatabase().then(() => {
  // Database is ready to use
  const allFoods = getAllFoods();
  console.log(allFoods);
});
```

### Available Functions

- `getAllFoods()` - Returns array of all foods
- `getFoodByName(name)` - Find a specific food by name
- `getFoodsByOvenSize(size)` - Filter foods by oven size requirement
- `getCostEfficiency(food)` - Calculate treats per cost
- `getTimeEfficiency(food)` - Calculate treats per second
- `getFoodsSortedByEfficiency(type)` - Get foods ranked by efficiency ('cost' or 'time')
- `calculateProfit(food)` - Calculate net gain (treats - cost)
- `getBestFoodForBudget(budget, sortBy)` - Find optimal food for your resources

## Examples

```javascript
// Find the most cost-efficient food
const mostEfficient = getFoodsSortedByEfficiency('cost')[0];
console.log(`Best value: ${mostEfficient.name}`);

// Find best food with 100,000 cost budget
const best = getBestFoodForBudget(100000, 'treats');
console.log(`Best food: ${best.name} - ${best.treatsGiven} treats`);

// Get all foods that fit in a small oven
const smallOvenFoods = getFoodsByOvenSize('small');
console.log(smallOvenFoods);
```

## File Structure

```
MSM-calculator/
├── data/
│   └── foods.json           # Food database
├── js/
│   └── foodDatabase.js      # Database utility functions
└── README.md                # This file
```
