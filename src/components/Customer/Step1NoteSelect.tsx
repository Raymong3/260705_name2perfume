import React from 'react';
import { Heart, Check } from 'lucide-react';
import { FAVORITE_SCENT_OPTIONS } from '../../data/favoriteScents';

interface Step1NoteSelectProps {
  selectedFavScentId: string | null;
  onSelectScent: (id: string) => void;
  customTitle?: string;
}

export const Step1NoteSelect: React.FC<Step1NoteSelectProps> = ({
  selectedFavScentId,
  onSelectScent,
  customTitle
}) => {
  const selectedScent = FAVORITE_SCENT_OPTIONS.find(s => s.id === selectedFavScentId);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-xs font-bold text-luxury-cream flex items-center gap-1.5 font-serif">
          <Heart className="w-3.5 h-3.5 text-luxury-gold fill-luxury-gold/20" />
          <span>{customTitle || '마음에 드는 향 1가지 선택 (12종 중 택 1)'}</span>
        </label>
        <span className="text-[11px] text-luxury-gold font-mono font-semibold">
          {selectedScent ? `[ ${selectedScent.nameKo} ]` : '필수 선택'}
        </span>
      </div>
      <p className="text-[11px] text-forest-300/80 font-medium pl-0.5">
        ※ 선호하시는 대표 향기를 선택해 주시면 조향 아뜰리에가 취향을 섬세하게 고려합니다.
      </p>

      {/* 카드 그리드: 테두리를 최소화하고 배경 명암과 호버/선택 인터랙션 강조 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {FAVORITE_SCENT_OPTIONS.map((option) => {
          const isSelected = selectedFavScentId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectScent(option.id)}
              className={`p-3 rounded-2xl text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                isSelected 
                  ? 'bg-forest-800 text-white shadow-xl ring-2 ring-luxury-gold scale-[1.03] -translate-y-0.5' 
                  : 'bg-forest-950/70 text-forest-200 hover:bg-forest-900 hover:text-white hover:scale-[1.01] hover:shadow-lg focus:ring-1 focus:ring-luxury-gold/50'
              }`}
            >
              {/* 선택 시 은은한 골드 인광 배경 효과 */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/15 to-transparent pointer-events-none"></div>
              )}

              <div className="flex justify-between items-center mb-1 relative z-10">
                <span className={`text-[9.5px] font-bold font-mono tracking-wider uppercase ${
                  isSelected ? 'text-luxury-gold' : 'text-forest-400 group-hover:text-luxury-gold/80'
                }`}>
                  {option.tag}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-luxury-gold text-forest-950 flex items-center justify-center text-[9px] font-bold shadow-md animate-scale-in">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="font-serif text-xs font-bold leading-tight relative z-10">
                {option.nameKo}
              </div>
              
              <div className="text-[9px] text-forest-400 font-mono tracking-tight mt-0.5 truncate relative z-10 group-hover:text-forest-300">
                {option.nameEn}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
