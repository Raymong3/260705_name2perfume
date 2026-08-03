import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
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

const ANALYSIS_STAGES = [
  '이름 한글 음가 및 획수 파동 분석 완료',
  '세종의 명소 공간 서사 감성 매칭 완료',
  '탑 · 미들 · 베이스 향료 황금 성향 계산 완료',
  '나만의 훈민향음 시그니처 레시피 생성 중',
  '디지털 조향 아뜰리에 맞춤 포뮬러 완성'
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
  const [analysisStageIdx, setAnalysisStageIdx] = useState(0);

  const [guestRecords, setGuestRecords] = useState<FinalRecipe[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);

  // Reset session when Home button clicked in Header
  useEffect(() => {
    if (resetSignal !== undefined) {
      handleResetSession();
    }
  }, [resetSignal]);

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

  // Sequential AI Analysis Step Rotation
  useEffect(() => {
    if (step === 'analyzing') {
      setAnalysisStageIdx(0);
      const interval = setInterval(() => {
        setAnalysisStageIdx(prev => {
          if (prev < ANALYSIS_STAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Initial Login / Identifier submit
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
      setIsLoggedIn(true);
      setStep('step1');
      onLoginSuccess && onLoginSuccess();
    } else {
      setIsAuthLoading(true);
      const res = await ScentService.getRecords(compoundKey, false);
      let foundRecords = res.success && res.data ? res.data : [];

      if (foundRecords.length === 0) {
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
    }, 5200);
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
        concept: `${guestName}의 향수`,
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
      perfumeName: perfumeName || `${guestName}의 향수`,
      makerMemo: '',
      guestMemo: makerMemo,
      createdDate: new Date().toLocaleDateString('ko-KR'),
      analysis: analysis!,
      selectedStory,
      surveyAnswers: []
    };

    try {
      const res = await ScentService.createRecipeRecord(guestName, loginId, recipeData);
      const rec = (res.success && res.data) ? res.data : {
        ...recipeData as FinalRecipe,
        id: 'local_' + Date.now(),
      } as FinalRecipe;

      setFinalRecipe(rec);
      setGuestRecords(prev => [rec, ...prev.filter(r => r.id !== rec.id)]);
      if (onNewRecipe) onNewRecipe(rec);
    } catch (e) {
      console.error('[GuestMainPage] create recipe error', e);
      const localRecipe: FinalRecipe = {
        ...recipeData as FinalRecipe,
        id: 'local_' + Date.now(),
      } as FinalRecipe;
      setFinalRecipe(localRecipe);
      setGuestRecords(prev => [localRecipe, ...prev.filter(r => r.id !== localRecipe.id)]);
      if (onNewRecipe) onNewRecipe(localRecipe);
    }

    setIsAuthLoading(false);
    setStep('submitted');
  };

  const handleResetSession = () => {
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
    <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 transition-colors duration-700">
      
      {/* 0단계: 메인 웰컴 히어로 & 식별 번호 입력 (디지털 조향 아뜰리에 첫 화면) */}
      {step === 'login' && !isLoggedIn && (
        <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-8 animate-fade-in print-exclude my-auto">
          
          {/* 브랜드 철학 히어로 헤더 (크고 당당한 브랜드 메세지) */}
          <div className="space-y-4 max-w-2xl mx-auto pt-4">
            <span className="text-[11px] font-mono tracking-[0.3em] text-luxury-gold uppercase bg-forest-950/80 px-4 py-1.5 rounded-full border border-luxury-gold/30 inline-block shadow-md">
              HUNMIN SCENT DIGITAL ATELIER
            </span>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-wide leading-tight drop-shadow-lg">
              훈민향음
            </h1>

            <div className="py-2 space-y-1.5 font-serif text-xl md:text-2xl text-luxury-cream leading-relaxed font-medium">
              <p>당신의 이름과</p>
              <p>세종의 이야기가 만나</p>
              <p className="text-luxury-gold font-bold text-2xl md:text-3xl pt-1">
                세상에 하나뿐인 향이 됩니다.
              </p>
            </div>

            <p className="text-xs text-forest-300 font-serif italic max-w-md mx-auto pt-1">
              "한글의 소리 파동과 세종시의 고유한 공간 서사가 교차하는 나만의 프리미엄 시그니처 향수 조향 공간"
            </p>
          </div>

          {/* 접수 세션 선택 카드 (테두리 최소화 & 딥 포레스트 클래스) */}
          <div className="w-full max-w-xl bg-forest-900/90 border border-luxury-gold/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
            
            {/* 세션 탭 (신규 접수 / 기존 조회) */}
            <div className="flex border border-forest-800 rounded-2xl overflow-hidden bg-forest-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('new');
                  setAuthError('');
                }}
                className={`flex-1 py-3 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'new' ? 'bg-forest-800 text-luxury-gold shadow-lg' : 'text-forest-400 hover:text-white'
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
                className={`flex-1 py-3 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'search' ? 'bg-forest-800 text-luxury-gold shadow-lg' : 'text-forest-400 hover:text-white'
                }`}
              >
                조향기록서 보관함
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5 text-left">
              <div>
                <label className="block text-xs font-serif font-bold text-forest-200 mb-2">
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
                  className="w-full px-4 py-3.5 bg-forest-950 border border-forest-800 rounded-xl text-white text-center font-bold tracking-widest text-lg focus:outline-none focus:border-luxury-gold transition-all"
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
                <p className="text-xs text-red-400 font-semibold text-center bg-red-950/40 p-2.5 rounded-xl border border-red-900/60">
                  {authError}
                </p>
              )}

              {/* 주인공 메인 CTA 버튼 (조향 시작하기) - 시선 집중 골드 샤인 버튼 */}
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-4 bg-luxury-gold hover:bg-luxury-cream text-forest-950 font-serif font-bold text-base rounded-2xl transition-all shadow-xl hover:shadow-luxury-gold/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 active:scale-98"
              >
                <Sparkles className="w-5 h-5 text-forest-950" />
                <span>{authMode === 'new' ? '조향 시작하기' : '조향기록서 조회하기'}</span>
                <ArrowRight className="w-4 h-4 text-forest-950" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 1단계: 의뢰인 성함 입력 */}
      {step === 'step1' && isLoggedIn && (
        <div className="max-w-xl w-full bg-forest-900/90 border border-luxury-gold/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 animate-fade-in print-exclude backdrop-blur-xl my-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold tracking-widest text-luxury-gold uppercase bg-forest-950 px-3.5 py-1.5 rounded-full border border-luxury-gold/30 inline-block font-mono">
              STEP 1 · NAME ATELIER
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">의뢰 대상자 성함 입력</h2>
            <p className="text-xs text-forest-300 font-serif">
              소유하실 분의 성함을 입력하시면 훈민정음 원리에 따른 음가 파동을 분석합니다.
            </p>
          </div>

          <form onSubmit={handleNameNext} className="space-y-6">
            <div>
              <label htmlFor="guestName" className="block text-xs font-serif font-bold text-forest-200 mb-2">이름 (Name)</label>
              <input
                type="text"
                id="guestName"
                value={guestNameForRecipe}
                onChange={(e) => {
                  setGuestNameForRecipe(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="이름을 입력하세요 (예: 홍길동)"
                className="w-full px-5 py-4 bg-forest-950 border border-forest-800 rounded-2xl text-white text-lg tracking-wide focus:outline-none focus:border-luxury-gold transition-all"
              />
              {nameError && (
                <p className="text-xs text-red-400 font-semibold mt-2 bg-red-950/40 p-2.5 rounded-xl border border-red-900/60">
                  {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-luxury-gold hover:bg-luxury-cream text-forest-950 font-serif font-bold text-base rounded-2xl transition-all shadow-xl hover:shadow-luxury-gold/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-forest-950" />
              <span>이름 음가 분석 및 서사 연결</span>
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

      {/* 순차적 5단계 AI 분석 스크린 */}
      {step === 'analyzing' && isLoggedIn && (
        <div className="max-w-xl w-full bg-forest-900/90 border border-luxury-gold/20 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 animate-fade-in print-exclude my-auto backdrop-blur-xl">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-luxury-gold/20 border-t-luxury-gold animate-spin"></div>
            <div className="w-16 h-16 bg-forest-950 rounded-full flex items-center justify-center text-luxury-gold shadow-xl">
              <Sparkles className="w-8 h-8 animate-pulse text-luxury-gold" />
            </div>
          </div>

          <div className="space-y-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-forest-950 border border-luxury-gold/30 text-xs font-bold text-luxury-gold uppercase tracking-widest font-mono">
              HUNMIN SCENT BESPOKE ANALYSIS
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
              나만의 맞춤 향 레시피를 조향 중입니다
            </h2>

            {/* 순차적 5단계 체크리스트 디스플레이 */}
            <div className="bg-forest-950/80 p-4 rounded-2xl border border-forest-800 space-y-2 text-left max-w-md mx-auto">
              {ANALYSIS_STAGES.map((msg, idx) => {
                const isDone = idx <= analysisStageIdx;
                const isCurrent = idx === analysisStageIdx;
                return (
                  <div key={idx} className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                    isDone ? 'text-luxury-cream font-medium' : 'text-forest-500'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-forest-700 flex-shrink-0" />
                    )}
                    <span className={isCurrent ? 'font-bold text-luxury-gold animate-pulse' : ''}>
                      {msg}
                    </span>
                  </div>
                );
              })}
            </div>
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
