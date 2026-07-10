import React from 'react';
import { RecommendedNote } from '../types/perfume';

interface NoteSectionProps {
  title: string;
  items: RecommendedNote[];
  badgeColor: string;
  borderColor: string;
  nameMap: Record<string, string>;
}

export const NoteSection: React.FC<NoteSectionProps> = ({ 
  title, 
  items, 
  badgeColor, 
  borderColor,
  nameMap 
}) => {
  return (
    <div className={`p-5 rounded-xl bg-luxury-cream border ${borderColor} space-y-4 shadow-sm transition-all duration-300 hover:shadow-md`}>
      <h3 className="text-sm font-bold tracking-wider text-forest-900 uppercase border-b border-luxury-gold/20 pb-2">
        {title} <span className="text-xs font-normal text-forest-500">({items.length})</span>
      </h3>
      
      <div className="space-y-4">
        {items.map((item) => {
          const note = item.note;
          const customName = nameMap[note.id];
          const hasCustomName = !!customName;

          // Default display: Korean name (English name)
          const defaultDisplayName = note.nameKo ? `${note.nameKo} (${note.nameEn})` : note.nameEn;

          return (
            <div key={note.id} className="flex flex-col gap-1.5 border-b border-forest-100/50 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${badgeColor}`}></span>
                  <span className="font-semibold text-forest-900 text-sm">
                    {hasCustomName ? customName : defaultDisplayName}
                  </span>
                  {hasCustomName && (
                    <span className="text-[9px] text-forest-400 font-mono">
                      ({note.nameEn})
                    </span>
                  )}
                </div>
              </div>

              {/* Matching Reason */}
              {item.reason && (
                <div className="text-[10px] text-forest-500 pl-4 italic">
                  {item.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
