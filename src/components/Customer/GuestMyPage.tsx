import React from 'react';
import { Sparkles, Printer } from 'lucide-react';
import { FinalRecipe } from '../../types/perfume';
import { formatLoginIdDisplay } from '../../utils/formatters';

interface GuestMyPageProps {
  loginId: string;
  guestRecords: FinalRecipe[];
  isRecordsLoading: boolean;
  onStartNewJourney: () => void;
  onViewRecord: (recipe: FinalRecipe) => void;
}

export const GuestMyPage: React.FC<GuestMyPageProps> = ({
  loginId,
  guestRecords,
  isRecordsLoading,
  onStartNewJourney,
  onViewRecord,
}) => {
  return (
    <div className="max-w-2xl w-full space-y-6 animate-slide-up print-exclude mx-auto">
      <div className="bg-forest-900/90 border border-forest-750 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-lg">
        
        <div className="text-center space-y-1.5 border-b border-forest-800 pb-4">
          <span className="text-[10px] tracking-widest text-luxury-gold font-serif uppercase font-bold">Fragrance Archive</span>
          <h2 className="font-serif text-2xl font-bold text-white">조향기록서 보관함</h2>
          <p className="text-xs text-forest-300 font-medium">
            본인 로그인 계정 <span className="font-bold text-luxury-gold">{formatLoginIdDisplay(loginId)}</span>으로 생성된 향 조향 내역입니다.
          </p>
        </div>

        {/* 과거 조향 기록 목록 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-luxury-gold uppercase tracking-wider">나의 조향기록서 목록</h3>
          
          {isRecordsLoading ? (
            <div className="text-center py-8 text-xs text-forest-400">상담 이력을 불러오는 중입니다...</div>
          ) : guestRecords.length === 0 ? (
            <div className="text-center py-10 bg-forest-950/60 rounded-xl border border-dashed border-forest-800 text-xs text-forest-400">
              아직 생성된 향수 기록이 없습니다. 새로운 조향을 시작해 보세요.
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {guestRecords.map(rec => {
                const recordStatus = rec.status || (rec.makerMemo ? 'completed' : 'submitted');
                return (
                  <div key={rec.id} className="flex justify-between items-center p-3.5 bg-forest-950/80 border border-forest-800 rounded-xl hover:border-forest-650 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{rec.guestName}</span>
                        <span className="text-[10px] text-luxury-gold font-serif">(향수명: {rec.perfumeName})</span>
                      </div>
                      <div className="flex gap-2 text-[9px] text-forest-400 font-mono">
                        <span>{rec.createdDate}</span>
                        <span>|</span>
                        <span>{rec.selectedType === 'name_only' ? '이름 분석' : '세종의 이야기'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={recordStatus === 'completed' ? 'text-emerald-400 font-bold text-[10px]' : 'text-amber-400 font-semibold text-[10px]'}>
                        {recordStatus === 'completed' ? '조향 제작 완료' : '조향 접수 완료'}
                      </span>
                      
                      <button
                        onClick={() => onViewRecord(rec)}
                        className="px-3 py-1.5 bg-forest-800 text-luxury-cream text-[10px] font-bold rounded-lg hover:bg-forest-700 transition-colors flex items-center gap-1 border border-forest-650 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-luxury-gold" /> 기록서 보기
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 다시 새로운 향수 만들기 시작 버튼 */}
        <div className="pt-2 border-t border-luxury-sand flex gap-2">
          <button
            onClick={onStartNewJourney}
            className="w-full luxury-btn flex items-center justify-center gap-2 py-3 bg-forest-800 text-luxury-cream font-bold rounded-xl hover:bg-forest-900 shadow-md active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
            <span>새 향수 만들기</span>
          </button>
        </div>

      </div>
    </div>
  );
};
