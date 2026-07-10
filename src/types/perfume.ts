export type NoteType = 'top' | 'middle' | 'base';

export type PerfumeNote = {
  id: string;
  type: NoteType;
  nameEn: string;
  nameKo?: string;
  description: string;
  keywords: string[];
  color?: string;
  moodTags: string[];
  scentTags: string[];
  active: boolean;
};

export type NameAnalysis = {
  normalizedName: string;
  seed: number;
  imageTags: string[];
  moodTags: string[];
  description: string;
};

export type RecommendedNote = {
  note: PerfumeNote;
  ratio: number;
  reason: string;
};

export type PerfumeRecipe = {
  name: string;
  analysis: NameAnalysis;
  concept: string;
  top: RecommendedNote[];
  middle: RecommendedNote[];
  base: RecommendedNote[];
  description: string;
  matchScore: number; // Keep track of the match score of this recipe for sorting
};

export type SurveyAnswers = {
  q1: number; // 1 ~ 5
  q2: number; // 1 ~ 5
  q3: number; // 1 ~ 5
};
