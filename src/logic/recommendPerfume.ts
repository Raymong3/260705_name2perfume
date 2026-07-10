import { NameAnalysis, PerfumeRecipe, RecommendedNote } from '../types/perfume';
import { NOTES } from '../data/notes';
import { seededRandom } from './nameSeed';
import { generateResultText } from './generateResultText';

// Weighted count: 2 notes by default (80%), with 10% for 1 and 10% for 3 for subtle variety
function pickCountWeighted(rand: () => number): number {
  const r = rand();
  if (r < 0.10) return 1;
  if (r < 0.90) return 2;
  return 3;
}

// Recommends a single recipe given a specific seed (or offset)
export function recommendSingleRecipe(
  analysis: NameAnalysis,
  seedOffset: number
): PerfumeRecipe {
  const rand = seededRandom(analysis.seed + seedOffset);

  // 1. Determine note counts (weighted: 1~3, default 1)
  const topCount = pickCountWeighted(rand);
  const middleCount = pickCountWeighted(rand);
  const baseCount = pickCountWeighted(rand);

  const choTags = analysis.choTags || [];
  const jungTags = analysis.jungTags || [];
  const jongTags = analysis.jongTags || [];
  const syllableTags = analysis.syllableTags || [];
  const lenTags = analysis.lenTags || [];
  const rarityTags = analysis.rarityTags || [];

  const scoreComponent = (noteTags: string[], noteScentTags: string[], targetTags: string[]): number => {
    let match = 0;
    const uniqueTargets = Array.from(new Set(targetTags));
    for (const tag of uniqueTargets) {
      if (noteTags.includes(tag)) match += 10;
      if (noteScentTags.includes(tag)) match += 5;
    }
    return match;
  };

  const selectNotesForCategory = (
    type: 'top' | 'middle' | 'base',
    count: number
  ): RecommendedNote[] => {
    const activeNotes = NOTES.filter(n => n.type === type && n.active);

    const scored = activeNotes.map(note => {
      // Calculate Weighted Scores
      const sSyllable = scoreComponent(note.moodTags, note.scentTags, syllableTags); // 40%
      const sCho = scoreComponent(note.moodTags, note.scentTags, choTags);           // 15%
      const sJung = scoreComponent(note.moodTags, note.scentTags, jungTags);         // 20%
      const sJong = scoreComponent(note.moodTags, note.scentTags, jongTags);         // 10%
      const sLen = scoreComponent(note.moodTags, note.scentTags, lenTags);           // 5%
      const sRarity = scoreComponent(note.moodTags, note.scentTags, rarityTags);     // 10%

      const finalMatchScore = (
        sSyllable * 0.40 +
        sCho * 0.15 +
        sJung * 0.20 +
        sJong * 0.10 +
        sLen * 0.05 +
        sRarity * 0.10
      );

      // Add seed-based noise (noise limit = 25)
      const finalScore = finalMatchScore + rand() * 25;
      return { note, finalScore };
    });

    scored.sort((a, b) => b.finalScore - a.finalScore);
    const selected = scored.slice(0, count);

    return selected.map(item => {
      const note = item.note;
      const allTags = [...syllableTags, ...choTags, ...jungTags, ...jongTags, ...lenTags, ...rarityTags];
      const matchingTags = note.moodTags.filter(t => allTags.includes(t));
      const reason = matchingTags.length > 0
        ? `이름의 ${matchingTags.slice(0, 2).join(', ')} 분위기와 잘 어울립니다.`
        : `이름의 전반적인 분위기와 세련되게 어우러집니다.`;

      return {
        note,
        ratio: 0,
        reason
      };
    });
  };

  const selectedTop = selectNotesForCategory('top', topCount);
  const selectedMiddle = selectNotesForCategory('middle', middleCount);
  const selectedBase = selectNotesForCategory('base', baseCount);

  const topMood = selectedTop[0]?.note.moodTags[0] || '산뜻한';
  const middleMood = selectedMiddle[0]?.note.moodTags[0] || '부드러운';
  const baseMood = selectedBase[0]?.note.moodTags[0] || '포근한';

  const topScentStr = Array.from(new Set(selectedTop.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');
  const middleScentStr = Array.from(new Set(selectedMiddle.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');
  const baseScentStr = Array.from(new Set(selectedBase.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');

  const { concept, recipeDesc } = generateResultText(
    analysis.normalizedName,
    analysis.imageTags,
    topMood,
    middleMood,
    baseMood,
    topScentStr,
    middleScentStr,
    baseScentStr,
    rand
  );

  // Calculate the raw matchScore without random noise
  const calculateMatchScore = (top: RecommendedNote[], middle: RecommendedNote[], base: RecommendedNote[]) => {
    let sum = 0;
    const allNotes = [...top, ...middle, ...base].map(item => item.note);
    for (const note of allNotes) {
      const sSyllable = scoreComponent(note.moodTags, note.scentTags, syllableTags); // 40%
      const sCho = scoreComponent(note.moodTags, note.scentTags, choTags);           // 15%
      const sJung = scoreComponent(note.moodTags, note.scentTags, jungTags);         // 20%
      const sJong = scoreComponent(note.moodTags, note.scentTags, jongTags);         // 10%
      const sLen = scoreComponent(note.moodTags, note.scentTags, lenTags);           // 5%
      const sRarity = scoreComponent(note.moodTags, note.scentTags, rarityTags);     // 10%

      const finalMatchScore = (
        sSyllable * 0.40 +
        sCho * 0.15 +
        sJung * 0.20 +
        sJong * 0.10 +
        sLen * 0.05 +
        sRarity * 0.10
      );
      sum += finalMatchScore;
    }
    return Math.round(sum);
  };

  const matchScore = calculateMatchScore(selectedTop, selectedMiddle, selectedBase);

  const rawRecipe: PerfumeRecipe = {
    name: analysis.normalizedName,
    analysis,
    concept,
    top: selectedTop,
    middle: selectedMiddle,
    base: selectedBase,
    description: recipeDesc,
    matchScore
  };

  return rawRecipe;
}

// Recommends 3 distinct recipes sorted by matchScore descending
export function recommendPerfumes(
  analysis: NameAnalysis
): PerfumeRecipe[] {
  const recipes: PerfumeRecipe[] = [];
  const seenNotesKeySet = new Set<string>();

  // Try generating with different seed offsets to get different combinations
  let offset = 0;
  let attempts = 0;
  
  // We want to generate 3 unique recipes. If the note IDs in a recipe are identical to a previous one,
  // we shift the offset and try again, up to 15 attempts.
  while (recipes.length < 3 && attempts < 15) {
    const recipe = recommendSingleRecipe(analysis, offset);
    
    // Create a unique key of selected note IDs (sorted) to detect duplicates
    const noteIds = [
      ...recipe.top.map(item => item.note.id),
      ...recipe.middle.map(item => item.note.id),
      ...recipe.base.map(item => item.note.id)
    ].sort().join(',');

    if (!seenNotesKeySet.has(noteIds)) {
      seenNotesKeySet.add(noteIds);
      recipes.push(recipe);
    }
    
    offset += 100; // Increment offset
    attempts++;
  }

  // Fallback: If we couldn't get 3 unique ones, just fill up using incremental offsets
  while (recipes.length < 3) {
    const recipe = recommendSingleRecipe(analysis, offset);
    recipes.push(recipe);
    offset += 100;
  }

  // Sort by match score descending so that the most matching recipe is Rank 1, then Rank 2, then Rank 3
  return recipes.sort((a, b) => b.matchScore - a.matchScore);
}
