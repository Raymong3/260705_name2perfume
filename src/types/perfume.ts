import { NameAnalysis } from './analysis';
import { PerfumeRecipe, RecommendedNote } from './recipe';

export * from './analysis';
export * from './recipe';
export * from './customer';
export * from './admin';

export type SejongStory = {
  id: string;
  category?: 'modern' | 'historical';
  title: string;
  subtitle: string;
  description: string;
  imageDesc: string;
  bonusTags: string[];
  bonusNotes: string[];
  imageUrl?: string;
};

export type FinalRecipe = {
  id: string;
  guestName: string;
  loginId: string;
  status: string;
  selectedType: 'name_only' | 'name_sejong' | 'combined';
  originalRecipe: PerfumeRecipe;
  top: RecommendedNote[];
  middle: RecommendedNote[];
  base: RecommendedNote[];
  addedNotes: string[];
  removedNotes: string[];
  modifiedNotes: string[];
  perfumeName: string;
  makerMemo: string;
  guestMemo?: string;
  createdDate: string;
  analysis: NameAnalysis;
  selectedStory: SejongStory | null;
  surveyAnswers: { questionId: number; optionId: number }[];
};
