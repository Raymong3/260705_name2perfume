import { PerfumeRecipe } from '../types/perfume';

export function validateRecipe(recipe: PerfumeRecipe): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Verify note counts (1 to 3 notes per section)
  const topCount = recipe.top.length;
  const middleCount = recipe.middle.length;
  const baseCount = recipe.base.length;

  if (topCount < 1 || topCount > 3) {
    errors.push(`Top note count must be between 1 and 3. Current count: ${topCount}`);
  }
  if (middleCount < 1 || middleCount > 3) {
    errors.push(`Middle note count must be between 1 and 3. Current count: ${middleCount}`);
  }
  if (baseCount < 1 || baseCount > 3) {
    errors.push(`Base note count must be between 1 and 3. Current count: ${baseCount}`);
  }

  // 2. Verify unique note IDs
  const allIds = [
    ...recipe.top.map(item => item.note.id),
    ...recipe.middle.map(item => item.note.id),
    ...recipe.base.map(item => item.note.id)
  ];
  const uniqueIds = new Set(allIds);
  if (allIds.length !== uniqueIds.size) {
    errors.push(`Duplicate note IDs found in recipe: ${allIds.filter((item, index) => allIds.indexOf(item) !== index).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

