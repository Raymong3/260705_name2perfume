import React from 'react';
import { Heart } from 'lucide-react';
import { FAVORITE_SCENT_OPTIONS } from '../../data/favoriteScents';

interface Step1NoteSelectProps {
  selectedFavScentId: string | null;
  onSelectScent: (id: string) => void;
}

export const Step1NoteSelect: React.FC<Step1NoteSelectProps> = ({
  selectedFavScentId,
  onSelectScent
}) => {
  const selectedScent = FAVORITE_SCENT_OPTIONS.find(s => s.id === selectedFavScentId);

  return (
    <div className="space-y-2 pt-1">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-forest-200 flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-luxury-gold" />
          <span>마음에 드는 향 1가지 선택 (12종 중 택 1)</span>
        </label>
        <span className="text-[10px] text-luxury-gold font-semibold">
          {selectedScent ? `${selectedScent.nameKo} 선택됨` : '필수 선택'}
        </span>
      </div>
      <p className="text-[10.5px] text-forest-300/80 font-medium pl-0.5">
        ※ 아래 선택사항은 향료 추천에 영향을 끼치지 않습니다.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {FAVORITE_SCENT_OPTIONS.map((option) => {
          const isSelected = selectedFavScentId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectScent(option.id)}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-forest-800 border-luxury-gold ring-2 ring-luxury-gold/40 shadow-lg text-white' 
                  : 'bg-forest-950/80 border-forest-800 text-forest-300 hover:border-forest-700 hover:bg-forest-900/60'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold text-luxury-gold font-mono uppercase">{option.tag}</span>
                {isSelected && <span className="text-[10px] text-luxury-gold font-bold">✓</span>}
              </div>
              <div className="font-serif text-xs font-bold text-white leading-tight">{option.nameKo}</div>
              <div className="text-[9px] text-forest-400 font-mono tracking-tight mt-0.5 truncate">{option.nameEn}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
