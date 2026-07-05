import { NameAnalysis, PerfumeRecipe, RecommendedNote, PerfumeNote } from '../types/perfume';
import { NOTES } from '../data/notes';
import { seededRandom } from './nameSeed';
import { scoreNote } from './scoreNote';
import { calculateRatio } from './calculateRatio';
import { generateResultText } from './generateResultText';

function pickCount(min: number, max: number, rand: () => number) {
  return min + Math.floor(rand() * (max - min + 1));
}

function clampNoteCount(value: number | undefined, fallback: number) {
  if (value === undefined || value === null || !Number.isFinite(value)) return fallback;
  return Math.min(5, Math.max(1, Math.floor(value)));
}

export function pickNotesBySeed(notes: PerfumeNote[], count: number, rand: () => number) {
  return [...notes]
    .map(note => ({ note, sort: rand() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(item => item.note);
}

export function recommendPerfume(
  analysis: NameAnalysis,
  options?: {
    topCount?: number;
    middleCount?: number;
    baseCount?: number;
  }
): PerfumeRecipe {
  const rand = seededRandom(analysis.seed);

  // 1. Determine note counts (clamped between 1 and 5)
  const defaultTop = pickCount(2, 3, rand);
  const defaultMiddle = pickCount(2, 4, rand);
  const defaultBase = pickCount(2, 3, rand);

  const topCount = clampNoteCount(options?.topCount, defaultTop);
  const middleCount = clampNoteCount(options?.middleCount, defaultMiddle);
  const baseCount = clampNoteCount(options?.baseCount, defaultBase);

  // Combine image and mood tags for tag matching
  const analysisTags = [...analysis.imageTags, ...analysis.moodTags];

  // Helper to select notes for a category
  const selectNotesForCategory = (
    type: 'top' | 'middle' | 'base',
    count: number
  ): RecommendedNote[] => {
    const activeNotes = NOTES.filter(n => n.type === type && n.active);

    // Score all active notes in the category
    const scored = activeNotes
      .map(note => {
        // Reuse a distinct random sequence call for noise to keep it stable
        const score = scoreNote(note, analysisTags, rand);
        return { note, score };
      })
      .sort((a, b) => b.score - a.score);

    // Select candidate pool (top 30% to 50%)
    const candidateCount = Math.max(count + 3, Math.ceil(scored.length * 0.4));
    const candidates = scored.slice(0, candidateCount);

    // Seed-shuffle candidates and select 'count' items
    const selected = pickNotesBySeed(candidates.map(c => c.note), count, rand);

    // Sort selected notes by original score descending so the highest match gets the 1.2 ratio weight
    const finalSelected = selected
      .map(note => {
        const originalScored = scored.find(s => s.note.id === note.id);
        return { note, score: originalScored ? originalScored.score : 0 };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.note);

    // Map to RecommendedNote objects with custom choice rationales
    return finalSelected.map(note => {
      const matchingTags = note.moodTags.filter(t => analysisTags.includes(t));
      const reason = matchingTags.length > 0
        ? `이름의 ${matchingTags.slice(0, 2).join(', ')} 분위기와 잘 어울립니다.`
        : `이름의 전반적인 분위기와 세련되게 어우러집니다.`;

      return {
        note,
        ratio: 0, // Calculated by calculateRatio
        reason
      };
    });
  };

  const selectedTop = selectNotesForCategory('top', topCount);
  const selectedMiddle = selectNotesForCategory('middle', middleCount);
  const selectedBase = selectNotesForCategory('base', baseCount);

  // 2. Select mood tags and scent tags for the text generation
  const topMood = selectedTop[0]?.note.moodTags[0] || '산뜻한';
  const middleMood = selectedMiddle[0]?.note.moodTags[0] || '부드러운';
  const baseMood = selectedBase[0]?.note.moodTags[0] || '포근한';

  const topScentStr = Array.from(new Set(selectedTop.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');
  const middleScentStr = Array.from(new Set(selectedMiddle.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');
  const baseScentStr = Array.from(new Set(selectedBase.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');

  // 3. Generate template texts
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

  // 4. Assemble raw recipe and run ratio calculator
  const rawRecipe: PerfumeRecipe = {
    name: analysis.normalizedName,
    analysis,
    concept,
    top: selectedTop,
    middle: selectedMiddle,
    base: selectedBase,
    description: recipeDesc
  };

  return calculateRatio(rawRecipe);
}
