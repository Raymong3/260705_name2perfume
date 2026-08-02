import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { StepType, FinalRecipe, SejongStory, NameAnalysis, PerfumeRecipe, RecommendedNote } from '../types/perfume';
import { Step1NoteSelect } from '../components/Customer/Step1NoteSelect';
import { Step2StorySelect } from '../components/Customer/Step2StorySelect';
import { Step3Customizer } from '../components/Customer/Step3Customizer';
import { Step4SubmitCard } from '../components/Customer/Step4SubmitCard';
import { analyzeName } from '../logic/analyzeName';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { SEJONG_STORIES } from '../data/sejongStories';
import { ScentService } from '../services/scentService';
import { GuestMyPage } from '../components/Customer/GuestMyPage';

const ANALYZING_MESSAGES = [
  '한글 이름의 초성, 중성, 종성 음가 파동 분석 중...',
  '세종의 정신과 명소 스토리 감성 튜닝 중...',
  '탑, 미들, 베이스 향료 황금 비율 계산 중...',
  '나만의 훈민향음 맞춤 조향 포뮬러 완성 중...'
];

interface GuestMainPageProps {
  onAdminLoginTrigger: (loginId: string) => void;
  onPrintRecipe?: (recipe: FinalRecipe) => void;
  pastRecordsSignal?: number;
  resetSignal?: number;
  onLoginSuccess?: () => void;
  onNewRecipe?: (recipe: FinalRecipe) => void;
}

