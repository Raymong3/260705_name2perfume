import { NameAnalysis, PerfumeRecipe, RecommendedNote, SejongStory } from '../types/perfume';
import { NOTES } from '../data/notes';
import { seededRandom } from './nameSeed';
import { generateResultText } from './generateResultText';

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
      
      let reason = '';
      if (matchingTags.length > 0) {
        reason = `이름의 ${matchingTags.slice(0, 2).join(', ')} 무드와 어울려 ${note.description.replace(/\.$/, '')} 효과를 선사합니다.`;
      } else if (bonusNotes.some(bn => bn.toLowerCase() === note.nameEn.toLowerCase() || bn.toLowerCase() === note.id.toLowerCase())) {
        reason = `선택하신 명소의 테마 향료로서 ${note.description.replace(/\.$/, '')} 느낌을 더해줍니다.`;
      } else {
        reason = `이름의 전체적인 인상과 조화를 이루며 ${note.description.replace(/\.$/, '')} 감성을 완성합니다.`;
      }

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
    name: `${analysis.normalizedName}, 향이 되다`,
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

// Recommends a combined single recipe (Name + Sejong City Landmark)
export function recommendPerfumes(
  nameAnalysis: NameAnalysis,
  sejongStory: SejongStory | null
): PerfumeRecipe {
  const sejongBonusTags = sejongStory ? sejongStory.bonusTags : [];
  const sejongBonusNotes = sejongStory ? sejongStory.bonusNotes : [];

  const combinedRecipe = recommendSingleRecipe(
    nameAnalysis,
    100,
    sejongBonusTags,
    sejongBonusNotes
  );

  if (sejongStory) {
    combinedRecipe.concept = `'${nameAnalysis.normalizedName}'의 이름과 세종시의 '${sejongStory.title}' 풍경 및 감성이 어우러져 만들어진 깊이 있는 조화의 향`;
    combinedRecipe.description = `'${nameAnalysis.normalizedName}'님의 이름 분석 결과에 따른 이미지와, 선택하신 세종시 명소 '${sejongStory.title}'의 감성을 조화롭게 융합하여 선정된 결과입니다.`;
  } else {
    combinedRecipe.description = `'${nameAnalysis.normalizedName}'님의 이름 분석 결과에 따른 이미지와 세종시 명소의 감성을 조화롭게 융합하여 선정된 결과입니다.`;
  }

  return combinedRecipe;
}

