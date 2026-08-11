import React, { useState } from 'react';
import { Sparkles, Sliders, ArrowRight } from 'lucide-react';
import { PerfumeRecipe, RecommendedNote, SejongStory, PerfumeNote } from '../../types/perfume';
import { SORTED_TOP_NOTES, SORTED_MIDDLE_NOTES, SORTED_BASE_NOTES } from '../../data/notes';

interface Step3CustomizerProps {
  recommended1: PerfumeRecipe | null;
  recommended2: PerfumeRecipe | null;
  selectedRecipeType: 'name_only' | 'name_sejong' | 'combined';
  selectedStory: SejongStory | null;
  onSelectRecipeType?: (type: 'name_only' | 'name_sejong' | 'combined') => void;
  onSubmit: (
    recipeType: 'name_only' | 'name_sejong' | 'combined',
    customNotes: { top: RecommendedNote[]; middle: RecommendedNote[]; base: RecommendedNote[] },
    addedNotes: string[],
    removedNotes: string[],
    perfumeName: string,
    makerMemo: string
  ) => void;
  isSubmitting: boolean;
}

export const Step3Customizer: React.FC<Step3CustomizerProps> = ({
  recommended1,
  selectedStory,
  onSubmit,
  isSubmitting
}) => {
  const activeRecipe = recommended1;

  const [guestTop, setGuestTop] = useState<RecommendedNote[]>(activeRecipe?.top || []);
  const [guestMiddle, setGuestMiddle] = useState<RecommendedNote[]>(activeRecipe?.middle || []);
  const [guestBase, setGuestBase] = useState<RecommendedNote[]>(activeRecipe?.base || []);

  const [selectedTopToAdd, setSelectedTopToAdd] = useState('');
  const [selectedMiddleToAdd, setSelectedMiddleToAdd] = useState('');
  const [selectedBaseToAdd, setSelectedBaseToAdd] = useState('');

  const [perfumeName, setPerfumeName] = useState(activeRecipe?.name || '');
  const [makerMemo, setMakerMemo] = useState('');

  const handleAddNote = (category: 'top' | 'middle' | 'base', noteId: string) => {
    if (!noteId) return;
    const pool = category === 'top' ? SORTED_TOP_NOTES : category === 'middle' ? SORTED_MIDDLE_NOTES : SORTED_BASE_NOTES;
    const noteObj = pool.find((n: PerfumeNote) => n.id === noteId);
    if (!noteObj) return;

    const newItem: RecommendedNote = { note: noteObj, ratio: 20, reason: '사용자 선택 추가' };

    if (category === 'top') {
      if (guestTop.some(item => item.note.id === noteId)) return;
      setGuestTop(prev => [...prev, newItem]);
      setSelectedTopToAdd('');
    } else if (category === 'middle') {
      if (guestMiddle.some(item => item.note.id === noteId)) return;
      setGuestMiddle(prev => [...prev, newItem]);
      setSelectedMiddleToAdd('');
    } else {
      if (guestBase.some(item => item.note.id === noteId)) return;
      setGuestBase(prev => [...prev, newItem]);
      setSelectedBaseToAdd('');
    }
  };

  const handleRemoveNote = (category: 'top' | 'middle' | 'base', idx: number) => {
    if (category === 'top') {
      setGuestTop(prev => prev.filter((_, i) => i !== idx));
    } else if (category === 'middle') {
      setGuestMiddle(prev => prev.filter((_, i) => i !== idx));
    } else {
      setGuestBase(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleFormSubmit = () => {
    if (!activeRecipe) return;

    const origTopNames = new Set((activeRecipe.top || []).map(item => item.note.nameKo || item.note.nameEn));
    const origMidNames = new Set((activeRecipe.middle || []).map(item => item.note.nameKo || item.note.nameEn));
    const origBaseNames = new Set((activeRecipe.base || []).map(item => item.note.nameKo || item.note.nameEn));
    const origAll = new Set([...origTopNames, ...origMidNames, ...origBaseNames]);

    const currTopNames = new Set(guestTop.map(item => item.note.nameKo || item.note.nameEn));
    const currMidNames = new Set(guestMiddle.map(item => item.note.nameKo || item.note.nameEn));
    const currBaseNames = new Set(guestBase.map(item => item.note.nameKo || item.note.nameEn));
    const currAll = new Set([...currTopNames, ...currMidNames, ...currBaseNames]);

    const added: string[] = [];
    currAll.forEach(name => { if (!origAll.has(name)) added.push(name); });

    const removed: string[] = [];
    origAll.forEach(name => { if (!currAll.has(name)) removed.push(name); });

    onSubmit(
      'combined',
      { top: guestTop, middle: guestMiddle, base: guestBase },
      added,
      removed,
      perfumeName,
      makerMemo
    );
  };

  return (
    <div className="max-w-4xl w-full space-y-8 animate-slide-up print-exclude text-left">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold tracking-widest text-luxury-gold uppercase bg-forest-900/80 px-3.5 py-1.5 rounded-full border border-forest-750 inline-block font-mono">
          3단계: 향을 잇다
        </span>
        <h2 className="font-serif text-3xl font-bold text-white">나만의 시그니처 향</h2>
        <p className="text-xs text-forest-200">
          선택하신 세종의 장소 서사와 당신의 이름 분석 결과를 조합하여 탄생한 단 하나의 포뮬러입니다.
        </p>
      </div>

      {/* 시그니처 단일 추천 카드 */}
      {activeRecipe && (
        <div className="bg-forest-900/80 border border-luxury-gold/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] px-3 py-1 rounded-full bg-forest-950 border border-luxury-gold/30 text-luxury-gold font-bold uppercase tracking-wider font-mono">
                Re:Sejong Signature Scent
              </span>
              <Sparkles className="w-5 h-5 text-luxury-gold animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-2xl font-bold text-white">이름과 세종이 만난 향</h3>
              <p className="text-[11px] text-forest-400 italic">이름 분석과 세종시 명소 중 '{selectedStory?.title}'의 공간 감성 결합</p>
            </div>

            <p className="text-sm leading-relaxed text-luxury-cream pl-3 border-l-2 border-luxury-gold font-medium italic">
              "{activeRecipe.concept}"
            </p>

            <div className="space-y-4 pt-2">
              <div className="bg-forest-950/70 p-4 rounded-2xl border border-forest-800 space-y-2">
                <div className="text-[11px] text-luxury-gold font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-luxury-gold" /> 조향 스토리 & 선정 이유
                </div>
                <p className="text-xs text-forest-200 leading-relaxed font-sans text-justify">
                  {activeRecipe.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold text-white pt-1">
                <div className="bg-forest-950/90 p-3 rounded-xl border border-forest-800">
                  <div className="text-[10px] text-luxury-gold uppercase font-mono mb-1.5 font-bold tracking-wider">Top Note</div>
                  <div className="text-forest-200">{activeRecipe.top.map(item => item.note.nameKo || item.note.nameEn).join(', ')}</div>
                </div>
                <div className="bg-forest-950/90 p-3 rounded-xl border border-forest-800">
                  <div className="text-[10px] text-luxury-gold uppercase font-mono mb-1.5 font-bold tracking-wider">Middle Note</div>
                  <div className="text-forest-200">{activeRecipe.middle.map(item => item.note.nameKo || item.note.nameEn).join(', ')}</div>
                </div>
                <div className="bg-forest-950/90 p-3 rounded-xl border border-forest-800">
                  <div className="text-[10px] text-luxury-gold uppercase font-mono mb-1.5 font-bold tracking-wider">Base Note</div>
                  <div className="text-forest-200">{activeRecipe.base.map(item => item.note.nameKo || item.note.nameEn).join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 커스텀 조향 편집기 */}
      <div className="bg-forest-900/95 border border-forest-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-lg">
        <div className="flex items-center gap-2 pb-3 border-b border-forest-800 text-white">
          <Sliders className="w-5 h-5 text-luxury-gold" />
          <h3 className="font-serif text-lg font-bold">나만의 향료 커스텀 조향</h3>
          <span className="text-[10px] text-forest-400 font-sans ml-2">(추천 포뮬러 향료를 자유롭게 조정할 수 있습니다)</span>
        </div>

        <div className="bg-forest-950/60 p-4 rounded-xl border border-forest-800 space-y-2">
          <label className="block text-xs font-bold text-luxury-gold font-serif">
            향수 이름 (Perfume Name)
          </label>
          <input
            type="text"
            value={perfumeName}
            onChange={(e) => setPerfumeName(e.target.value)}
            placeholder="나만의 향수 이름을 입력해 주세요"
            className="w-full px-4 py-2.5 bg-forest-950 border border-forest-850 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-luxury-gold"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Top Note */}
          <div className="bg-forest-950/40 p-4 rounded-xl border border-forest-800 space-y-3">
            <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Top Notes</h4>
            <div className="space-y-2 min-h-[90px]">
              {guestTop.map((item, idx) => (
                <div key={item.note.id} className="bg-forest-950/80 p-2.5 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                  <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                  <button onClick={() => handleRemoveNote('top', idx)} className="text-red-400 hover:text-red-300 font-bold px-1 text-sm cursor-pointer">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 pt-1.5">
              <select 
                value={selectedTopToAdd} onChange={(e) => setSelectedTopToAdd(e.target.value)}
                className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
              >
                <option value="">탑 향료 추가...</option>
                {SORTED_TOP_NOTES.map((n: PerfumeNote) => (
                  <option key={n.id} value={n.id}>{n.nameKo}</option>
                ))}
              </select>
              <button onClick={() => handleAddNote('top', selectedTopToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold cursor-pointer">추가</button>
            </div>
          </div>

          {/* Middle Note */}
          <div className="bg-forest-950/40 p-4 rounded-xl border border-forest-800 space-y-3">
            <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Middle Notes</h4>
            <div className="space-y-2 min-h-[90px]">
              {guestMiddle.map((item, idx) => (
                <div key={item.note.id} className="bg-forest-950/80 p-2.5 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                  <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                  <button onClick={() => handleRemoveNote('middle', idx)} className="text-red-400 hover:text-red-300 font-bold px-1 text-sm cursor-pointer">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 pt-1.5">
              <select 
                value={selectedMiddleToAdd} onChange={(e) => setSelectedMiddleToAdd(e.target.value)}
                className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
              >
                <option value="">미들 향료 추가...</option>
                {SORTED_MIDDLE_NOTES.map((n: PerfumeNote) => (
                  <option key={n.id} value={n.id}>{n.nameKo}</option>
                ))}
              </select>
              <button onClick={() => handleAddNote('middle', selectedMiddleToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold cursor-pointer">추가</button>
            </div>
          </div>

          {/* Base Note */}
          <div className="bg-forest-950/40 p-4 rounded-xl border border-forest-800 space-y-3">
            <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Base Notes</h4>
            <div className="space-y-2 min-h-[90px]">
              {guestBase.map((item, idx) => (
                <div key={item.note.id} className="bg-forest-950/80 p-2.5 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                  <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                  <button onClick={() => handleRemoveNote('base', idx)} className="text-red-400 hover:text-red-300 font-bold px-1 text-sm cursor-pointer">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 pt-1.5">
              <select 
                value={selectedBaseToAdd} onChange={(e) => setSelectedBaseToAdd(e.target.value)}
                className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
              >
                <option value="">베이스 향료 추가...</option>
                {SORTED_BASE_NOTES.map((n: PerfumeNote) => (
                  <option key={n.id} value={n.id}>{n.nameKo}</option>
                ))}
              </select>
              <button onClick={() => handleAddNote('base', selectedBaseToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold cursor-pointer">추가</button>
            </div>
          </div>

        </div>

        <div className="bg-forest-950/60 p-4 rounded-xl border border-forest-800 space-y-2">
          <label className="block text-xs font-bold text-forest-300 font-serif">메모 (선택사항)</label>
          <textarea
            value={makerMemo}
            onChange={(e) => setMakerMemo(e.target.value)}
            placeholder="특별히 요청할 조향 메모가 있다면 작성해주세요."
            rows={2}
            className="w-full px-4 py-2 bg-forest-950 border border-forest-800 rounded-xl text-xs text-white focus:outline-none focus:border-luxury-gold"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-luxury-gold hover:bg-luxury-cream text-forest-950 font-serif font-bold text-base rounded-2xl transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-forest-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>최종 포뮬러로 조향 신청 완료하기</span>
                <ArrowRight className="w-5 h-5 text-forest-950" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
