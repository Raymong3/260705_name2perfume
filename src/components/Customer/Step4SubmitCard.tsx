import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { FinalRecipe } from '../../types/perfume';

interface Step4SubmitCardProps {
  finalRecipe: FinalRecipe;
  onNewSession: () => void;
}

export const Step4SubmitCard: React.FC<Step4SubmitCardProps> = ({
  finalRecipe,
  onNewSession
}) => {
  return (
    <div className="max-w-2xl w-full bg-forest-900/90 border border-forest-750 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 animate-slide-up print-exclude my-auto backdrop-blur-lg">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-forest-950 rounded-full border border-luxury-gold/40 flex items-center justify-center mx-auto text-luxury-gold shadow-lg">
          <Sparkles className="w-7 h-7" />
        </div>
        <span className="text-[11px] font-bold text-luxury-gold uppercase tracking-widest bg-forest-950 px-3 py-1 rounded-full border border-forest-800 inline-block">
          조향 의뢰 접수 완료
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
          {finalRecipe.guestName}님의 조향 의뢰가 정상 접수되었습니다
        </h2>
        <p className="text-xs text-forest-300 font-medium">
          Re:세종 조향사가 접수된 포뮬러를 바탕으로 나만의 시그니처 향수를 정성껏 제작합니다.
        </p>
      </div>

      <div className="bg-forest-950/80 p-5 rounded-2xl border border-forest-800 space-y-3 text-left">
        <div className="flex justify-between items-center pb-2 border-b border-forest-850">
          <span className="text-xs text-forest-400 font-serif">의뢰 일시 / 식별 ID</span>
          <span className="text-xs text-luxury-gold font-mono font-bold">{finalRecipe.createdDate || finalRecipe.loginId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-forest-400 font-serif">향수 이름</span>
          <span className="text-sm text-white font-serif font-bold">{finalRecipe.perfumeName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-forest-400 font-serif">선택 테마</span>
          <span className="text-xs text-forest-200 font-medium">
            {finalRecipe.selectedType === 'combined' || finalRecipe.selectedType === 'name_sejong' ? 'Re:세종 시그니처 융합 테마' : '이름 분석 전용 테마'}
          </span>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onNewSession}
          className="w-full py-4 bg-forest-800 hover:bg-forest-700 text-luxury-cream border border-forest-650 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-luxury-gold" />
          <span>다른 이름으로 조향하기</span>
        </button>
      </div>
    </div>
  );
};
