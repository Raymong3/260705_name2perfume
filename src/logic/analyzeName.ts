import { NameAnalysis } from '../types/perfume';
import { normalizeName } from './normalizeName';
import { hashNameToSeed, seededRandom } from './nameSeed';
import { decomposeHangul } from './decomposeHangul';
import { IMAGE_TEMPLATES } from '../data/resultTemplates';

export function analyzeName(input: string): NameAnalysis {
  const normalized = normalizeName(input);
  if (!normalized) {
    throw new Error('이름을 입력해주세요.');
  }

  const seed = hashNameToSeed(normalized);
  const rand = seededRandom(seed);

  // Define consonant groups
  const strongConsonants = ['ㄱ','ㄲ','ㄷ','ㄸ','ㅂ','ㅃ'];
  const elegantConsonants = ['ㅅ','ㅆ','ㅈ','ㅉ','ㅊ'];
  const warmConsonants = ['ㄴ','ㅁ'];
  const pureConsonants = ['ㅇ'];
  const lightConsonants = ['ㅎ'];
  const flexibleConsonants = ['ㄹ'];
  const uniqueConsonants = ['ㅋ','ㅌ','ㅍ'];

  // Define vowel groups
  const brightVowels = ['ㅏ','ㅑ'];
  const energeticVowels = ['ㅗ','ㅛ','ㅘ','ㅙ'];
  const calmVowels = ['ㅓ','ㅕ'];
  const deepVowels = ['ㅜ','ㅠ','ㅡ','ㅝ'];
  const clearVowels = ['ㅣ'];
  const softVowels = ['ㅐ','ㅔ','ㅚ','ㅟ','ㅢ','ㅖ', 'ㅒ', 'ㅙ', 'ㅞ'];

  // All possible tags
  const ALL_TAGS = [
    // Image tags
    '밝은', '차분한', '맑은', '부드러운', '단단한', '세련된', '또렷한', '도시적인', '가벼운', '간결한', '균형감', '개성',
    // Mood tags
    '따뜻한', '활기찬', '자유로운', '안정감', '깊이감', '신비로운', '지적인', '자신감', '포근한', '깨끗한', '유연한', '개성있는', '활동적인', '산뜻한', '자연스러운', '특별한',
    '귀여운', '로맨틱한', '달콤한', '우아한', '코튼', '중성적인', '여성스러운', '화려한', '관능적인', '크리미', '단아한', '편안한', '풍성한', '캐주얼', '파우더리', '고급스러운', '드라이', '이국적인', '스모키', '얼씨', '숲', '신선한', '쌉쌀한', '아로마틱'
  ];

  // Initialize scores
  const scores: Record<string, number> = {};
  for (const tag of ALL_TAGS) {
    scores[tag] = 0;
  }

  let codaCount = 0;

  // Process syllable-by-syllable scoring
  const L = normalized.length;
  for (let i = 0; i < L; i++) {
    const decomp = decomposeHangul(normalized[i]);
    if (decomp) {
      // --- 1. Consonant (초성) Scoring (45% weight base) ---
      let conScore = 4.5;
      // Extra weight for first and last characters to avoid ties and boost distinction
      if (i === 0) conScore += 1.0;
      else if (i === L - 1) conScore += 0.5;

      const cho = decomp.cho;
      if (strongConsonants.includes(cho)) {
        scores['단단한'] += conScore;
        scores['자신감'] += conScore;
        scores['드라이'] += conScore;
      } else if (elegantConsonants.includes(cho)) {
        scores['세련된'] += conScore;
        scores['도시적인'] += conScore;
        scores['우아한'] += conScore;
        scores['고급스러운'] += conScore;
        scores['화려한'] += conScore;
      } else if (warmConsonants.includes(cho)) {
        scores['포근한'] += conScore;
        scores['따뜻한'] += conScore;
        scores['편안한'] += conScore;
        scores['코튼'] += conScore;
        scores['단아한'] += conScore;
      } else if (pureConsonants.includes(cho)) {
        scores['맑은'] += conScore;
        scores['깨끗한'] += conScore;
      } else if (lightConsonants.includes(cho)) {
        scores['가벼운'] += conScore;
        scores['자유로운'] += conScore;
      } else if (flexibleConsonants.includes(cho)) {
        scores['유연한'] += conScore;
        scores['부드러운'] += conScore;
        scores['귀여운'] += conScore;
        scores['로맨틱한'] += conScore;
        scores['캐주얼'] += conScore;
      } else if (uniqueConsonants.includes(cho)) {
        scores['개성있는'] += conScore;
        scores['활동적인'] += conScore;
      }

      // --- 2. Vowel (모음) Scoring (25% weight base) ---
      let vowScore = 2.5;
      if (i === 0) vowScore += 0.5;
      else if (i === L - 1) vowScore += 0.25;

      const jung = decomp.jung;
      if (brightVowels.includes(jung)) {
        scores['밝은'] += vowScore;
        scores['따뜻한'] += vowScore;
        scores['달콤한'] += vowScore;
        scores['신선한'] += vowScore;
      } else if (energeticVowels.includes(jung)) {
        scores['활기찬'] += vowScore;
        scores['자유로운'] += vowScore;
      } else if (calmVowels.includes(jung)) {
        scores['차분한'] += vowScore;
        scores['안정감'] += vowScore;
        scores['쌉쌀한'] += vowScore;
        scores['아로마틱'] += vowScore;
      } else if (deepVowels.includes(jung)) {
        scores['깊이감'] += vowScore;
        scores['신비로운'] += vowScore;
        scores['이국적인'] += vowScore;
        scores['스모키'] += vowScore;
        scores['얼씨'] += vowScore;
        scores['숲'] += vowScore;
      } else if (clearVowels.includes(jung)) {
        scores['지적인'] += vowScore;
        scores['또렷한'] += vowScore;
      } else if (softVowels.includes(jung)) {
        scores['부드러운'] += vowScore;
        scores['세련된'] += vowScore;
        scores['크리미'] += vowScore;
        scores['파우더리'] += vowScore;
        scores['중성적인'] += vowScore;
        scores['여성스러운'] += vowScore;
        scores['관능적인'] += vowScore;
      }

      // Track coda for overall ratio calculation
      if (decomp.hasFinal) {
        codaCount++;
      }
    }
  }

  // --- 3. Coda (종성) Scoring (20% weight base) ---
  const codaRatio = L > 0 ? codaCount / L : 0;
  if (codaRatio >= 0.5) {
    scores['안정감'] += 2.0;
    scores['깊이감'] += 2.0;
  } else {
    scores['산뜻한'] += 2.0;
    scores['가벼운'] += 2.0;
  }

  // --- 4. Length (글자수) Scoring (10% weight base) ---
  if (L === 2) {
    scores['또렷한'] += 1.0;
    scores['간결한'] += 1.0;
  } else if (L === 3) {
    scores['균형감'] += 1.0;
    scores['자연스러운'] += 1.0;
  } else if (L >= 4) {
    scores['개성'] += 1.0;
    scores['특별한'] += 1.0;
  }

  // Classify scored tags into Image vs Mood sets
  const imageTagCandidates = ['밝은', '차분한', '맑은', '부드러운', '단단한', '세련된', '또렷한', '도시적인', '가벼운', '간결한', '균형감', '개성'];
  const moodTagCandidates = [
    '따뜻한', '활기찬', '자유로운', '안정감', '깊이감', '신비로운', '지적인', '자신감', '포근한', '깨끗한', '유연한', '개성있는', '활동적인', '산뜻한', '자연스러운', '특별한',
    '귀여운', '로맨틱한', '달콤한', '우아한', '코튼', '중성적인', '여성스러운', '화려한', '관능적인', '크리미', '단아한', '편안한', '풍성한', '캐주얼', '파우더리', '고급스러운', '드라이', '이국적인', '스모키', '얼씨', '숲', '신선한', '쌉쌀한', '아로마틱'
  ];

  // Sort candidates by score descending with alphabetical fallback for strict determinism
  const sortTags = (tags: string[]) => {
    return [...tags].sort((a, b) => {
      const scoreDiff = (scores[b] || 0) - (scores[a] || 0);
      if (Math.abs(scoreDiff) > 0.0001) {
        return scoreDiff;
      }
      return a.localeCompare(b); // Alphabetical tie breaker
    });
  };

  const sortedImageTags = sortTags(imageTagCandidates);
  const sortedMoodTags = sortTags(moodTagCandidates);

  // Generate description based on templates using seed
  const imgIdx = Math.floor(rand() * IMAGE_TEMPLATES.length);
  const imgTpl = IMAGE_TEMPLATES[imgIdx];
  const tag1 = sortedImageTags[0] || '맑은';
  const tag2 = sortedImageTags[1] || '세련된';

  const description = imgTpl
    .replace(/{name}/g, normalized)
    .replace(/{tag1}/g, tag1)
    .replace(/{tag2}/g, tag2);

  return {
    normalizedName: normalized,
    seed,
    imageTags: sortedImageTags,
    moodTags: sortedMoodTags,
    description
  };
}
