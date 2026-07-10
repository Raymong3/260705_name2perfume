import { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, Settings, Check, ArrowRight } from 'lucide-react';
import { NameInput } from '../components/NameInput';
import { RatioBar } from '../components/RatioBar';
import { NoteSection } from '../components/NoteSection';
import { analyzeName } from '../logic/analyzeName';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { calculateRatio } from '../logic/calculateRatio';
import { NameAnalysis, PerfumeRecipe, SurveyAnswers } from '../types/perfume';
import { NOTES } from '../data/notes';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';

// Build default name mappings dynamically from 61 NOTES
const DEFAULT_INGREDIENT_NAMES = NOTES.reduce((acc, note) => {
  acc[note.id] = note.nameKo ? `${note.nameKo} (${note.nameEn})` : note.nameEn;
  return acc;
}, {} as Record<string, string>);

export default function App() {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'survey' | 'result'>('input');
  
  // Survey states
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({ q1: 1, q2: 1, q3: 1 });
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Recommendations and Ratios
  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);
  const [rawRecipes, setRawRecipes] = useState<PerfumeRecipe[]>([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  
  const [customRatios, setCustomRatios] = useState<Array<{top: number, middle: number, base: number}>>([
    { top: 25, middle: 45, base: 30 },
    { top: 25, middle: 45, base: 30 },
    { top: 25, middle: 45, base: 30 }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Ingredient Names State (initialized from localStorage or defaults)
  const [nameMap, setNameMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('perfume_name_map');
    return saved ? JSON.parse(saved) : DEFAULT_INGREDIENT_NAMES;
  });

  const [isEditingNames, setIsEditingNames] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'middle' | 'base'>('top');

  // Handle recommendation request (1단계 완료 -> 2단계 설문 진입)
  const handleStartSurvey = (inputName: string) => {
    try {
      const resultAnalysis = analyzeName(inputName);
      setName(inputName);
      setAnalysis(resultAnalysis);
      setCurrentQIndex(0);
      setStep('survey');
    } catch (err) {
      alert(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    }
  };

  // Submit survey and get 3 recipes (2단계 완료 -> 3단계 결과 진입)
  const handleGenerateRecipe = () => {
    if (!analysis) return;
    setIsLoading(true);

    setTimeout(() => {
      try {
        const recipes = recommendPerfumes(analysis, surveyAnswers);
        setRawRecipes(recipes);
        setActiveRecipeIndex(0);
        // Reset custom ratios to defaults
        setCustomRatios([
          { top: 25, middle: 45, base: 30 },
          { top: 25, middle: 45, base: 30 },
          { top: 25, middle: 45, base: 30 }
        ]);
        setStep('result');
      } catch (err) {
        alert('추천 레시피 생성 과정에서 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  // Get currently displayed recipe by applying customized ratios
  const getDisplayedRecipe = (idx: number): PerfumeRecipe | null => {
    const raw = rawRecipes[idx];
    if (!raw) return null;
    const ratio = customRatios[idx] || { top: 25, middle: 45, base: 30 };
    try {
      return calculateRatio(raw, ratio.top, ratio.middle, ratio.base);
    } catch (err) {
      return raw;
    }
  };

  const activeRecipe = getDisplayedRecipe(activeRecipeIndex);
  const activeRatio = customRatios[activeRecipeIndex] || { top: 25, middle: 45, base: 30 };

  const handleRatioSliderChange = (type: 'top' | 'middle', value: number) => {
    setCustomRatios(prev => {
      const next = [...prev];
      const current = { ...next[activeRecipeIndex] };
      if (type === 'top') {
        current.top = value;
        current.base = 100 - value - current.middle;
      } else {
        current.middle = value;
        current.base = 100 - current.top - value;
      }
      next[activeRecipeIndex] = current;
      return next;
    });
  };

  const applyPreset = (t: number, m: number, b: number) => {
    setCustomRatios(prev => {
      const next = [...prev];
      next[activeRecipeIndex] = { top: t, middle: m, base: b };
      return next;
    });
  };

  // Save customized ingredient names
  const handleNameChange = (id: string, value: string) => {
    const updated = { ...nameMap, [id]: value };
    setNameMap(updated);
    localStorage.setItem('perfume_name_map', JSON.stringify(updated));
  };

  const resetNameToDefault = () => {
    if (window.confirm('모든 향료 이름을 기본값으로 초기화하시겠습니까?')) {
      setNameMap(DEFAULT_INGREDIENT_NAMES);
      localStorage.setItem('perfume_name_map', JSON.stringify(DEFAULT_INGREDIENT_NAMES));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-forest-100">
      {/* Luxury Header */}
      <header className="border-b border-luxury-gold/10 bg-forest-950 text-luxury-cream py-6 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-serif text-xl md:text-2xl font-bold tracking-[0.25em] text-luxury-gold">
              NAME 2 PERFUME
            </span>
            <span className="text-[10px] tracking-wider text-forest-300 font-serif">
              L'atelier de Parfum
            </span>
          </div>
          
          <button 
            onClick={() => setIsEditingNames(!isEditingNames)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-luxury-gold/20 text-xs hover:bg-forest-900 transition-colors text-luxury-goldLight"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>향료명 관리</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 bg-luxury-cream/10">
        {isEditingNames ? (
          /* Ingredient Customization Panel */
          <div className="w-full max-w-2xl bg-white border border-luxury-gold/20 rounded-2xl shadow-xl p-6 md:p-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-luxury-sand pb-4 mb-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-forest-950">향료 데이터 이름 매핑</h2>
                <p className="text-xs text-forest-500 mt-1">향료 ID에 연결될 실제 향료의 한글 및 영문 이름을 편집합니다.</p>
              </div>
              <button 
                onClick={() => setIsEditingNames(false)}
                className="px-4 py-2 bg-forest-800 text-luxury-cream text-xs rounded hover:bg-forest-900 transition-colors"
              >
                닫기
              </button>
            </div>

            {/* Note Tab Select */}
            <div className="flex border-b border-luxury-sand mb-6">
              {(['top', 'middle', 'base'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all ${
                    activeTab === tab 
                      ? 'border-forest-800 text-forest-950' 
                      : 'border-transparent text-forest-400 hover:text-forest-700'
                  }`}
                >
                  {tab === 'top' ? 'Top Notes (20)' : tab === 'middle' ? 'Middle Notes (21)' : 'Base Notes (20)'}
                </button>
              ))}
            </div>

            {/* Ingredient Names List */}
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3">
              {NOTES.filter((note) => note.type === activeTab).map((note) => (
                <div key={note.id} className="flex items-center gap-3 bg-luxury-cream/50 p-2.5 rounded-lg border border-luxury-sand">
                  <span className="text-xs font-mono font-bold text-forest-600 w-28 truncate" title={note.nameEn}>
                    {note.nameEn}
                  </span>
                  <input
                    type="text"
                    value={nameMap[note.id] || ''}
                    onChange={(e) => handleNameChange(note.id, e.target.value)}
                    placeholder="실제 향료 이름 입력"
                    className="flex-grow px-3 py-1.5 border border-forest-200 rounded text-sm focus:outline-none focus:border-forest-600 bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-luxury-sand pt-6 mt-6">
              <button 
                onClick={resetNameToDefault}
                className="text-xs text-red-600 hover:underline"
              >
                기본 향료명으로 초기화
              </button>
              <button 
                onClick={() => setIsEditingNames(false)}
                className="luxury-btn px-6 py-2.5 bg-forest-800 text-luxury-cream text-sm rounded font-medium shadow"
              >
                저장 완료
              </button>
            </div>
          </div>
        ) : step === 'input' ? (
          /* STEP 1: Main Name Input View */
          <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Visual branding block */}
            <div className="text-center md:text-left space-y-6 md:pr-6 animate-slide-up">
              <div className="inline-block px-3 py-1 rounded-full border border-forest-200 text-[11px] font-semibold tracking-widest text-forest-600 uppercase bg-forest-50/50">
                1:1 Private Scent Matching
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight text-forest-950">
                당신의 이름은<br />
                <span className="text-forest-700 italic font-medium">어떤 향기</span>를 품었나요?
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-forest-600">
                한글 이름의 어감과 문자 구조를 분석하는 1단계 분석 후, 평소 좋아하는 공간과 매력에 대한 간단한 2단계 설문을 조합하여 당신만의 시그니처 향수를 매칭합니다.
              </p>
              
              {/* Premium Bottle Illustration Graphic */}
              <div className="hidden md:flex justify-center md:justify-start pt-4">
                <svg className="w-48 h-48 drop-shadow-xl hover:rotate-1 transition-transform duration-500" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Glass bottle outer */}
                  <rect x="50" y="70" width="100" height="100" rx="16" fill="rgba(77, 128, 106, 0.05)" stroke="#c5a880" strokeWidth="2.5" />
                  <rect x="47" y="67" width="106" height="106" rx="19" stroke="rgba(197, 168, 128, 0.15)" strokeWidth="1" />
                  {/* Cap */}
                  <rect x="80" y="32" width="40" height="28" rx="4" fill="#0c1814" stroke="#c5a880" strokeWidth="2" />
                  <rect x="75" y="60" width="50" height="10" fill="#c5a880" />
                  {/* Liquid inside */}
                  <path d="M53 100 C 70 95, 130 105, 147 100 L 147 154 C 147 162, 141 167, 134 167 L 66 167 C 59 167, 53 162, 53 154 Z" fill="rgba(197, 168, 128, 0.12)" />
                  {/* Forest Green Label */}
                  <rect x="65" y="90" width="70" height="50" rx="4" fill="#0c1814" stroke="#c5a880" strokeWidth="1" />
                  <line x1="72" y1="102" x2="128" y2="102" stroke="rgba(197, 168, 128, 0.4)" strokeWidth="0.5" />
                  <text x="100" y="118" fill="#c5a880" fontSize="8" fontWeight="bold" fontFamily="Cinzel, serif" letterSpacing="1.5" textAnchor="middle">L'ATELIER</text>
                  <text x="100" y="128" fill="rgba(253, 251, 247, 0.7)" fontSize="6" fontFamily="Inter, sans-serif" letterSpacing="1" textAnchor="middle">N° 260705</text>
                  <line x1="72" y1="133" x2="128" y2="133" stroke="rgba(197, 168, 128, 0.4)" strokeWidth="0.5" />
                  
                  {/* Spray tube */}
                  <line x1="100" y1="65" x2="100" y2="155" stroke="rgba(197, 168, 128, 0.3)" strokeWidth="1.5" />
                  {/* Subtle shine/sparkle */}
                  <circle cx="138" cy="85" r="3" fill="#c5a880" className="animate-pulse" />
                  <path d="M165 45 L168 50 L173 51 L169 55 L170 60 L165 57 L160 60 L161 55 L157 51 L162 50 Z" fill="#c5a880" opacity="0.6" className="animate-pulse-slow" />
                </svg>
              </div>
            </div>

            {/* Input container */}
            <div className="bg-white border border-luxury-gold/15 rounded-2xl p-8 shadow-xl flex flex-col justify-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-forest-50 to-transparent opacity-50 -z-10 rounded-tr-2xl"></div>
              
              <div className="space-y-2 text-center md:text-left">
                <h3 className="font-serif text-lg font-semibold text-forest-900">1단계: 이름 분석 의뢰</h3>
                <p className="text-xs text-forest-500">당신의 한글 이름을 입력하여 향수 매칭 여정을 시작해 보세요.</p>
              </div>
              
              <NameInput onRecommend={handleStartSurvey} isLoading={isLoading} />
              
              <div className="border-t border-luxury-sand pt-4 flex items-center justify-between text-[11px] text-forest-400">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-forest-600" />
                  이름 + 취향 분석 조합
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-forest-600" />
                  3가지 대안 조합 제안
                </span>
              </div>
            </div>
          </div>
        ) : step === 'survey' ? (
          /* STEP 2: Interactive Survey View */
          <div className="w-full max-w-xl bg-white border border-luxury-gold/20 rounded-2xl shadow-xl p-6 md:p-8 animate-slide-up relative">
            <button
              onClick={() => setStep('input')}
              className="absolute top-6 left-6 text-xs text-forest-500 hover:text-forest-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              이름 재입력
            </button>
            <div className="text-center mt-6 mb-8">
              <span className="text-[10px] tracking-[0.25em] font-serif text-luxury-goldDark uppercase block mb-1">
                Step 2: Preference Profile
              </span>
              <h2 className="font-serif text-xl font-bold text-forest-950">
                {name}님의 향 선호도 설문 ({currentQIndex + 1}/3)
              </h2>
              {/* Gold progress bar */}
              <div className="w-full bg-luxury-sand/50 h-1 mt-4 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-luxury-gold to-forest-800 h-full transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Active Question Display */}
            <div className="space-y-6">
              <div className="p-4 bg-luxury-cream/40 border border-luxury-gold/10 rounded-xl">
                <p className="font-serif text-sm font-semibold text-forest-900">
                  {SURVEY_QUESTIONS[currentQIndex].question}
                </p>
              </div>

              <div className="space-y-3">
                {SURVEY_QUESTIONS[currentQIndex].options.map((opt) => {
                  const key = `q${currentQIndex + 1}` as keyof SurveyAnswers;
                  const isSelected = surveyAnswers[key] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSurveyAnswers(prev => ({
                          ...prev,
                          [key]: opt.id
                        }));
                      }}
                      className={`w-full text-left p-4 rounded-xl border text-xs transition-all flex justify-between items-center ${
                        isSelected 
                          ? 'border-forest-800 bg-forest-50/50 font-bold text-forest-900 shadow-sm' 
                          : 'border-luxury-sand bg-white text-forest-700 hover:bg-luxury-cream/20 hover:border-luxury-gold/30'
                      }`}
                    >
                      <span>{opt.text}</span>
                      {isSelected && <Check className="w-4 h-4 text-forest-800" />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center border-t border-luxury-sand pt-6 mt-6">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className="px-4 py-2 border border-luxury-sand rounded text-xs text-forest-600 hover:bg-forest-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  이전 질문
                </button>

                {currentQIndex < 2 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="px-6 py-2.5 bg-forest-800 text-luxury-cream rounded text-xs font-semibold hover:bg-forest-900 transition-colors flex items-center gap-1.5"
                  >
                    <span>다음 질문</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateRecipe}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-luxury-goldDark text-luxury-cream rounded text-xs font-bold hover:bg-luxury-goldDark/90 transition-colors flex items-center gap-1.5 shadow"
                  >
                    {isLoading ? (
                      <span>분석하는 중...</span>
                    ) : (
                      <>
                        <span>시그니처 향수 생성</span>
                        <Sparkles className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* STEP 3: Scent Analysis Results View (3 Recipes Tab) */
          <div className="max-w-4xl w-full space-y-8 animate-slide-up">
            {/* Top Back Nav */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setStep('input');
                  setAnalysis(null);
                  setRawRecipes([]);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-950 transition-colors uppercase tracking-wider"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>다시 입력하기</span>
              </button>
            </div>

            {/* Recipe Priority Tab Navigation */}
            <div className="flex bg-white p-1.5 border border-luxury-gold/15 rounded-2xl shadow-sm gap-2">
              {rawRecipes.map((_, idx) => {
                const isSelected = activeRecipeIndex === idx;
                let rankLabel = '1순위 조합 (가장 추천)';
                if (idx === 1) rankLabel = '2순위 조합 (대안 제안)';
                if (idx === 2) rankLabel = '3순위 조합 (대안 제안)';
                
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveRecipeIndex(idx)}
                    className={`flex-1 py-3 text-xs md:text-sm font-serif tracking-wider font-bold rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-forest-900 text-luxury-cream shadow-md' 
                        : 'text-forest-500 hover:bg-luxury-cream/30 hover:text-forest-800'
                    }`}
                  >
                    {rankLabel}
                  </button>
                );
              })}
            </div>

            {/* Results Grid for Active Recipe */}
            {activeRecipe && (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Left Column: Scent Concept and Analysis Description */}
                <div className="md:col-span-1 bg-white border border-luxury-gold/15 rounded-2xl p-6 md:p-8 space-y-6 shadow-md flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Name Tag Box */}
                    <div className="text-center py-4 px-2 border-2 border-double border-luxury-gold/40 rounded-lg bg-luxury-cream/40">
                      <span className="text-[10px] tracking-[0.2em] font-serif text-luxury-goldDark uppercase block mb-1">
                        Scent Holder
                      </span>
                      <h2 className="font-serif text-2xl font-bold tracking-widest text-forest-950">
                        {name}
                      </h2>
                    </div>

                    {/* Vibe Tags */}
                    {analysis && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-widest text-forest-400 uppercase">
                          Analyzed Profile
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.imageTags.slice(0, 3).map((img) => (
                            <span key={img} className="text-[11px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 font-medium border border-forest-100 shadow-sm">
                              {img} 이미지
                            </span>
                          ))}
                          {analysis.moodTags.slice(0, 3).map((mood) => (
                            <span key={mood} className="text-[11px] px-2 py-0.5 rounded-full bg-luxury-sand text-forest-800 font-medium border border-luxury-gold/15 shadow-sm">
                              #{mood}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Concept Statement */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold tracking-widest text-forest-400 uppercase">
                        Scent Concept
                      </h4>
                      <p className="font-serif text-sm font-semibold text-forest-800 italic leading-relaxed pl-3 border-l-2 border-luxury-gold">
                        "{activeRecipe.concept}"
                      </p>
                    </div>

                    {/* Narrative Analysis */}
                    {analysis && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-xs font-bold tracking-widest text-forest-400 uppercase">
                          Scent Narrative
                        </h4>
                        <p className="text-xs leading-relaxed text-forest-600 text-justify">
                          {analysis.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Advanced Slider controls at the bottom */}
                  <div className="border-t border-luxury-sand pt-6 mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold tracking-widest text-forest-400 uppercase">
                        Advanced Ratios
                      </h4>
                      <span className="text-[10px] text-forest-400 font-semibold text-luxury-goldDark">
                        Match Score: {activeRecipe.matchScore}점
                      </span>
                    </div>
                    
                    {/* Preset quick buttons */}
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => applyPreset(40, 40, 20)}
                        className={`text-[9px] py-1 border rounded transition-colors ${
                          activeRatio.top === 40 && activeRatio.middle === 40 ? 'bg-forest-800 border-forest-800 text-white' : 'border-forest-200 text-forest-600 hover:bg-forest-50'
                        }`}
                      >
                        상큼한 탑 강조
                      </button>
                      <button
                        onClick={() => applyPreset(25, 45, 30)}
                        className={`text-[9px] py-1 border rounded transition-colors ${
                          activeRatio.top === 25 && activeRatio.middle === 45 ? 'bg-forest-800 border-forest-800 text-white' : 'border-forest-200 text-forest-600 hover:bg-forest-50'
                        }`}
                      >
                        기본 하모니
                      </button>
                      <button
                        onClick={() => applyPreset(15, 40, 45)}
                        className={`text-[9px] py-1 border rounded transition-colors ${
                          activeRatio.top === 15 && activeRatio.middle === 40 ? 'bg-forest-800 border-forest-800 text-white' : 'border-forest-200 text-forest-600 hover:bg-forest-50'
                        }`}
                      >
                        은은한 잔향
                      </button>
                    </div>

                    {/* Manual sliders */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] text-forest-700 font-medium mb-1">
                          <span>Top Note Target</span>
                          <span>{activeRatio.top}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="40" 
                          step="5"
                          value={activeRatio.top} 
                          onChange={(e) => handleRatioSliderChange('top', parseInt(e.target.value))}
                          className="w-full accent-forest-700 h-1 bg-luxury-sand rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-forest-700 font-medium mb-1">
                          <span>Middle Note Target</span>
                          <span>{activeRatio.middle}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="30" 
                          max="60" 
                          step="5"
                          value={activeRatio.middle} 
                          onChange={(e) => handleRatioSliderChange('middle', parseInt(e.target.value))}
                          className="w-full accent-forest-700 h-1 bg-luxury-sand rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Recipe Cards */}
                <div className="md:col-span-2 space-y-6">
                  {/* Visual Ratio Bar Card */}
                  <div className="bg-white border border-luxury-gold/15 rounded-2xl p-6 shadow-md">
                    <RatioBar top={activeRecipe.top} middle={activeRecipe.middle} base={activeRecipe.base} />
                  </div>

                  {/* 3 Note Section Cards */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <NoteSection 
                      title="Top Notes" 
                      items={activeRecipe.top} 
                      badgeColor="bg-forest-300"
                      borderColor="border-forest-200"
                      nameMap={nameMap}
                    />
                    <NoteSection 
                      title="Middle Notes" 
                      items={activeRecipe.middle} 
                      badgeColor="bg-forest-500"
                      borderColor="border-forest-400"
                      nameMap={nameMap}
                    />
                    <NoteSection 
                      title="Base Notes" 
                      items={activeRecipe.base} 
                      badgeColor="bg-forest-800"
                      borderColor="border-forest-700"
                      nameMap={nameMap}
                    />
                  </div>

                  {/* Scent Development Narrative */}
                  <div className="bg-forest-950 text-luxury-cream border border-forest-900 rounded-2xl p-6 shadow-md space-y-3">
                    <div className="flex items-center gap-2 text-luxury-gold">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="font-serif text-sm font-bold tracking-wider uppercase">Scent Development (향의 변화)</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-forest-200 text-justify">
                      {activeRecipe.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Luxury Footer */}
      <footer className="border-t border-luxury-gold/10 bg-forest-950 text-forest-300 py-6 text-center text-xs">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-serif tracking-widest text-[10px] text-luxury-gold/70">
            © 2026 NAME 2 PERFUME. ALL RIGHTS RESERVED.
          </p>
          <p className="text-[9px] text-forest-500">
            이름 감성 매핑 추천 기능은 향수 제조 기획용 감성 분류를 제공하며, 실제 원료 배합 시 가이드로 사용될 수 있습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
