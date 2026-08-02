import { NameAnalysis } from './analysis';

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

export type RecommendedNote = {
  note: PerfumeNote;
  ratio?: number;
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
  matchScore: number;
};

export type SejongStory = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageDesc: string;
  bonusTags: string[];
  bonusNotes: string[];
};

export type FinalRecipe = {
  id: string;
  guestName: string;
  loginId: string;
  status: string;
  selectedType: 'name_only' | 'name_sejong';
  originalRecipe: PerfumeRecipe;
  top: RecommendedNote[];
  middle: RecommendedNote[];
  base: RecommendedNote[];
  addedNotes: string[];
  removedNotes: string[];
  modifiedNotes: string[];
  perfumeName: string;
  makerMemo: string;
  createdDate: string;
  analysis: NameAnalysis;
  selectedStory: SejongStory | null;
  surveyAnswers: { questionId: number; optionId: number }[];
};
