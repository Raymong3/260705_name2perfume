import { NameAnalysis, PerfumeRecipe, RecommendedNote, PerfumeNote, SurveyAnswers } from '../types/perfume';
import { NOTES } from '../data/notes';
import { seededRandom } from './nameSeed';
import { scoreNote } from './scoreNote';
import { calculateRatio } from './calculateRatio';
import { generateResultText } from './generateResultText';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';

// Weighted count: 65% for 1 note, 25% for 2 notes, 10% for 3 notes
function pickCountWeighted(rand: () => number): number {
  const r = rand();
  if (r < 0.65) return 1;
  if (r < 0.90) return 2;
  return 3;
}

export function pickNotesBySeed(notes: PerfumeNote[], count: number, rand: () => number) {
  return [...notes]
    .map(note => ({ note, sort: rand() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(item => item.note);
}

// Recommends a single recipe given a specific seed (or offset)
export function recommendSingleRecipe(
  analysis: NameAnalysis,
  surveyAnswers: SurveyAnswers | undefined,
  seedOffset: number
): PerfumeRecipe {
  const rand = seededRandom(analysis.seed + seedOffset);

  // 1. Determine note counts (weighted: 1~3, default 1)
  const topCount = pickCountWeighted(rand);
  const middleCount = pickCountWeighted(rand);
  const baseCount = pickCountWeighted(rand);

  const analysisTags = [...analysis.imageTags, ...analysis.moodTags];

  const selectNotesForCategory = (
    type: 'top' | 'middle' | 'base',
    count: number
  ): RecommendedNote[] => {
    const activeNotes = NOTES.filter(n => n.type === type && n.active);

    const scored = activeNotes
      .map(note => {
        const score = scoreNote(note, analysisTags, surveyAnswers, rand);
        return { note, score };
      })
      .sort((a, b) => b.score - a.score);

    // Select candidate pool (top 30% to 50%)
    const candidateCount = Math.max(count + 3, Math.ceil(scored.length * 0.4));
    const candidates = scored.slice(0, candidateCount);

    const selected = pickNotesBySeed(candidates.map(c => c.note), count, rand);

    const finalSelected = selected
      .map(note => {
        const originalScored = scored.find(s => s.note.id === note.id);
        return { note, score: originalScored ? originalScored.score : 0 };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.note);

    return finalSelected.map(note => {
      const matchingTags = note.moodTags.filter(t => analysisTags.includes(t));
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
      // 1. Name tag match score
      for (const tag of analysisTags) {
        if (note.moodTags.includes(tag)) sum += 10;
        if (note.scentTags.includes(tag)) sum += 5;
      }
      // 2. Survey match score
      if (surveyAnswers) {
        const answers = [surveyAnswers.q1, surveyAnswers.q2, surveyAnswers.q3];
        for (let qIdx = 0; qIdx < 3; qIdx++) {
          const qNum = qIdx + 1;
          const answerVal = answers[qIdx];
          const question = SURVEY_QUESTIONS.find(q => q.id === qNum);
          if (question) {
            const option = question.options.find(opt => opt.id === answerVal);
            if (option) {
              if (option.bonusNotes.some(name => name.toLowerCase() === note.nameEn.toLowerCase())) {
                sum += 15;
              }
              for (const bTag of option.bonusTags) {
                if (note.moodTags.includes(bTag)) sum += 6;
                if (note.scentTags.includes(bTag)) sum += 3;
              }
            }
          }
        }
      }
    }
    return sum;
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

  return calculateRatio(rawRecipe);
}

// Recommends 3 distinct recipes sorted by matchScore descending
export function recommendPerfumes(
  analysis: NameAnalysis,
  surveyAnswers: SurveyAnswers | undefined
): PerfumeRecipe[] {
  const recipes: PerfumeRecipe[] = [];
  const seenNotesKeySet = new Set<string>();

  // Try generating with different seed offsets to get different combinations
  let offset = 0;
  let attempts = 0;
  
  // We want to generate 3 unique recipes. If the note IDs in a recipe are identical to a previous one,
  // we shift the offset and try again, up to 15 attempts.
  while (recipes.length < 3 && attempts < 15) {
    const recipe = recommendSingleRecipe(analysis, surveyAnswers, offset);
    
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
    const recipe = recommendSingleRecipe(analysis, surveyAnswers, offset);
    recipes.push(recipe);
    offset += 100;
  }

  // Sort by match score descending so that the most matching recipe is Rank 1, then Rank 2, then Rank 3
  return recipes.sort((a, b) => b.matchScore - a.matchScore);
}
