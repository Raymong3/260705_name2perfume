import { useState } from 'react';
import { Sparkles, ChevronLeft, Settings, Check } from 'lucide-react';
import { NameInput } from '../components/NameInput';
import { NoteSection } from '../components/NoteSection';
import { analyzeName } from '../logic/analyzeName';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { NameAnalysis, PerfumeRecipe } from '../types/perfume';
import { NOTES } from '../data/notes';

// Build default name mappings dynamically from 61 NOTES
const DEFAULT_INGREDIENT_NAMES = NOTES.reduce((acc, note) => {
  acc[note.id] = note.nameKo ? `${note.nameKo} (${note.nameEn})` : note.nameEn;
  return acc;
}, {} as Record<string, string>);

export default function App() {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');
  
  // Recommendations
  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);
  const [rawRecipes, setRawRecipes] = useState<PerfumeRecipe[]>([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);

  // Ingredient Names State (initialized from localStorage or defaults)
  const [nameMap, setNameMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('perfume_name_map');
    return saved ? JSON.parse(saved) : DEFAULT_INGREDIENT_NAMES;
  });

  const [isEditingNames, setIsEditingNames] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'middle' | 'base'>('top');

  // Handle recommendation request (직접 분석 및 추천 결과 생성)
  const handleRecommend = (inputName: string) => {
    try {
      setIsLoading(true);
      const resultAnalysis = analyzeName(inputName);
      setName(inputName);
      setAnalysis(resultAnalysis);

      setTimeout(() => {
        try {
          const recipes = recommendPerfumes(resultAnalysis);
          setRawRecipes(recipes);
          setActiveRecipeIndex(0);
          setStep('result');
        } catch (err) {
          alert('추천 레시피 생성 과정에서 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      }, 800);
    } catch (err) {
      alert(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const activeRecipe = rawRecipes[activeRecipeIndex] || null;


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
          <div className="max-w-5xl xl:max-w-6xl w-full grid lg:grid-cols-2 grid-cols-1 gap-8 lg:gap-12 items-center">
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
                한글 이름의 어감과 문자 구조를 분석하여 당신만의 시그니처 향수를 매칭합니다.
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
                <h3 className="font-serif text-lg font-semibold text-forest-900">이름 분석 의뢰</h3>
                <p className="text-xs text-forest-500">당신의 한글 이름을 입력하여 향수 매칭 여정을 시작해 보세요.</p>
              </div>
              
              <NameInput onRecommend={handleRecommend} isLoading={isLoading} />
              
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
        ) : (
          /* STEP 2: Scent Analysis Results View (3 Recipes Tab) */
          <div className="max-w-5xl xl:max-w-6xl w-full space-y-8 animate-slide-up">
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
              {rawRecipes.slice(0, 2).map((_, idx) => {
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
              <div className="grid lg:grid-cols-3 grid-cols-1 gap-6">
                {/* Left Column: Scent Concept and Analysis Description */}
                <div className="lg:col-span-1 bg-white border border-luxury-gold/15 rounded-2xl p-6 md:p-8 space-y-6 shadow-md flex flex-col justify-between">
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

                  <div className="border-t border-luxury-sand pt-4 mt-2 flex justify-between items-center text-[10px] text-forest-400 font-semibold">
                    <span>이름 기반 향 추천</span>
                    <span>매치 점수: {activeRecipe.matchScore}점</span>
                  </div>
                </div>

                {/* Right Column: Recipe Cards */}
                <div className="lg:col-span-2 space-y-6">
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
