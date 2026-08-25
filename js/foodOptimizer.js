// foodOptimizer.js - Calculates a mixed-food cooking recipe to reach a treat goal,
// plus a realistic completion-time estimate based on the ovens you own.

class FoodOptimizer {
  constructor(foodDatabase) {
    this.foods = foodDatabase;
    this.sizeRank = { small: 1, medium: 2, large: 3 };
  }

  optimize(treatsNeeded, strategy = 'balanced', ovens = { small: 1, medium: 0, large: 0 }) {
    if (!treatsNeeded || treatsNeeded <= 0) return null;

    let sortedFoods;
    if (strategy === 'fastest') {
      sortedFoods = [...this.foods].sort((a, b) =>
        (b.treatsGiven / b.timeSeconds) - (a.treatsGiven / a.timeSeconds)
      );
    } else if (strategy === 'efficient') {
      sortedFoods = [...this.foods].sort((a, b) =>
        (b.treatsGiven / b.cost) - (a.treatsGiven / a.cost)
      );
    } else {
      sortedFoods = [...this.foods].sort((a, b) => {
        const scoreA = (a.treatsGiven / a.cost) * (a.treatsGiven / a.timeSeconds);
        const scoreB = (b.treatsGiven / b.cost) * (b.treatsGiven / b.timeSeconds);
        return scoreB - scoreA;
      });
    }

    let remaining = treatsNeeded;
    const counts = new Map();

    for (let food of sortedFoods) {
      if (remaining <= 0) break;
      const quantity = Math.floor(remaining / food.treatsGiven);
      if (quantity > 0) {
        counts.set(food.name, (counts.get(food.name) || 0) + quantity);
        remaining -= quantity * food.treatsGiven;
      }
    }

    if (remaining > 0) {
      const topOff = sortedFoods[0];
      counts.set(topOff.name, (counts.get(topOff.name) || 0) + 1);
    }

    let result = {
      treatsNeeded,
      strategy,
      recipe: [],
      totalCost: 0,
      totalTime: 0,
      totalTreats: 0,
      estimatedRealTime: 0,
      scheduleWarning: null,
      summary: ''
    };

    for (let [name, quantity] of counts) {
      const food = this.foods.find(f => f.name === name);
      const line = {
        name: food.name,
        quantity,
        treats: quantity * food.treatsGiven,
        cost: quantity * food.cost,
        time: quantity * food.timeSeconds,
        ovenSize: food.minOvenSize
      };
      result.recipe.push(line);
      result.totalCost += line.cost;
      result.totalTime += line.time;
      result.totalTreats += line.treats;
    }

    result.recipe.sort((a, b) => b.treats - a.treats);

    const schedule = this._computeSchedule(result.recipe, ovens);
    result.estimatedRealTime = schedule.makespan;
    result.scheduleWarning = schedule.warning;

    result.summary = this._generateSummary(result);
    return result;
  }

  _computeSchedule(recipe, ovens) {
    ovens = ovens || {};
    const pool = [];
    ['small', 'medium', 'large'].forEach(size => {
      const count = Math.max(0, parseInt(ovens[size], 10) || 0);
      for (let i = 0; i < count; i++) pool.push({ size, rank: this.sizeRank[size], freeAt: 0 });
    });

    if (pool.length === 0) {
      return { makespan: 0, warning: 'No ovens entered — add at least one oven above to get a real-time estimate.' };
    }

    let jobs = [];
    let impossible = [];

    for (let item of recipe) {
      const requiredRank = this.sizeRank[item.ovenSize] || 1;
      const compatible = pool.filter(o => o.rank >= requiredRank);
      if (compatible.length === 0) {
        impossible.push(item.name);
        continue;
      }
      const splits = Math.min(item.quantity, compatible.length);
      const base = Math.floor(item.quantity / splits);
      const remainder = item.quantity % splits;
      const perBatchTime = item.time / item.quantity;

      for (let i = 0; i < splits; i++) {
        const batches = base + (i < remainder ? 1 : 0);
        if (batches > 0) {
          jobs.push({ duration: batches * perBatchTime, requiredRank });
        }
      }
    }

    jobs.sort((a, b) => b.duration - a.duration);
    for (let job of jobs) {
      const compatible = pool.filter(o => o.rank >= job.requiredRank);
      let target = compatible[0];
      for (let o of compatible) {
        if (o.freeAt < target.freeAt) target = o;
      }
      target.freeAt += job.duration;
    }

    const makespan = pool.reduce((max, o) => Math.max(max, o.freeAt), 0);
    return {
      makespan,
      warning: impossible.length ? `No oven big enough for: ${impossible.join(', ')}` : null
    };
  }

  getBestSingleFood(treatsNeeded) {
    if (!this.foods.length) return null;

    let best = this.foods[0];
    let bestScore = (best.treatsGiven / best.cost) * (best.treatsGiven / best.timeSeconds);

    for (let food of this.foods) {
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

  getAllStrategies(treatsNeeded, ovens) {
    return {
      fastest: this.optimize(treatsNeeded, 'fastest', ovens),
      efficient: this.optimize(treatsNeeded, 'efficient', ovens),
      balanced: this.optimize(treatsNeeded, 'balanced', ovens),
      singleBest: this.getBestSingleFood(treatsNeeded)
    };
  }

  _formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  _generateSummary(result) {
    const lines = [
      `📦 Strategy: ${result.strategy}`,
      `🎯 Target: ${result.treatsNeeded.toLocaleString()} treats`,
      `✅ Total: ${result.totalTreats.toLocaleString()} treats`,
      `💰 Cost: ${result.totalCost.toLocaleString()}`,
      `⏱️ Oven-time (serial): ${this._formatTime(result.totalTime)}`,
      result.scheduleWarning
        ? `⚠️ ${result.scheduleWarning}`
        : `⏳ Est. real time: ${this._formatTime(result.estimatedRealTime)}`,
      `📋 Recipe: ${result.recipe.length} food type(s)`
    ];
    return lines.join('\n');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FoodOptimizer;
}
