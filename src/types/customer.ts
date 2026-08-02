import { FinalRecipe } from './recipe';

export type StepType = 'login' | 'step1' | 'step2' | 'analyzing' | 'result' | 'submitted';

export type SurveyAnswer = {
  questionId: number;
  optionId: number;
};

export type CustomerSession = {
  guestName: string;
  loginId: string;
  step: StepType;
  selectedScentNote: string | null;
  selectedStoryId: string | null;
  selectedRecipeType: 'name_only' | 'name_sejong';
  currentRecipe: FinalRecipe | null;
};
