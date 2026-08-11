import { useState, useCallback } from 'react';
import { StepType, FinalRecipe, NameAnalysis, PerfumeRecipe } from '../types/perfume';
import { analyzeName } from '../logic/analyzeName';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { SEJONG_STORIES } from '../data/sejongStories';
import { ScentService } from '../services/scentService';

export function useScentSession() {
  const [guestName, setGuestName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [step, setStep] = useState<StepType>('login');
  
  const [selectedScentNote, setSelectedScentNote] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [selectedRecipeType, setSelectedRecipeType] = useState<'name_only' | 'name_sejong'>('name_only');
  
  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);
  const [recommended1, setRecommended1] = useState<PerfumeRecipe | null>(null);
  const [recommended2, setRecommended2] = useState<PerfumeRecipe | null>(null);
  
  const [finalRecipe, setFinalRecipe] = useState<FinalRecipe | null>(null);
  const [existingRecords, setExistingRecords] = useState<FinalRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Login or start session
  const handleLogin = useCallback(async (name: string, idPin: string) => {
    setIsLoading(true);
    setErrorMessage('');

    const res = await ScentService.loginGuest(idPin);
    setIsLoading(false);

    if (res.isMaster) {
      setLoginId(idPin);
      setGuestName(name || '관리자');
      return { isMaster: true };
    }

    if (!res.success) {
      setErrorMessage(res.error || '로그인에 실패했습니다.');
      return { isMaster: false, success: false };
    }

    setGuestName(name);
    setLoginId(idPin);

    // Analyze Name & Generate Recommendations
    try {
      const nameAnalysis = analyzeName(name);
      setAnalysis(nameAnalysis);

      const defaultStory = SEJONG_STORIES[0];
      setSelectedStoryId(defaultStory.id);

      const recipe1 = recommendPerfumes(nameAnalysis, defaultStory);
      setRecommended1(recipe1);
      setRecommended2(null);

      // Load existing records if any
      const recordRes = await ScentService.getRecords(idPin, false);
      if (recordRes.success && recordRes.data.length > 0) {
        setExistingRecords(recordRes.data);
        setFinalRecipe(recordRes.data[0]);
      }

      setStep('step1');
      return { isMaster: false, success: true };
    } catch (err: any) {
      setErrorMessage(err.message || '이름 분석 중 오류가 발생했습니다.');
      return { isMaster: false, success: false };
    }
  }, []);

  // 2. Select Story & Update Recommendation 2
  const handleSelectStory = useCallback((storyId: string) => {
    setSelectedStoryId(storyId);
    if (!analysis) return;

    const story = SEJONG_STORIES.find(s => s.id === storyId);
    if (story) {
      const recipe2 = recommendPerfumes(analysis, story);
      setRecommended2(recipe2);
    }
  }, [analysis]);

  // 3. Submit Recipe
  const handleSubmitRecipe = useCallback(async (
    recipeType: 'name_only' | 'name_sejong' | 'combined',
    customNotes: { top: any[]; middle: any[]; base: any[] },
    addedNotes: string[],
    removedNotes: string[],
    perfumeName: string,
    makerMemo: string
  ) => {
    if (!analysis || !recommended1) return null;

    setIsLoading(true);
    const chosenOriginal = recommended1;
    const selectedStory = SEJONG_STORIES.find(s => s.id === selectedStoryId) || null;

    const recipeData: Partial<FinalRecipe> = {
      selectedType: recipeType,
      originalRecipe: chosenOriginal,
      perfumeName: perfumeName || `${guestName}, 향이 되다`,
      top: customNotes.top,
      middle: customNotes.middle,
      base: customNotes.base,
      addedNotes,
      removedNotes,
      modifiedNotes: [],
      makerMemo,
      analysis,
      selectedStory,
      surveyAnswers: []
    };

    const res = await ScentService.createRecipeRecord(guestName, loginId, recipeData);
    setIsLoading(false);

    if (res.success && res.data) {
      setFinalRecipe(res.data);
      setStep('submitted');
      return res.data;
    }
    return null;
  }, [analysis, recommended1, recommended2, selectedStoryId, guestName, loginId]);

  return {
    guestName,
    loginId,
    step,
    setStep,
    selectedScentNote,
    setSelectedScentNote,
    selectedStoryId,
    selectedRecipeType,
    setSelectedRecipeType,
    analysis,
    recommended1,
    recommended2,
    finalRecipe,
    setFinalRecipe,
    existingRecords,
    isLoading,
    errorMessage,
    handleLogin,
    handleSelectStory,
    handleSubmitRecipe
  };
}