export const GuestMainPage: React.FC<GuestMainPageProps> = ({
  onAdminLoginTrigger,
  pastRecordsSignal,
  resetSignal,
  onLoginSuccess,
  onNewRecipe,
}) => {
  // existing state definitions ...

  // Reset when Home button triggers
  useEffect(() => {
    if (resetSignal !== undefined) {
      handleResetSession();
    }
  }, [resetSignal]);

  // ... rest of component code ...

  const [loginId, setLoginId] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [guestName, setGuestName] = useState('');
  const [authMode, setAuthMode] = useState<'new' | 'search'>('new');
  const [selectedFavScentId, setSelectedFavScentId] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');

  const [step, setStep] = useState<StepType>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestNameForRecipe, setGuestNameForRecipe] = useState('');
  const [nameError, setNameError] = useState('');

  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);
  const [selectedStory, setSelectedStory] = useState<SejongStory | null>(SEJONG_STORIES[0]);
  const [recommended1, setRecommended1] = useState<PerfumeRecipe | null>(null);
  const [recommended2, setRecommended2] = useState<PerfumeRecipe | null>(null);
  const [selectedRecipeType, setSelectedRecipeType] = useState<'name_only' | 'name_sejong'>('name_only');

  const [finalRecipe, setFinalRecipe] = useState<FinalRecipe | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [analyzingIdx, setAnalyzingIdx] = useState(0);

  const [guestRecords, setGuestRecords] = useState<FinalRecipe[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);

  // Trigger past record search mode from header
  useEffect(() => {
    if (pastRecordsSignal && pastRecordsSignal > 0) {
      if (isLoggedIn && loginId) {
        handleLoadRecords(loginId);
      } else {
        setAuthMode('search');
        setStep('login');
        setIsLoggedIn(false);
        setAuthError('');
      }
    }
  }, [pastRecordsSignal, isLoggedIn, loginId]);

  const handleLoadRecords = async (queryId: string) => {
    setIsRecordsLoading(true);
    setStep('mypage');
    const res = await ScentService.getRecords(queryId, false);
    if (res.success && res.data) {
      setGuestRecords(res.data);
    } else {
      setGuestRecords([]);
    }
    setIsRecordsLoading(false);
  };

  // Rotate analyzing messages
  useEffect(() => {
    if (step === 'analyzing') {
      const interval = setInterval(() => {
        setAnalyzingIdx(prev => (prev + 1) % ANALYZING_MESSAGES.length);
      }, 1250);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Initial Login submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawPhone = phoneLast4.trim();
    
    // Check Admin Login attempt
    if (rawPhone.toLowerCase().startsWith('admin') || rawPhone.toLowerCase() === 'master' || rawPhone.toLowerCase() === 'admin9') {
      onAdminLoginTrigger(rawPhone);
      return;
    }

    if (!rawPhone) {
      setAuthError('휴대폰 번호 뒷자리 4자리를 입력해 주세요.');
      return;
    }

    if (!/^\d{4}$/.test(rawPhone)) {
      setAuthError('휴대폰 번호 뒷자리는 숫자 4자리로 입력해 주세요. (예: 1234)');
      return;
    }

    if (!selectedFavScentId) {
      setAuthError(authMode === 'new' 
        ? '마음에 드는 향 1가지를 아래 12개 중 선택해 주세요.' 
        : '조향 접수 시 선택하셨던 향 1가지를 아래 12개 중 선택해 주세요.'
      );
      return;
    }

    const compoundKey = `${rawPhone}_${selectedFavScentId}`;
    setLoginId(compoundKey);

    if (authMode === 'new') {
      setIsAuthLoading(true);
      const res = await ScentService.getRecords(compoundKey, false);
      setIsAuthLoading(false);
      
      if (res.success && res.data && res.data.length > 0) {
        setAuthError('이미 사용 중인 접수 정보입니다. 다른 향을 선택하거나 기존 접수 조회를 이용해 주세요.');
        return;
      }

      setIsLoggedIn(true);
      setStep('step1');
      onLoginSuccess && onLoginSuccess();
    } else {
      setIsAuthLoading(true);
      const res = await ScentService.getRecords(compoundKey, false);
      let foundRecords = res.success && res.data ? res.data : [];

      if (foundRecords.length === 0) {
        // Fallback: search by phone digits alone for legacy records
        const resPhone = await ScentService.getRecords(rawPhone, false);
        if (resPhone.success && resPhone.data && resPhone.data.length > 0) {
          foundRecords = resPhone.data;
        }
      }

      setIsAuthLoading(false);

      if (foundRecords.length > 0) {
        setGuestRecords(foundRecords);
        setGuestName(foundRecords[0].guestName || '의뢰인');
        setIsLoggedIn(true);
        setStep('mypage');
        onLoginSuccess && onLoginSuccess();
      } else {
        setAuthError(`입력하신 정보(뒷자리 ${rawPhone})로 등록된 조향 기록을 찾을 수 없습니다. 휴대폰 번호와 선택 향을 다시 확인해 주세요.`);
      }
    }
  };

  const handleStartNewJourney = () => {
    setSelectedStory(null);
    setRecommended1(null);
    setRecommended2(null);
    setGuestNameForRecipe('');
    setNameError('');
    setStep('step1');
  };

  // Name submit -> Go to Step 2 (Sejong story)
  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNameForRecipe.trim()) {
      setNameError('의뢰하실 분의 이름을 입력해 주세요.');
      return;
    }

    try {
      const analyzed = analyzeName(guestNameForRecipe.trim());
      setAnalysis(analyzed);

      const defaultStory = SEJONG_STORIES[0];
      setSelectedStory(defaultStory);

      const { recipe1, recipe2 } = recommendPerfumes(analyzed, defaultStory);
      setRecommended1(recipe1);
      setRecommended2(recipe2);

      setGuestName(guestNameForRecipe.trim());
      setStep('step2');
    } catch (err: any) {
      setNameError(err.message || '이름 분석 중 오류가 발생했습니다.');
    }
  };

  // Story submit -> Analyzing -> Step 3
  const handleSejongSubmit = () => {
    if (!analysis || !selectedStory) return;

    const { recipe2 } = recommendPerfumes(analysis, selectedStory);
    setRecommended2(recipe2);

    setStep('analyzing');
    setTimeout(() => {
      setStep('result');
    }, 5000);
  };

  // Submit Final Custom Recipe
  const handleFinalSubmit = async (
    recipeType: 'name_only' | 'name_sejong',
    customNotes: { top: RecommendedNote[]; middle: RecommendedNote[]; base: RecommendedNote[] },
    addedNotes: string[],
    removedNotes: string[],
    perfumeName: string,
    makerMemo: string
  ) => {
    setIsAuthLoading(true);
    const chosenOriginal = recipeType === 'name_only' ? recommended1 : recommended2;

    const recipeData: Partial<FinalRecipe> = {
      guestName,
      loginId,
      status: 'submitted',
      selectedType: recipeType,
      originalRecipe: chosenOriginal || {
        name: guestName,
        analysis: analysis!,
        concept: `${guestName}의 향`,
        top: customNotes.top,
        middle: customNotes.middle,
        base: customNotes.base,
        description: '',
        matchScore: 0
      },
      top: customNotes.top,
      middle: customNotes.middle,
      base: customNotes.base,
      addedNotes,
      removedNotes,
      modifiedNotes: [],
      perfumeName: perfumeName || `${guestName}의 향`,
      makerMemo: '',
      guestMemo: makerMemo,
      createdDate: new Date().toLocaleDateString('ko-KR'),
      analysis: analysis!,
      selectedStory,
      surveyAnswers: []
    };

    try {
      const res = await ScentService.createRecipeRecord(guestName, loginId, recipeData);
      if (res.success && res.data) {
        const savedRecipe = res.data;
        setFinalRecipe(savedRecipe);
        if (onNewRecipe) onNewRecipe(savedRecipe);
      } else {
        // fallback to local recipe
        const localRecipe: FinalRecipe = {
          ...recipeData as FinalRecipe,
          id: 'local_' + Date.now(),
        } as FinalRecipe;
        setFinalRecipe(localRecipe);
        if (onNewRecipe) onNewRecipe(localRecipe);
      }
    } catch (e) {
      console.error('[GuestMainPage] create recipe error', e);
      const localRecipe: FinalRecipe = {
        ...recipeData as FinalRecipe,
        id: 'local_' + Date.now(),
      } as FinalRecipe;
      setFinalRecipe(localRecipe);
      if (onNewRecipe) onNewRecipe(localRecipe);
    }

    setIsAuthLoading(false);
    setStep('submitted');
  };

  const handleResetSession = () => {
    // Reset to initial state for a fresh session
    setAuthMode('new');
    setAuthError('');
    setStep('login');
    setIsLoggedIn(false);
    setGuestName('');
    setGuestNameForRecipe('');
    setLoginId('');
    setPhoneLast4('');
    setSelectedFavScentId(null);
    setFinalRecipe(null);
  };


  return (
    <div className="w-full flex flex-col items-center">
      {/* 0단계: 로그인 / 식별번호 입력 */}
      {step === 'login' && !isLoggedIn && (
        <div className="max-w-xl w-full bg-forest-900/90 border border-forest-750 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 animate-fade-in print-exclude backdrop-blur-lg my-auto">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold text-luxury-gold uppercase tracking-widest bg-forest-950 px-3 py-1 rounded-full border border-forest-800 inline-block">
              HUNMIN SCENT ATELIER
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">훈민향음 조향 여정</h2>
            <p className="text-xs text-forest-300">
              세종의 이야기와 나만의 이름이 만나는 특별한 시그니처 향수 조향 서비스입니다.
            </p>
          </div>

          {/* 세션 탭 (신규 접수 / 기존 조회) */}
          <div className="flex border border-forest-800 rounded-xl overflow-hidden bg-forest-950 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('new');
                setAuthError('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'new' ? 'bg-forest-800 text-luxury-gold shadow-md' : 'text-forest-400 hover:text-white'
              }`}
            >
              신규 조향 접수
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('search');
                setAuthError('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'search' ? 'bg-forest-800 text-luxury-gold shadow-md' : 'text-forest-400 hover:text-white'
              }`}
            >
              조향기록서 보관함
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-forest-200 mb-2">
                {authMode === 'new' ? '휴대폰 번호 뒷자리 4자리' : '조향 접수 시 입력했던 휴대폰 번호 뒷자리 4자리'}
              </label>
              <input
                type="text"
                maxLength={10}
                value={phoneLast4}
                onChange={(e) => {
                  setPhoneLast4(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="휴대폰 번호 뒷자리 4자리 (예: 1234)"
                className="w-full px-4 py-3 bg-forest-950 border border-forest-800 rounded-xl text-white text-center font-bold tracking-widest text-lg focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <Step1NoteSelect
              selectedFavScentId={selectedFavScentId}
              onSelectScent={(id) => {
                setSelectedFavScentId(id);
                if (authError) setAuthError('');
              }}
              customTitle={
                authMode === 'new'
                  ? '마음에 드는 향 1가지 선택 (12종 중 택 1)'
                  : '조향 접수 시 선택하셨던 향 1가지 선택 (12종 중 택 1)'
              }
            />

            {authError && (
              <p className="text-xs text-red-400 font-semibold text-center bg-red-950/40 p-2 rounded border border-red-900/60">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3.5 bg-forest-800 hover:bg-forest-700 text-luxury-cream border border-forest-650 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-luxury-gold" />
              <span>{authMode === 'new' ? '신규 접수하고 조향 여정 시작' : '조향기록서 조회하기'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 1단계: 이름 입력 */}
      {step === 'step1' && isLoggedIn && (
        <div className="max-w-xl w-full bg-forest-900/90 border border-forest-750 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 animate-fade-in print-exclude backdrop-blur-lg my-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold tracking-widest text-luxury-gold uppercase bg-forest-950 px-3.5 py-1.5 rounded-full border border-forest-700 inline-block">
              1단계: 나를 읽다
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">의뢰 대상자 성함 입력</h2>
            <p className="text-xs text-forest-300">
              향수를 소유하실 분의 성함을 공백 없이 정갈하게 입력해 주세요.
            </p>
          </div>

          <form onSubmit={handleNameNext} className="space-y-6">
            <div>
              <label htmlFor="guestName" className="block text-xs font-bold text-forest-200 mb-2">이름 (Name)</label>
              <input
                type="text"
                id="guestName"
                value={guestNameForRecipe}
                onChange={(e) => {
                  setGuestNameForRecipe(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="이름을 입력하세요 (예: 홍길동)"
                className="w-full px-5 py-4 bg-forest-950 border border-forest-800 rounded-xl text-white text-lg tracking-wide focus:outline-none focus:border-luxury-gold"
              />
              {nameError && (
                <p className="text-xs text-red-400 font-semibold mt-2 bg-red-950/40 p-2 rounded border border-red-900/60">
                  {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-forest-800 hover:bg-forest-700 text-luxury-cream border border-forest-650 font-bold text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-luxury-gold" />
              <span>이름 분석 및 조향 시작</span>
            </button>
          </form>
        </div>
      )}

      {/* 2단계: 세종 이야기 선택 */}
      {step === 'step2' && isLoggedIn && (
        <Step2StorySelect
          analysis={analysis}
          selectedStory={selectedStory}
          onSelectStory={(story) => setSelectedStory(story)}
          onBack={() => setStep('step1')}
          onNext={handleSejongSubmit}
        />
      )}

      {/* 분석 중 스피너 애니메이션 */}
      {step === 'analyzing' && isLoggedIn && (
        <div className="max-w-xl w-full bg-forest-900/90 border border-forest-750 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 animate-fade-in print-exclude my-auto backdrop-blur-lg">
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-luxury-gold/20 border-t-luxury-gold animate-spin"></div>
            <div className="w-20 h-20 bg-forest-950 rounded-full flex items-center justify-center text-luxury-gold shadow-xl">
              <Sparkles className="w-10 h-10 animate-bounce text-luxury-gold" />
            </div>
          </div>

          <div className="space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full bg-forest-950 border border-forest-800 text-[11px] font-bold text-luxury-gold uppercase tracking-widest">
              Hunmin Scent Analyzing...
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
              나만의 맞춤 향 레시피 분석 중
            </h2>
            <p className="text-sm font-medium text-forest-200 min-h-[44px] flex items-center justify-center px-4 transition-all duration-300">
              {ANALYZING_MESSAGES[analyzingIdx]}
            </p>
          </div>
        </div>
      )}

      {/* 3단계: 향 추천 및 조향 커스텀 */}
      {step === 'result' && isLoggedIn && (
        <Step3Customizer
          recommended1={recommended1}
          recommended2={recommended2}
          selectedRecipeType={selectedRecipeType}
          selectedStory={selectedStory}
          onSelectRecipeType={(type) => setSelectedRecipeType(type)}
          onSubmit={handleFinalSubmit}
          isSubmitting={isAuthLoading}
        />
      )}

      {/* 4단계: 최종 완료 및 인쇄 안내 */}
      {step === 'submitted' && finalRecipe && (
        <Step4SubmitCard
          finalRecipe={finalRecipe}
          onNewSession={handleStartNewJourney}
        />
      )}

      {/* 마이페이지: 과거 조향 기록 보관함 */}
      {step === 'mypage' && isLoggedIn && (
        <GuestMyPage 
          loginId={loginId}
          guestRecords={guestRecords}
          isRecordsLoading={isRecordsLoading}
          onStartNewJourney={handleStartNewJourney}
          onViewRecord={(rec) => {
            setFinalRecipe(rec);
            setStep('submitted');
          }}
        />
      )}
    </div>
  );
};
