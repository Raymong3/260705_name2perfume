import { useState } from 'react';
import { Sparkles, ChevronLeft, ArrowRight, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { NameInput } from '../components/NameInput';
import { Header } from '../components/Header';
import perfumeImgUrl from '../assets/perfume_hunmin_v3.png';
import { analyzeName } from '../logic/analyzeName';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { NameAnalysis, PerfumeRecipe, SejongStory, FinalRecipe, RecommendedNote } from '../types/perfume';
import { SEJONG_STORIES } from '../data/sejongStories';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { NOTES } from '../data/notes';

export default function App() {
  const [step, setStep] = useState<'input' | 'sejong' | 'survey' | 'result' | 'record'>('input');
  
  // 1단계: 이름 관련 상태
  const [name, setName] = useState('');
  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2단계: 세종의 이야기 상태
  const [selectedStory, setSelectedStory] = useState<SejongStory | null>(null);

  // 3단계: 설문조사 상태
  const [surveyAnswers, setSurveyAnswers] = useState<{ questionId: number; optionId: number }[]>([]);
  const [currentSurveyIdx, setCurrentSurveyIdx] = useState(0);

  // 4단계: 추천 및 선택 상태
  const [recommended1, setRecommended1] = useState<PerfumeRecipe | null>(null);
  const [recommended2, setRecommended2] = useState<PerfumeRecipe | null>(null);
  const [selectedRecipeType, setSelectedRecipeType] = useState<'name_only' | 'name_sejong' | null>(null);

  // 4단계 조향사 수정 패널용 상태
  const [finalTop, setFinalTop] = useState<RecommendedNote[]>([]);
  const [finalMiddle, setFinalMiddle] = useState<RecommendedNote[]>([]);
  const [finalBase, setFinalBase] = useState<RecommendedNote[]>([]);
  const [addedNotesText, setAddedNotesText] = useState('');
  const [removedNotesText, setRemovedNotesText] = useState('');
  const [modifiedNotesText, setModifiedNotesText] = useState('');
  const [makerMemo, setMakerMemo] = useState('');
  const [finalPerfumeName, setFinalPerfumeName] = useState('');

  // 향료 추가를 위한 임시 선택 상태
  const [selectedTopToAdd, setSelectedTopToAdd] = useState('');
  const [selectedMiddleToAdd, setSelectedMiddleToAdd] = useState('');
  const [selectedBaseToAdd, setSelectedBaseToAdd] = useState('');

  // 5단계: 최종 기록서 상태
  const [finalRecipe, setFinalRecipe] = useState<FinalRecipe | null>(null);

  // 1단계 완료 -> 이름 분석 진행 및 2단계 이동
  const handleNameSubmit = (inputName: string) => {
    setIsLoading(true);
    setName(inputName);
    try {
      const nameAnalysis = analyzeName(inputName);
      setAnalysis(nameAnalysis);
      setTimeout(() => {
        setIsLoading(false);
        setStep('sejong');
      }, 800);
    } catch (err) {
      alert(err instanceof Error ? err.message : '이름 분석 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 2단계 완료 -> 3단계 이동
  const handleSejongSubmit = () => {
    if (!selectedStory) {
      alert('세종의 이야기를 하나 선택해주세요.');
      return;
    }
    setStep('survey');
    setCurrentSurveyIdx(0);
    setSurveyAnswers([]);
  };

  // 3단계 설문 응답 처리
  const handleSurveyAnswer = (optionId: number) => {
    const questionId = SURVEY_QUESTIONS[currentSurveyIdx].id;
    const newAnswers = [...surveyAnswers.filter(a => a.questionId !== questionId), { questionId, optionId }];
    setSurveyAnswers(newAnswers);

    if (currentSurveyIdx < SURVEY_QUESTIONS.length - 1) {
      setCurrentSurveyIdx(currentSurveyIdx + 1);
    } else {
      // 설문 완료 -> 추천 레시피 생성 및 4단계 이동
      if (analysis) {
        const { recipe1, recipe2 } = recommendPerfumes(analysis, selectedStory, newAnswers);
        setRecommended1(recipe1);
        setRecommended2(recipe2);
        setStep('result');
        setSelectedRecipeType(null); // 초기화
      }
    }
  };

  // 추천 향 선택 시 수정 폼에 초기값 할당
  const handleSelectRecipeType = (type: 'name_only' | 'name_sejong') => {
    setSelectedRecipeType(type);
    const targetRecipe = type === 'name_only' ? recommended1 : recommended2;
    if (targetRecipe) {
      setFinalTop(JSON.parse(JSON.stringify(targetRecipe.top)));
      setFinalMiddle(JSON.parse(JSON.stringify(targetRecipe.middle)));
      setFinalBase(JSON.parse(JSON.stringify(targetRecipe.base)));
      setFinalPerfumeName(targetRecipe.name + '의 향');
      setAddedNotesText('');
      setRemovedNotesText('');
      setModifiedNotesText('');
      setMakerMemo('');
    }
  };

  // 조향사 향료 추가 로직
  const handleAddNote = (category: 'top' | 'middle' | 'base', noteId: string) => {
    if (!noteId) return;
    const noteObj = NOTES.find(n => n.id === noteId);
    if (!noteObj) return;

    const list = category === 'top' ? finalTop : category === 'middle' ? finalMiddle : finalBase;
    
    // 중복 확인
    if (list.some(item => item.note.id === noteId)) {
      alert('이미 추가된 향료입니다.');
      return;
    }

    const newItem: RecommendedNote = {
      note: noteObj,
      ratio: 10,
      reason: '조향사 수동 추가 향료'
    };

    if (category === 'top') {
      setFinalTop([...finalTop, newItem]);
      setSelectedTopToAdd('');
    } else if (category === 'middle') {
      setFinalMiddle([...finalMiddle, newItem]);
      setSelectedMiddleToAdd('');
    } else {
      setFinalBase([...finalBase, newItem]);
      setSelectedBaseToAdd('');
    }
  };

  // 조향사 향료 삭제 로직
  const handleRemoveNote = (category: 'top' | 'middle' | 'base', index: number) => {
    if (category === 'top') {
      setFinalTop(finalTop.filter((_, idx) => idx !== index));
    } else if (category === 'middle') {
      setFinalMiddle(finalMiddle.filter((_, idx) => idx !== index));
    } else {
      setFinalBase(finalBase.filter((_, idx) => idx !== index));
    }
  };

  // 조향사 비율 변경 로직
  const handleRatioChange = (category: 'top' | 'middle' | 'base', index: number, ratio: number) => {
    const val = isNaN(ratio) ? 0 : Math.max(0, Math.min(100, ratio));
    if (category === 'top') {
      const updated = [...finalTop];
      updated[index].ratio = val;
      setFinalTop(updated);
    } else if (category === 'middle') {
      const updated = [...finalMiddle];
      updated[index].ratio = val;
      setFinalMiddle(updated);
    } else {
      const updated = [...finalBase];
      updated[index].ratio = val;
      setFinalBase(updated);
    }
  };

  // 최종 레시피 확정 및 5단계(기록서) 이동
  const handleConfirmFinalRecipe = () => {
    if (!selectedRecipeType) return;
    const targetRecipe = selectedRecipeType === 'name_only' ? recommended1 : recommended2;
    if (!targetRecipe) return;

    const totalRatio = [...finalTop, ...finalMiddle, ...finalBase].reduce((sum, item) => sum + (item.ratio || 0), 0);
    if (totalRatio !== 100) {
      if (!window.confirm(`현재 향료 비율의 합이 ${totalRatio}%입니다. 보통 100%를 기준으로 조향하지만, 그대로 진행하시겠습니까?`)) {
        return;
      }
    }

    const today = new Date();
    const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}.`;

    const result: FinalRecipe = {
      selectedType: selectedRecipeType,
      originalRecipe: targetRecipe,
      top: finalTop,
      middle: finalMiddle,
      base: finalBase,
      addedNotes: addedNotesText.split(',').map(s => s.trim()).filter(Boolean),
      removedNotes: removedNotesText.split(',').map(s => s.trim()).filter(Boolean),
      modifiedNotes: modifiedNotesText.split(',').map(s => s.trim()).filter(Boolean),
      perfumeName: finalPerfumeName.trim() || `${name}의 시그니처 향`,
      makerMemo: makerMemo.trim(),
      createdDate: formattedDate
    };

    setFinalRecipe(result);
    setStep('record');
  };

  // 처음으로 돌아가기
  const handleReset = () => {
    if (window.confirm('모든 기록을 초기화하고 처음 단계로 돌아가시겠습니까?')) {
      setName('');
      setAnalysis(null);
      setSelectedStory(null);
      setSurveyAnswers([]);
      setCurrentSurveyIdx(0);
      setRecommended1(null);
      setRecommended2(null);
      setSelectedRecipeType(null);
      setFinalRecipe(null);
      setStep('input');
    }
  };

  // 총 비율 합 계산용 헬퍼
  const currentTotalRatio = [...finalTop, ...finalMiddle, ...finalBase].reduce((sum, item) => sum + (item.ratio || 0), 0);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-forest-100 print:bg-white print:min-h-0">
      {/* Header - 인쇄 시 미출력 */}
      <div className="print-exclude">
        <Header />
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 bg-luxury-cream/10 print:py-0 print:px-0 print:bg-white">
        
        {/* 1단계: 나를 읽다 (이름 입력) */}
        {step === 'input' && (
          <div className="max-w-5xl xl:max-w-6xl w-full grid lg:grid-cols-2 grid-cols-1 gap-8 lg:gap-12 items-center print-exclude">
            <div className="text-center md:text-left space-y-6 md:pr-6 animate-slide-up">
              <div className="inline-block px-3 py-1 rounded-full border border-forest-200 text-[11px] font-semibold tracking-widest text-forest-600 uppercase bg-forest-50/50">
                조향사 상담 플로우 - 1단계
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-forest-950">
                훈민향음<br />
                <span className="text-forest-700 font-medium text-2xl md:text-3xl font-serif">(訓民香音)</span>
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-forest-600 font-medium">
                세종대왕이 훈민정음으로 백성의 뜻을 담아냈듯,<br className="hidden md:inline" />
                조향사와의 대화를 거쳐 당신의 이름과 이야기를 하나의 특별한 향으로 완성합니다.
              </p>
              
              <div className="hidden md:flex justify-center md:justify-start pt-4 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-luxury-gold to-forest-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
                <img 
                  src={perfumeImgUrl} 
                  alt="훈민향음 향수" 
                  className="relative w-full max-w-lg h-72 md:h-80 object-cover rounded-2xl drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500" 
                />
              </div>
            </div>
 
            <div className="bg-white border border-luxury-gold/15 rounded-2xl p-8 shadow-xl flex flex-col justify-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-forest-50 to-transparent opacity-50 -z-10 rounded-tr-2xl"></div>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="font-serif text-lg font-semibold text-forest-900">조향 의뢰서 작성</h3>
                <p className="text-xs text-forest-500">당신의 소중한 한글 이름을 입력하여 향수 제작 여정을 시작해 보세요.</p>
              </div>
              <NameInput onNext={handleNameSubmit} isLoading={isLoading} />
            </div>
          </div>
        )}

        {/* 2단계: 세종을 만나다 (이야기 선택) */}
        {step === 'sejong' && (
          <div className="max-w-4xl w-full space-y-8 animate-slide-up print-exclude">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold tracking-widest text-luxury-goldDark uppercase">Step 02</span>
              <h2 className="font-serif text-3xl font-bold text-forest-950">세종의 이야기를 담다</h2>
              <p className="text-sm text-forest-600 max-w-lg mx-auto">
                향에 녹여내고 싶은 세종대왕의 역사 속 스토리를 한 가지 선택해 주세요. 향기에 고귀한 백성 사랑의 서사가 깃들게 됩니다.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {SEJONG_STORIES.map((story) => {
                const isSelected = selectedStory?.id === story.id;
                return (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className={`text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-64 bg-white relative overflow-hidden group hover:shadow-lg ${
                      isSelected 
                        ? 'border-luxury-gold ring-2 ring-luxury-gold/30 shadow-md' 
                        : 'border-luxury-gold/15 hover:border-forest-400'
                    }`}
                  >
                    {/* Background Decorative Emblem */}
                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-luxury-cream/30 rounded-full group-hover:scale-110 transition-transform duration-500 -z-10"></div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-serif text-xs font-bold text-luxury-goldDark tracking-wider uppercase">
                          {story.title}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-forest-800 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-forest-900 group-hover:text-forest-950 transition-colors">
                        {story.subtitle}
                      </h3>
                      <p className="text-xs text-forest-600 leading-relaxed font-medium line-clamp-4">
                        {story.description}
                      </p>
                    </div>

                    <div className="text-[10px] font-semibold text-forest-400 italic pt-2 border-t border-luxury-sand/50 w-full">
                      {story.imageDesc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button 
                onClick={() => setStep('input')}
                className="flex items-center gap-1 text-sm font-bold text-forest-600 hover:text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
              <button
                onClick={handleSejongSubmit}
                disabled={!selectedStory}
                className="luxury-btn flex items-center gap-1.5 px-6 py-3 bg-forest-800 text-luxury-cream rounded-xl text-sm font-semibold hover:bg-forest-900 disabled:opacity-50"
              >
                <span>향 선호도 설문으로</span> <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3단계: 향으로 연결하다 (향 선호도 설문) */}
        {step === 'survey' && (
          <div className="max-w-2xl w-full space-y-8 animate-slide-up print-exclude">
            {/* Top Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-forest-500">
                <span>향 선호도 설문</span>
                <span>{currentSurveyIdx + 1} / {SURVEY_QUESTIONS.length}</span>
              </div>
              <div className="w-full h-1.5 bg-luxury-sand rounded-full overflow-hidden">
                <div 
                  className="h-full bg-luxury-gold transition-all duration-300"
                  style={{ width: `${((currentSurveyIdx + 1) / SURVEY_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white border border-luxury-gold/15 rounded-2xl p-8 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[10px] tracking-widest text-luxury-goldDark font-serif uppercase">Step 03</span>
                <h3 className="font-serif text-xl font-bold text-forest-950">
                  {SURVEY_QUESTIONS[currentSurveyIdx].question}
                </h3>
              </div>

              <div className="space-y-3.5">
                {SURVEY_QUESTIONS[currentSurveyIdx].options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSurveyAnswer(option.id)}
                    className="w-full text-left px-5 py-4 bg-luxury-cream/40 border border-luxury-gold/10 hover:border-forest-600 hover:bg-white rounded-xl transition-all text-sm font-medium text-forest-800 hover:text-forest-950 shadow-sm active:scale-[0.995]"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={() => {
                  if (currentSurveyIdx > 0) {
                    setCurrentSurveyIdx(currentSurveyIdx - 1);
                  } else {
                    setStep('sejong');
                  }
                }}
                className="flex items-center gap-1 text-sm font-bold text-forest-600 hover:text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
            </div>
          </div>
        )}

        {/* 4단계: 향을 완성하다 (추천 결과 선택 및 조향사 수정 패널) */}
        {step === 'result' && (
          <div className="max-w-6xl w-full space-y-8 animate-slide-up print-exclude">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-luxury-goldDark uppercase">Step 04</span>
              <h2 className="font-serif text-3xl font-bold text-forest-950">당신의 이야기를 담아낸 두 가지 향</h2>
              <p className="text-xs text-forest-600">
                아래 제안된 두 가지 테마의 향취 중, 오늘 당신의 마음에 닿는 향을 선택해 주시면 조향사와 최종 레시피 완성을 조율합니다.
              </p>
            </div>

            {/* Two recommendation cards */}
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              
              {/* 추천 1: 나의 이름을 담은 향 */}
              {recommended1 && (
                <div 
                  onClick={() => handleSelectRecipeType('name_only')}
                  className={`cursor-pointer bg-white border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                    selectedRecipeType === 'name_only'
                      ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-xl scale-[1.01]'
                      : 'border-luxury-gold/15 hover:border-forest-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-forest-50 border border-forest-200 text-forest-700 font-bold uppercase tracking-wider">
                        추천 테마 01
                      </span>
                      <input 
                        type="radio" 
                        name="recipeSelect" 
                        checked={selectedRecipeType === 'name_only'} 
                        onChange={() => handleSelectRecipeType('name_only')}
                        className="w-4 h-4 text-forest-900 border-luxury-gold focus:ring-forest-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-2xl font-bold text-forest-950">나의 이름을 담은 향</h3>
                      <p className="text-[11px] text-forest-400 italic">이름 분석과 취향 설문을 결합한 고유의 무드</p>
                    </div>
                    <p className="text-xs leading-relaxed text-forest-600 pl-3 border-l-2 border-luxury-gold font-medium">
                      "{recommended1.concept}"
                    </p>

                    {/* Note details */}
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-forest-800">
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Top</div>
                          {recommended1.top.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Middle</div>
                          {recommended1.middle.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Base</div>
                          {recommended1.base.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button 
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selectedRecipeType === 'name_only'
                          ? 'bg-forest-900 text-luxury-cream'
                          : 'bg-luxury-cream text-forest-700 border border-luxury-gold/20 hover:bg-luxury-cream/60'
                      }`}
                    >
                      {selectedRecipeType === 'name_only' ? '✓ 이 향을 기반으로 조향 진행' : '선택하기'}
                    </button>
                  </div>
                </div>
              )}

              {/* 추천 2: 이름과 세종이 만난 향 */}
              {recommended2 && (
                <div 
                  onClick={() => handleSelectRecipeType('name_sejong')}
                  className={`cursor-pointer bg-white border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                    selectedRecipeType === 'name_sejong'
                      ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-xl scale-[1.01]'
                      : 'border-luxury-gold/15 hover:border-forest-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-luxury-sand/50 border border-luxury-gold/20 text-forest-800 font-bold uppercase tracking-wider">
                        추천 테마 02
                      </span>
                      <input 
                        type="radio" 
                        name="recipeSelect" 
                        checked={selectedRecipeType === 'name_sejong'} 
                        onChange={() => handleSelectRecipeType('name_sejong')}
                        className="w-4 h-4 text-forest-900 border-luxury-gold focus:ring-forest-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-2xl font-bold text-forest-950">이름과 세종이 만난 향</h3>
                      <p className="text-[11px] text-forest-400 italic">이름 분석, 취향 설문, 그리고 세종의 이야기({selectedStory?.title})의 만남</p>
                    </div>
                    <p className="text-xs leading-relaxed text-forest-600 pl-3 border-l-2 border-luxury-gold font-medium">
                      "{recommended2.concept}"
                    </p>

                    {/* Note details */}
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-forest-800">
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Top</div>
                          {recommended2.top.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Middle</div>
                          {recommended2.middle.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Base</div>
                          {recommended2.base.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button 
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selectedRecipeType === 'name_sejong'
                          ? 'bg-forest-900 text-luxury-cream'
                          : 'bg-luxury-cream text-forest-700 border border-luxury-gold/20 hover:bg-luxury-cream/60'
                      }`}
                    >
                      {selectedRecipeType === 'name_sejong' ? '✓ 이 향을 기반으로 조향 진행' : '선택하기'}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* 조향사 상담 및 최종 조율 패널 (향을 하나 선택하면 노출됨) */}
            {selectedRecipeType && (
              <div className="bg-forest-950 text-luxury-cream border border-forest-900 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-slide-up mt-6">
                
                <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-forest-800 pb-5 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-luxury-gold">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="font-serif text-xl font-bold tracking-wide uppercase">조향사 상담 및 최종 조율 (Counseling & Formulation)</h3>
                    </div>
                    <p className="text-xs text-forest-300">시향 및 상담 과정에서의 피드백을 반영하여 최종 레시피를 수정·입력합니다.</p>
                  </div>
                  
                  {/* 최종 향수 이름 입력 필드 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-luxury-gold w-20 font-serif">최종 향수명 :</label>
                    <input 
                      type="text" 
                      value={finalPerfumeName}
                      onChange={(e) => setFinalPerfumeName(e.target.value)}
                      placeholder="홍길동의 시그니처 향"
                      className="px-3 py-1.5 bg-forest-900 border border-forest-700 rounded-lg text-sm text-white focus:outline-none focus:border-luxury-gold min-w-[200px]"
                    />
                  </div>
                </div>

                {/* 노트별 향료 관리 */}
                <div className="grid lg:grid-cols-3 gap-6">
                  
                  {/* Top Notes 관리 */}
                  <div className="bg-forest-900/50 p-5 rounded-2xl border border-forest-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-forest-800 pb-2">
                      <h4 className="font-serif text-sm font-bold text-luxury-gold">Top Notes</h4>
                      <span className="text-[10px] text-forest-300 font-mono">가볍고 첫 인상을 남기는 향</span>
                    </div>

                    {/* 향료 리스트 */}
                    <div className="space-y-3 min-h-[120px]">
                      {finalTop.map((item, idx) => (
                        <div key={item.note.id} className="flex flex-col gap-1.5 bg-forest-950/60 p-2.5 rounded-lg border border-forest-800">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">
                              {item.note.nameKo || item.note.nameEn} <span className="text-[9px] font-mono font-normal text-forest-400">({item.note.nameEn})</span>
                            </span>
                            <button 
                              onClick={() => handleRemoveNote('top', idx)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={item.ratio || 0}
                              onChange={(e) => handleRatioChange('top', idx, parseInt(e.target.value))}
                              className="flex-grow accent-luxury-gold h-1 bg-forest-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-mono text-luxury-gold w-8 text-right">{item.ratio || 0}%</span>
                          </div>
                        </div>
                      ))}
                      {finalTop.length === 0 && (
                        <div className="text-center text-xs text-forest-500 py-10">지정된 탑 노트 향료가 없습니다.</div>
                      )}
                    </div>

                    {/* 향료 추가 셀렉트박스 */}
                    <div className="flex gap-2">
                      <select 
                        value={selectedTopToAdd}
                        onChange={(e) => setSelectedTopToAdd(e.target.value)}
                        className="flex-grow px-2 py-1.5 bg-forest-950 border border-forest-800 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="">탑 향료 선택...</option>
                        {NOTES.filter(n => n.type === 'top').map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo || n.nameEn} ({n.nameEn})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAddNote('top', selectedTopToAdd)}
                        className="px-3 py-1.5 bg-luxury-gold text-forest-950 rounded text-xs font-bold hover:bg-luxury-goldLight"
                      >
                        추가
                      </button>
                    </div>
                  </div>

                  {/* Middle Notes 관리 */}
                  <div className="bg-forest-900/50 p-5 rounded-2xl border border-forest-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-forest-800 pb-2">
                      <h4 className="font-serif text-sm font-bold text-luxury-gold">Middle Notes</h4>
                      <span className="text-[10px] text-forest-300 font-mono">가장 풍성하게 지속되는 몸체 향</span>
                    </div>

                    {/* 향료 리스트 */}
                    <div className="space-y-3 min-h-[120px]">
                      {finalMiddle.map((item, idx) => (
                        <div key={item.note.id} className="flex flex-col gap-1.5 bg-forest-950/60 p-2.5 rounded-lg border border-forest-800">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">
                              {item.note.nameKo || item.note.nameEn} <span className="text-[9px] font-mono font-normal text-forest-400">({item.note.nameEn})</span>
                            </span>
                            <button 
                              onClick={() => handleRemoveNote('middle', idx)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={item.ratio || 0}
                              onChange={(e) => handleRatioChange('middle', idx, parseInt(e.target.value))}
                              className="flex-grow accent-luxury-gold h-1 bg-forest-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-mono text-luxury-gold w-8 text-right">{item.ratio || 0}%</span>
                          </div>
                        </div>
                      ))}
                      {finalMiddle.length === 0 && (
                        <div className="text-center text-xs text-forest-500 py-10">지정된 미들 노트 향료가 없습니다.</div>
                      )}
                    </div>

                    {/* 향료 추가 셀렉트박스 */}
                    <div className="flex gap-2">
                      <select 
                        value={selectedMiddleToAdd}
                        onChange={(e) => setSelectedMiddleToAdd(e.target.value)}
                        className="flex-grow px-2 py-1.5 bg-forest-950 border border-forest-800 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="">미들 향료 선택...</option>
                        {NOTES.filter(n => n.type === 'middle').map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo || n.nameEn} ({n.nameEn})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAddNote('middle', selectedMiddleToAdd)}
                        className="px-3 py-1.5 bg-luxury-gold text-forest-950 rounded text-xs font-bold hover:bg-luxury-goldLight"
                      >
                        추가
                      </button>
                    </div>
                  </div>

                  {/* Base Notes 관리 */}
                  <div className="bg-forest-900/50 p-5 rounded-2xl border border-forest-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-forest-800 pb-2">
                      <h4 className="font-serif text-sm font-bold text-luxury-gold">Base Notes</h4>
                      <span className="text-[10px] text-forest-300 font-mono">가장 묵직하고 깊은 잔향</span>
                    </div>

                    {/* 향료 리스트 */}
                    <div className="space-y-3 min-h-[120px]">
                      {finalBase.map((item, idx) => (
                        <div key={item.note.id} className="flex flex-col gap-1.5 bg-forest-950/60 p-2.5 rounded-lg border border-forest-800">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">
                              {item.note.nameKo || item.note.nameEn} <span className="text-[9px] font-mono font-normal text-forest-400">({item.note.nameEn})</span>
                            </span>
                            <button 
                              onClick={() => handleRemoveNote('base', idx)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={item.ratio || 0}
                              onChange={(e) => handleRatioChange('base', idx, parseInt(e.target.value))}
                              className="flex-grow accent-luxury-gold h-1 bg-forest-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-mono text-luxury-gold w-8 text-right">{item.ratio || 0}%</span>
                          </div>
                        </div>
                      ))}
                      {finalBase.length === 0 && (
                        <div className="text-center text-xs text-forest-500 py-10">지정된 베이스 노트 향료가 없습니다.</div>
                      )}
                    </div>

                    {/* 향료 추가 셀렉트박스 */}
                    <div className="flex gap-2">
                      <select 
                        value={selectedBaseToAdd}
                        onChange={(e) => setSelectedBaseToAdd(e.target.value)}
                        className="flex-grow px-2 py-1.5 bg-forest-950 border border-forest-800 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="">베이스 향료 선택...</option>
                        {NOTES.filter(n => n.type === 'base').map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo || n.nameEn} ({n.nameEn})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAddNote('base', selectedBaseToAdd)}
                        className="px-3 py-1.5 bg-luxury-gold text-forest-950 rounded text-xs font-bold hover:bg-luxury-goldLight"
                      >
                        추가
                      </button>
                    </div>
                  </div>

                </div>

                {/* 비율 합 실시간 확인 */}
                <div className="flex justify-between items-center bg-forest-900/60 p-4 rounded-xl border border-forest-800">
                  <span className="text-xs font-semibold">전체 향료 비율의 합계 (기준: 100%)</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2.5 bg-forest-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${currentTotalRatio === 100 ? 'bg-green-500' : 'bg-luxury-gold'}`}
                        style={{ width: `${Math.min(100, currentTotalRatio)}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-mono font-bold ${currentTotalRatio === 100 ? 'text-green-400' : 'text-luxury-gold'}`}>
                      {currentTotalRatio}%
                    </span>
                  </div>
                </div>

                {/* 변경 이력 및 조향사 메모 */}
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <h4 className="font-serif text-sm font-semibold text-luxury-gold">조향 변경 이력</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-forest-300 font-bold mb-1">추가한 향료 (콤마로 구분)</label>
                        <input 
                          type="text" 
                          value={addedNotesText}
                          onChange={(e) => setAddedNotesText(e.target.value)}
                          placeholder="예: 스위트 오렌지, 로즈마리"
                          className="w-full px-3 py-2 bg-forest-900 border border-forest-800 rounded-lg text-xs text-white placeholder-forest-600 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-forest-300 font-bold mb-1">제거한 향료 (콤마로 구분)</label>
                        <input 
                          type="text" 
                          value={removedNotesText}
                          onChange={(e) => setRemovedNotesText(e.target.value)}
                          placeholder="예: 마린, 오우드"
                          className="w-full px-3 py-2 bg-forest-900 border border-forest-800 rounded-lg text-xs text-white placeholder-forest-600 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-forest-300 font-bold mb-1">변경한 향료 (콤마로 구분)</label>
                        <input 
                          type="text" 
                          value={modifiedNotesText}
                          onChange={(e) => setModifiedNotesText(e.target.value)}
                          placeholder="예: 라일락 -> 피오니"
                          className="w-full px-3 py-2 bg-forest-900 border border-forest-800 rounded-lg text-xs text-white placeholder-forest-600 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col">
                    <h4 className="font-serif text-sm font-semibold text-luxury-gold">조향사 메모 (조향사의 손길)</h4>
                    <textarea 
                      value={makerMemo}
                      onChange={(e) => setMakerMemo(e.target.value)}
                      placeholder="공방 손님을 위해 향수의 조합 배경이나 조언을 정성껏 기입해주세요."
                      className="w-full flex-grow p-3 bg-forest-900 border border-forest-800 rounded-lg text-xs text-white placeholder-forest-600 focus:outline-none focus:border-luxury-gold min-h-[140px] resize-none"
                    />
                  </div>
                </div>

                <div className="border-t border-forest-800 pt-6 flex justify-end">
                  <button 
                    onClick={handleConfirmFinalRecipe}
                    className="luxury-btn px-8 py-3.5 bg-luxury-gold hover:bg-luxury-goldLight text-forest-950 font-bold rounded-xl text-sm shadow-lg flex items-center gap-2"
                  >
                    <span>조향 완료 및 기록서 생성</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* 하단 네비게이션 */}
            <div className="flex justify-between items-center border-t border-luxury-sand pt-4">
              <button 
                onClick={() => setStep('survey')}
                className="flex items-center gap-1 text-sm font-bold text-forest-600 hover:text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
            </div>
          </div>
        )}

        {/* 5단계: 추억을 기록하다 (훈민향음 기록서 출력) */}
        {step === 'record' && finalRecipe && (
          <div className="max-w-xl w-full flex flex-col items-center space-y-6">
            
            {/* 상단 액션 바 - 인쇄 시 숨김 */}
            <div className="w-full flex justify-between items-center bg-white border border-luxury-gold/20 p-4 rounded-2xl shadow-md print-exclude">
              <button 
                onClick={() => setStep('result')}
                className="flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-950"
              >
                <ChevronLeft className="w-4 h-4" /> 조향사 수정단계로
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 처음으로
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-5 py-2.5 bg-forest-900 text-luxury-cream rounded-xl text-xs font-bold hover:bg-forest-950 shadow active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5 text-luxury-gold" /> 기록서 출력 (Print)
                </button>
              </div>
            </div>

            {/* A6 사이즈 프리미엄 기록서 카드 */}
            <div className="record-card-container">
              <div id="hunmin-record-card" className="record-card print-area">
                
                {/* 상단 엠블럼 및 로고 */}
                <div className="text-center border-b border-luxury-gold/30 pb-2 space-y-0.5">
                  <div className="flex justify-center items-center gap-1.5">
                    <span className="text-[14px] font-bold font-serif tracking-[0.25em] text-forest-900">訓民香音</span>
                    <span className="w-4 h-4 bg-forest-900 text-luxury-cream text-[8px] font-bold flex items-center justify-center rounded">
                      印
                    </span>
                  </div>
                  <p className="text-[7px] tracking-[0.15em] text-luxury-goldDark font-serif font-semibold uppercase">
                    Hunminhyangeum Premium Scent Record
                  </p>
                </div>

                {/* 의뢰인 및 향수 정보 */}
                <div className="grid grid-cols-2 gap-4 text-[9px] pt-1">
                  <div className="space-y-1">
                    <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider">Guest (손님 이름)</span>
                    <span className="font-serif font-bold text-forest-950 text-[11px]">{name}</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider">Scent Name (향수 이름)</span>
                    <span className="font-serif font-bold text-forest-950 text-[11px]">{finalRecipe.perfumeName}</span>
                  </div>
                </div>

                {/* 생성일 및 무드 뱃지 */}
                <div className="flex justify-between items-center text-[8px] bg-luxury-cream/40 px-2 py-1.5 rounded border border-luxury-gold/10">
                  <div className="flex gap-1 items-center">
                    <span className="text-[7px] text-forest-400 font-bold uppercase">Mood:</span>
                    <span className="font-semibold text-forest-800">
                      {analysis?.moodTags.slice(0, 2).map(tag => `#${tag}`).join(' ')} 
                      {selectedStory ? ` #${selectedStory.title.split(' ')[0]}` : ''}
                    </span>
                  </div>
                  <span className="text-forest-400 font-mono text-[7px] font-semibold">{finalRecipe.createdDate}</span>
                </div>

                {/* 향 스토리 문구 */}
                <div className="py-1">
                  <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider mb-0.5">Scent Narrative (향의 이야기)</span>
                  <p className="text-[8px] leading-relaxed text-forest-700 italic font-serif text-justify">
                    "{finalRecipe.originalRecipe.concept}"
                  </p>
                </div>

                {/* 최종 노트 구성 리스트 */}
                <div className="space-y-1.5 border-t border-b border-luxury-gold/20 py-2">
                  
                  {/* Top Notes */}
                  <div className="grid grid-cols-4 gap-1 items-baseline">
                    <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Top Note</span>
                    <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                      {finalRecipe.top.map(item => (
                        <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                          {item.note.nameKo || item.note.nameEn} <span className="font-mono text-[7px] text-luxury-goldDark">({item.ratio}%)</span>
                        </span>
                      ))}
                      {finalRecipe.top.length === 0 && <span className="text-[8px] text-forest-300">-</span>}
                    </div>
                  </div>

                  {/* Middle Notes */}
                  <div className="grid grid-cols-4 gap-1 items-baseline">
                    <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Middle Note</span>
                    <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                      {finalRecipe.middle.map(item => (
                        <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                          {item.note.nameKo || item.note.nameEn} <span className="font-mono text-[7px] text-luxury-goldDark">({item.ratio}%)</span>
                        </span>
                      ))}
                      {finalRecipe.middle.length === 0 && <span className="text-[8px] text-forest-300">-</span>}
                    </div>
                  </div>

                  {/* Base Notes */}
                  <div className="grid grid-cols-4 gap-1 items-baseline">
                    <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Base Note</span>
                    <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                      {finalRecipe.base.map(item => (
                        <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                          {item.note.nameKo || item.note.nameEn} <span className="font-mono text-[7px] text-luxury-goldDark">({item.ratio}%)</span>
                        </span>
                      ))}
                      {finalRecipe.base.length === 0 && <span className="text-[8px] text-forest-300">-</span>}
                    </div>
                  </div>

                </div>

                {/* 조향사의 손길 (메모 및 추가/수정 내역) */}
                <div className="space-y-1.5 py-1">
                  
                  {/* 조향 이력 노출 (추가/수정 등이 존재할 시) */}
                  {(finalRecipe.addedNotes.length > 0 || finalRecipe.removedNotes.length > 0 || finalRecipe.modifiedNotes.length > 0) && (
                    <div className="text-[7px] text-forest-500 flex flex-wrap gap-x-2 gap-y-0.5 font-semibold bg-luxury-sand/30 p-1.5 rounded border border-luxury-gold/5">
                      {finalRecipe.addedNotes.length > 0 && <span>[추가] {finalRecipe.addedNotes.join(', ')}</span>}
                      {finalRecipe.removedNotes.length > 0 && <span>[제거] {finalRecipe.removedNotes.join(', ')}</span>}
                      {finalRecipe.modifiedNotes.length > 0 && <span>[수정] {finalRecipe.modifiedNotes.join(', ')}</span>}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider">Perfumer's Touch (조향사의 손길)</span>
                    <p className="text-[8px] leading-normal text-forest-700 text-justify">
                      {finalRecipe.makerMemo || "이름과 세종의 은은한 향이 결합되어 완성되었습니다. 소중하게 조향한 단 하나의 향이 당신의 일상에 잔잔한 기쁨으로 기억되기를 바랍니다."}
                    </p>
                  </div>
                </div>

                {/* 훈민향음 낙인 서명 푸터 */}
                <div className="flex justify-between items-end border-t border-luxury-gold/20 pt-2 text-[6px] text-forest-400">
                  <span className="tracking-[0.1em]">© 訓民香音 2026. ALL RIGHTS RESERVED.</span>
                  <div className="flex items-center gap-1">
                    <span className="font-serif">조향사 :</span>
                    <span className="w-5 h-5 border border-forest-300 rounded-full flex items-center justify-center text-[7px] font-bold text-forest-600 font-serif">
                      훈민
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 안내 멘트 - 인쇄 시 숨김 */}
            <p className="text-center text-xs text-forest-500 print-exclude">
              A6(105mm x 148mm) 규격의 포스트카드 형태로 인쇄하도록 맞춤 최적화되어 있습니다.<br />
              '출력하기' 버튼을 누르면 기록서 부분만 한 장에 깔끔하게 인쇄 가능합니다.
            </p>

          </div>
        )}

      </main>

      {/* Footer - 인쇄 시 미출력 */}
      <div className="print-exclude">
        <footer className="border-t border-luxury-gold/10 bg-forest-950 text-forest-300 py-6 text-center text-xs">
          <div className="max-w-6xl mx-auto px-4 space-y-2">
            <p className="font-serif tracking-widest text-[10px] text-luxury-gold/70">
              © 2026 훈민향음 (訓民香音). ALL RIGHTS RESERVED.
            </p>
            <p className="text-[9px] text-forest-500">
              이 웹앱은 조향 공방 내 조향사와 방문객 간의 원활한 커뮤니케이션과 레시피 설계를 돕는 디지털 조향 보조 플랫폼입니다.
            </p>
          </div>
        </footer>
      </div>

    </div>
  );
}
