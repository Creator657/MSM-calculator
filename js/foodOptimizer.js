// foodOptimizer.js - Calculates the optimal cooking sequence to reach a treat goal

class FoodOptimizer {
  constructor(foodDatabase) {
    this.foods = foodDatabase;
  }

  /**
   * Optimize to reach a treat goal
   * @param {number} treatsNeeded - Total treats required
   * @param {string} strategy - 'fastest', 'efficient', or 'balanced'
   * @returns {object} Optimization result with recipe and analysis
   */
  optimize(treatsNeeded, strategy = 'balanced') {
    if (!treatsNeeded || treatsNeeded <= 0) return null;

    let result = {
      treatsNeeded,
      strategy,
      recipe: [],
      totalCost: 0,
      totalTime: 0,
      totalTreats: 0,
      summary: ''
    };

    // Sort foods by strategy
    let sortedFoods;
    if (strategy === 'fastest') {
      // Sort by treats per second (time efficiency)
      sortedFoods = [...this.foods].sort((a, b) => 
        (b.treatsGiven / b.timeSeconds) - (a.treatsGiven / a.timeSeconds)
      );
    } else if (strategy === 'efficient') {
      // Sort by treats per cost (cost efficiency)
      sortedFoods = [...this.foods].sort((a, b) => 
        (b.treatsGiven / b.cost) - (a.treatsGiven / a.cost)
      );
    } else {
      // Balanced: use a weighted score
      sortedFoods = [...this.foods].sort((a, b) => {
        const scoreA = (a.treatsGiven / a.cost) * (a.treatsGiven / a.timeSeconds);
        const scoreB = (b.treatsGiven / b.cost) * (b.treatsGiven / b.timeSeconds);
        return scoreB - scoreA;
      });
    }

    // Greedy algorithm: use best foods until we reach the goal
    let remaining = treatsNeeded;
    for (let food of sortedFoods) {
      if (remaining <= 0) break;

      const quantity = Math.ceil(remaining / food.treatsGiven);
      result.recipe.push({
        name: food.name,
        quantity,
        treats: quantity * food.treatsGiven,
        cost: quantity * food.cost,
        time: quantity * food.timeSeconds,
        ovenSize: food.minOvenSize
      });

      result.totalCost += quantity * food.cost;
      result.totalTime += quantity * food.timeSeconds;
      result.totalTreats += quantity * food.treatsGiven;
      remaining -= quantity * food.treatsGiven;
    }

    result.summary = this._generateSummary(result);
    return result;
  }

  /**
   * Alternative: Get the most cost-effective single food choice
   */
  getBestSingleFood(treatsNeeded) {
    const affordable = this.foods.filter(f => f.cost * Math.ceil(treatsNeeded / f.treatsGiven) <= Number.MAX_SAFE_INTEGER);
    
    if (!affordable.length) return null;

    let best = affordable[0];
    let bestScore = (best.treatsGiven / best.cost) * (best.treatsGiven / best.timeSeconds);

    for (let food of affordable) {
      const score = (food.treatsGiven / food.cost) * (food.treatsGiven / food.timeSeconds);
      if (score > bestScore) {
        bestScore = score;
        best = food;
      }
    }

    const quantity = Math.ceil(treatsNeeded / best.treatsGiven);
    return {
      name: best.name,
      quantity,
      treats: quantity * best.treatsGiven,
      cost: quantity * best.cost,
      time: quantity * best.timeSeconds,
      ovenSize: best.minOvenSize,
      costPerTreat: (best.cost / best.treatsGiven).toFixed(2),
      timePerTreat: (best.timeSeconds / best.treatsGiven).toFixed(2)
    };
  }

  /**
   * Get all optimization strategies at once
   */
  getAllStrategies(treatsNeeded) {
    return {
      fastest: this.optimize(treatsNeeded, 'fastest'),
      efficient: this.optimize(treatsNeeded, 'efficient'),
      balanced: this.optimize(treatsNeeded, 'balanced'),
      singleBest: this.getBestSingleFood(treatsNeeded)
    };
  }

  /**
   * Format time in human-readable format
   */
  _formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  /**
   * Generate a human-readable summary
   */
  _generateSummary(result) {
    const lines = [
      `📦 Strategy: ${result.strategy}`,
      `🎯 Target: ${result.treatsNeeded.toLocaleString()} treats`,
      `✅ Total: ${result.totalTreats.toLocaleString()} treats`,
      `💰 Cost: ${result.totalCost.toLocaleString()}`,
      `⏱️  Time: ${this._formatTime(result.totalTime)}`,
      `📋 Recipe: ${result.recipe.length} food type(s)`
    ];
    return lines.join('\n');
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FoodOptimizer;
}
