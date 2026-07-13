import { NameAnalysis, PerfumeRecipe, RecommendedNote, SejongStory } from '../types/perfume';
import { NOTES } from '../data/notes';
import { seededRandom } from './nameSeed';
import { generateResultText } from './generateResultText';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';

// Recommends a single recipe given a specific seed, along with bonus tags and notes from survey/sejong
export function recommendSingleRecipe(
  analysis: NameAnalysis,
  seedOffset: number,
  bonusTags: string[] = [],
  bonusNotes: string[] = []
): PerfumeRecipe {
  const rand = seededRandom(analysis.seed + seedOffset);

  // 1. Determine note counts (summing to exactly 5)
  const r = rand();
  let topCount = 1;
  let middleCount = 2;
  let baseCount = 2;
  
  if (r < 0.4) {
    topCount = 1;
    middleCount = 2;
    baseCount = 2;
  } else if (r < 0.8) {
    topCount = 2;
    middleCount = 2;
    baseCount = 1;
  } else {
    topCount = 1;
    middleCount = 3;
    baseCount = 1;
  }

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
      // Calculate Weighted Name Scores
      const sSyllable = scoreComponent(note.moodTags, note.scentTags, syllableTags); // 40%
      const sCho = scoreComponent(note.moodTags, note.scentTags, choTags);           // 15%
      const sJung = scoreComponent(note.moodTags, note.scentTags, jungTags);         // 20%
      const sJong = scoreComponent(note.moodTags, note.scentTags, jongTags);         // 10%
      const sLen = scoreComponent(note.moodTags, note.scentTags, lenTags);           // 5%
      const sRarity = scoreComponent(note.moodTags, note.scentTags, rarityTags);     // 10%

      const nameMatchScore = (
        sSyllable * 0.40 +
        sCho * 0.15 +
        sJung * 0.20 +
        sJong * 0.10 +
        sLen * 0.05 +
        sRarity * 0.10
      );

      // Survey & Sejong bonus tags match score
      const sBonus = scoreComponent(note.moodTags, note.scentTags, bonusTags);

      // Direct bonus for recommended note names (case-insensitive match)
      let noteBonus = 0;
      if (bonusNotes.some(bn => bn.toLowerCase() === note.nameEn.toLowerCase() || bn.toLowerCase() === note.id.toLowerCase())) {
        noteBonus = 30; // Strong bias for specified scent
      }

      // Final score combining name analysis, survey/sejong bonuses, and slight random seed noise
      const finalScore = nameMatchScore + sBonus * 0.5 + noteBonus + rand() * 25;
      return { note, finalScore };
    });

    scored.sort((a, b) => b.finalScore - a.finalScore);
    const selected = scored.slice(0, count);

    return selected.map(item => {
      const note = item.note;
      const allTags = [...syllableTags, ...choTags, ...jungTags, ...jongTags, ...lenTags, ...rarityTags, ...bonusTags];
      const matchingTags = note.moodTags.filter(t => allTags.includes(t));
      const reason = matchingTags.length > 0
        ? `이름과 취향의 ${matchingTags.slice(0, 2).join(', ')} 분위기와 잘 어울립니다.`
        : `이름의 전반적인 분위기와 세련되게 어우러집니다.`;

      return {
        note,
        ratio: 0, // Will be distributed evenly or manually later
        reason
      };
    });
  };

  const selectedTop = selectNotesForCategory('top', topCount);
  const selectedMiddle = selectNotesForCategory('middle', middleCount);
  const selectedBase = selectNotesForCategory('base', baseCount);

  // Set default equal ratios summing to 100 for simplicity
  const totalNotesCount = selectedTop.length + selectedMiddle.length + selectedBase.length;
  const defaultRatio = Math.round(100 / totalNotesCount);
  const distributeRatios = (notes: RecommendedNote[]) => {
    return notes.map(item => ({ ...item, ratio: defaultRatio }));
  };

  const distributedTop = distributeRatios(selectedTop);
  const distributedMiddle = distributeRatios(selectedMiddle);
  const distributedBase = distributeRatios(selectedBase);

  // Adjust last item ratio slightly to ensure exact sum of 100
  const currentSum = [...distributedTop, ...distributedMiddle, ...distributedBase].reduce((sum, item) => sum + item.ratio, 0);
  if (currentSum !== 100 && distributedBase.length > 0) {
    distributedBase[distributedBase.length - 1].ratio += (100 - currentSum);
  }

  const topMood = distributedTop[0]?.note.moodTags[0] || '산뜻한';
  const middleMood = distributedMiddle[0]?.note.moodTags[0] || '부드러운';
  const baseMood = distributedBase[0]?.note.moodTags[0] || '포근한';

  const topScentStr = Array.from(new Set(distributedTop.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');
  const middleScentStr = Array.from(new Set(distributedMiddle.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');
  const baseScentStr = Array.from(new Set(distributedBase.flatMap(item => item.note.scentTags))).slice(0, 2).join('과 ');

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

  // Internal match score calculation
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

      const nameMatchScore = (
        sSyllable * 0.40 +
        sCho * 0.15 +
        sJung * 0.20 +
        sJong * 0.10 +
        sLen * 0.05 +
        sRarity * 0.10
      );
      sum += nameMatchScore;
    }
    return Math.round(sum);
  };

  const matchScore = calculateMatchScore(distributedTop, distributedMiddle, distributedBase);

  const rawRecipe: PerfumeRecipe = {
    name: analysis.normalizedName,
    analysis,
    concept,
    top: distributedTop,
    middle: distributedMiddle,
    base: distributedBase,
    description: recipeDesc,
    matchScore
  };

  return rawRecipe;
}

// Recommends two recipes: recipe1 (Name + Survey) and recipe2 (Name + Sejong + Survey)
export function recommendPerfumes(
  nameAnalysis: NameAnalysis,
  sejongStory: SejongStory | null,
  surveyAnswers: { questionId: number; optionId: number }[]
): { recipe1: PerfumeRecipe; recipe2: PerfumeRecipe } {
  // Accumulate survey bonus tags and notes
  const surveyBonusTags: string[] = [];
  const surveyBonusNotes: string[] = [];

  for (const answer of surveyAnswers) {
    const question = SURVEY_QUESTIONS.find(q => q.id === answer.questionId);
    if (question) {
      const option = question.options.find(o => o.id === answer.optionId);
      if (option) {
        surveyBonusTags.push(...option.bonusTags);
        surveyBonusNotes.push(...option.bonusNotes);
      }
    }
  }

  // 1안: 나의 이름을 담은 향 (이름 분석 + 설문 결과)
  const recipe1 = recommendSingleRecipe(
    nameAnalysis,
    0,
    surveyBonusTags,
    surveyBonusNotes
  );
  recipe1.concept = `당신의 이름 '${nameAnalysis.normalizedName}'의 한글 결성과 취향 설문 결과가 자아내는 온전한 당신만의 시그니처 향`;

  // 2안: 이름과 세종이 만난 향 (이름 분석 + 세종의 이야기 + 설문 결과)
  const sejongBonusTags = sejongStory ? sejongStory.bonusTags : [];
  const sejongBonusNotes = sejongStory ? sejongStory.bonusNotes : [];

  const recipe2 = recommendSingleRecipe(
    nameAnalysis,
    100,
    [...surveyBonusTags, ...sejongBonusTags],
    [...surveyBonusNotes, ...sejongBonusNotes]
  );

  if (sejongStory) {
    recipe2.concept = `'${nameAnalysis.normalizedName}'의 이름과 세종의 이야기 중 '${sejongStory.title}'의 뜻이 어우러져 만들어진 깊이 있는 조화의 향`;
  }

  return { recipe1, recipe2 };
}
