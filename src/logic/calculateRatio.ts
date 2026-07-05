import { PerfumeRecipe, RecommendedNote } from '../types/perfume';

function distributeGroupPercentage(items: RecommendedNote[], targetTotal: number): RecommendedNote[] {
  const n = items.length;
  if (n === 0) return [];
  if (n === 1) {
    return [{ ...items[0], ratio: targetTotal }];
  }

  // 1. Assign weight 1.2 to the first item (highest match), and 1.0 to the rest
  const weights = items.map((_, idx) => (idx === 0 ? 1.2 : 1.0));
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  // 2. Calculate unrounded values and round to nearest integer
  const roundedItems = items.map((item, idx) => {
    const unrounded = (targetTotal * weights[idx]) / weightSum;
    return {
      ...item,
      ratio: Math.round(unrounded)
    };
  });

  // 3. Adjust the last item to make the sum exactly match targetTotal
  const sum = roundedItems.reduce((acc, item) => acc + item.ratio, 0);
  const diff = targetTotal - sum;
  
  if (diff !== 0) {
    const lastIdx = roundedItems.length - 1;
    roundedItems[lastIdx] = {
      ...roundedItems[lastIdx],
      ratio: Math.max(0, roundedItems[lastIdx].ratio + diff)
    };
  }

  return roundedItems;
}

export function calculateRatio(
  recipe: PerfumeRecipe,
  topTarget = 25,
  middleTarget = 45,
  baseTarget = 30
): PerfumeRecipe {
  // Ensure target total percentages sum up to 100%
  const totalTarget = topTarget + middleTarget + baseTarget;
  if (totalTarget !== 100) {
    throw new Error('노트 비율의 합은 반드시 100%여야 합니다.');
  }

  return {
    ...recipe,
    top: distributeGroupPercentage(recipe.top, topTarget),
    middle: distributeGroupPercentage(recipe.middle, middleTarget),
    base: distributeGroupPercentage(recipe.base, baseTarget)
  };
}
