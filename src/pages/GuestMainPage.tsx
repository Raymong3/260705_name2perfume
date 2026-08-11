import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Circle, ChevronLeft, Search, FileText, AlertTriangle } from 'lucide-react';
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
  '나만의 Re:세종 시그니처 레시피 생성 중',
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
  // Phase 1 (Hero) vs Phase 2 (Auth) inside login step
  const [homePhase, setHomePhase] = useState<'hero' | 'auth'>('hero');
  
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
  const [selectedRecipeType, setSelectedRecipeType] = useState<'name_only' | 'name_sejong' | 'combined'>('combined');

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
        setHomePhase('auth');
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

  // Initial Login / Identifier submit with Duplicate Combination Check!
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

    setIsAuthLoading(true);

    if (authMode === 'new') {
      // ⚠️ 중복 식별키 검증: 이미 존재하는 4자리+대표향 조합인지 DB/로컬스토리지 확인!
      const existingCheck = await ScentService.getRecords(compoundKey, false);
      let existingRecords = existingCheck.success && existingCheck.data ? existingCheck.data : [];

      if (existingRecords.length === 0) {
        const phoneCheck = await ScentService.getRecords(rawPhone, false);
        if (phoneCheck.success && phoneCheck.data && phoneCheck.data.length > 0) {
          // 해당 전화번호 뒷자리로 등록된 기록이 이미 있는지 확인
          existingRecords = phoneCheck.data;
        }
      }

      setIsAuthLoading(false);

      if (existingRecords.length > 0) {
        // 이미 해당 번호/향 조합으로 작성된 기록서가 존재하는 경우 ⚠️ 안내 멘트 출력 및 조회 유도
        setAuthError(
          `⚠️ 입력하신 정보(뒷자리 ${rawPhone}번)로 이미 접수된 조향 기록이 존재합니다. 본인의 기존 기록을 보시려면 '조향기록서 조회하기' 버튼을 눌러주시고, 새로 조향을 진행하시려면 대표 향이나 번호를 확인해 주세요.`
        );
        return;
      }

      // 중복이 없으면 정상적으로 신규 조향 여정 시작 (장소 선택부터!)
      setIsLoggedIn(true);
      setStep('step2');
      onLoginSuccess && onLoginSuccess();
    } else {
      // 기존 조향기록서 조회 모드
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
    setStep('step2');
  };

  // Name submit -> Recommend and Go to Analyzing
  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    const inputName = guestNameForRecipe.trim();
    if (!inputName) {
      setNameError('당신의 한글 이름을 입력해 주세요.');
      return;
    }

    // 한글 검증: 오직 완성형 한글(가-힣)만 허용 (글자 수 제한 없음)
    const isKoreanOnly = /^[가-힣]+$/.test(inputName);
    if (!isKoreanOnly) {
      setNameError('이름은 한글(예: 홍길동)로만 입력해 주세요. (영문, 숫자, 특수문자 사용 불가)');
      return;
    }

    try {
      const analyzed = analyzeName(inputName);
      setAnalysis(analyzed);

      // 이미 장소 선택(selectedStory)이 완료되어 있으므로 여기서 추천을 받음!
      const recipe = recommendPerfumes(analyzed, selectedStory);
      setRecommended1(recipe);
      setRecommended2(null);
      setSelectedRecipeType('name_sejong'); // 호환을 위한 고정

      setGuestName(inputName);
      setStep('analyzing');
      setTimeout(() => {
        setStep('result');
      }, 5200);
    } catch (err: any) {
      setNameError(err.message || '이름 분석 중 오류가 발생했습니다.');
    }
  };

  // Story submit -> Go to Step 1 (Name Input)
  const handleSejongSubmit = () => {
    if (!selectedStory) return;
    setStep('step1');
  };

  // Submit Final Custom Recipe
  const handleFinalSubmit = async (
    recipeType: 'name_only' | 'name_sejong' | 'combined',
    customNotes: { top: RecommendedNote[]; middle: RecommendedNote[]; base: RecommendedNote[] },
    addedNotes: string[],
    removedNotes: string[],
    perfumeName: string,
    makerMemo: string
  ) => {
    setIsAuthLoading(true);
    const chosenOriginal = recommended1;

    const recipeData: Partial<FinalRecipe> = {
      guestName,
      loginId,
      status: 'submitted',
      selectedType: recipeType,
      originalRecipe: chosenOriginal || {
        name: guestName,
        analysis: analysis!,
        concept: `${guestName}, 향이 되다`,
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
      perfumeName: perfumeName || `${guestName}, 향이 되다`,
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
    setHomePhase('hero');
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
      
      {/* 0단계 (페이즈 1): 메인 웰컴 브랜드 웅장 히어로 페이지 */}
      {step === 'login' && !isLoggedIn && homePhase === 'hero' && (
        <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-10 animate-fade-in print-exclude my-auto py-8">
          
          {/* 브랜드 철학 타이틀 */}
          <div className="space-y-6 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono tracking-[0.35em] text-luxury-gold uppercase bg-forest-950/90 px-5 py-2 rounded-full border border-luxury-gold/30 inline-block shadow-lg">
              HUNMIN SCENT DIGITAL ATELIER
            </span>

            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white tracking-wider leading-tight drop-shadow-xl">
              Re:세종
            </h1>

            <div className="py-3 space-y-2 font-serif text-2xl md:text-3xl text-luxury-cream leading-relaxed font-medium">
              <p>세종이라는 도시와</p>
              <p>당신의 이야기가 만나</p>
              <p className="text-luxury-gold font-bold text-3xl md:text-4xl pt-2 tracking-wide drop-shadow-md">
                하나의 특별한 향이 됩니다.
              </p>
            </div>

            <p className="text-sm md:text-base text-forest-200/90 font-serif italic max-w-lg mx-auto pt-2 leading-relaxed">
              "세종의 장소와 당신의 이름이 만나 향기가 되는 디지털 조향 아뜰리에"
            </p>
          </div>

          {/* 메인 액션 버튼 그룹 (독립된 웰컴 페이즈) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md pt-4">
            {/* 조향 시작하기 버튼 (페이즈 2로 이동) */}
            <button
              type="button"
              onClick={() => {
                setAuthMode('new');
                setAuthError('');
                setHomePhase('auth');
              }}
              className="w-full sm:w-auto flex-1 py-4 px-8 bg-luxury-gold hover:bg-luxury-cream text-forest-950 font-serif font-bold text-base md:text-lg rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-luxury-gold/40 flex items-center justify-center gap-3 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-5 h-5 text-forest-950" />
              <span>조향 시작하기</span>
              <ArrowRight className="w-5 h-5 text-forest-950" />
            </button>

            {/* 기존 조향기록서 조회 버튼 */}
            <button
              type="button"
              onClick={() => {
                setAuthMode('search');
                setAuthError('');
                setHomePhase('auth');
              }}
              className="w-full sm:w-auto py-4 px-6 bg-forest-900/90 hover:bg-forest-850 text-luxury-cream font-serif font-bold text-sm rounded-2xl transition-all border border-luxury-gold/30 hover:border-luxury-gold shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-luxury-gold" />
              <span>기존 조향기록서 조회</span>
            </button>
          </div>

        </div>
      )}

      {/* 0단계 (페이즈 2): 식별 번호 & 선호 향 선택 로그인 페이지 */}
      {step === 'login' && !isLoggedIn && homePhase === 'auth' && (
        <div className="max-w-xl w-full flex flex-col items-center space-y-6 animate-fade-in print-exclude my-auto">
          
          {/* 이전 메인으로 돌아가기 버튼 */}
          <button
            type="button"
            onClick={() => {
              setHomePhase('hero');
              setAuthError('');
            }}
            className="self-start flex items-center gap-1.5 text-xs font-serif font-bold text-forest-300 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-forest-950/60 border border-forest-850"
          >
            <ChevronLeft className="w-4 h-4" /> 브랜드 소개 메인으로
          </button>

          {/* 식별 카드 패널 */}
          <div className="w-full bg-forest-900/95 border border-luxury-gold/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
            
            <div className="text-center space-y-1 border-b border-forest-800 pb-4">
              <span className="text-[10px] font-mono tracking-widest text-luxury-gold uppercase">
                DIGITAL SCENT IDENTIFIER
              </span>
              <h2 className="font-serif text-2xl font-bold text-white">
                {authMode === 'new' ? '조향 식별 번호 및 선호 향 선택' : '기존 조향기록서 조회'}
              </h2>
            </div>

            {/* 세션 모드 탭 (신규 접수 vs 기존 조회) */}
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

              {/* 중복 및 검증 에러 멘트 (명확한 경고 박스) */}
              {authError && (
                <div className="space-y-2 bg-amber-950/60 p-4 rounded-2xl border border-amber-800/80 text-amber-200 text-xs font-serif leading-relaxed animate-shake">
                  <div className="flex items-center gap-2 font-bold text-luxury-gold text-sm">
                    <AlertTriangle className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                    <span>조향 식별 중복 안내</span>
                  </div>
                  <p>{authError}</p>

                  {authMode === 'new' && authError.includes('이미 접수된 조향 기록') && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('search');
                        setAuthError('');
                      }}
                      className="mt-2 w-full py-2.5 bg-luxury-gold text-forest-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-luxury-cream cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>내 조향기록서 바로 조회하기</span>
                    </button>
                  )}
                </div>
              )}

              {/* 제출 CTA 버튼 */}
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-4 bg-luxury-gold hover:bg-luxury-cream text-forest-950 font-serif font-bold text-base rounded-2xl transition-all shadow-xl hover:shadow-luxury-gold/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 active:scale-98"
              >
                {isAuthLoading ? (
                  <div className="w-5 h-5 border-2 border-forest-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-forest-950" />
                    <span>{authMode === 'new' ? '조향 시작하기' : '조향기록서 조회하기'}</span>
                    <ArrowRight className="w-4 h-4 text-forest-950" />
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 1단계: 이름을 담다 / 당신의 이름을 넣어주세요 */}
      {step === 'step1' && isLoggedIn && (
        <div className="max-w-xl w-full bg-forest-900/90 border border-luxury-gold/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 animate-fade-in print-exclude backdrop-blur-xl my-auto">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold tracking-[0.25em] text-luxury-gold uppercase bg-forest-950 px-5 py-2 rounded-full border border-luxury-gold/30 inline-block font-mono shadow-md">
              STEP 02 / IDENTITY
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">이름을 입력해 주세요</h2>
            <p className="text-xs text-forest-300 font-serif">
              소유하실 분의 성함을 한글로 입력하시면 훈민정음 원리에 따른 음가 파동을 분석합니다.
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

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('step2')}
                className="flex-1 py-4 border border-forest-800 text-forest-300 font-serif font-bold rounded-2xl hover:bg-forest-950/40 transition-colors shadow-sm active:scale-98 cursor-pointer"
              >
                이전 단계로
              </button>
              <button
                type="submit"
                className="flex-[2] py-4 bg-luxury-gold hover:bg-luxury-cream text-forest-950 font-serif font-bold text-base rounded-2xl transition-all shadow-xl hover:shadow-luxury-gold/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-forest-950" />
                <span>이름 음가 분석 및 조향</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2단계: 세종 이야기 선택 */}
      {step === 'step2' && isLoggedIn && (
        <Step2StorySelect
          selectedStory={selectedStory}
          onSelectStory={(story) => setSelectedStory(story)}
          onBack={handleResetSession}
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
