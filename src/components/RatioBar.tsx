import React from 'react';
import { RecommendedNote } from '../types/perfume';

interface RatioBarProps {
  top: RecommendedNote[];
  middle: RecommendedNote[];
  base: RecommendedNote[];
}

export const RatioBar: React.FC<RatioBarProps> = ({ top, middle, base }) => {
  const topTotal = top.reduce((sum, item) => sum + item.ratio, 0);
  const middleTotal = middle.reduce((sum, item) => sum + item.ratio, 0);
  const baseTotal = base.reduce((sum, item) => sum + item.ratio, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-forest-700 uppercase">
        <span>Fragrance Balance</span>
        <span>Total 100%</span>
      </div>
      
      {/* Segmented Bar */}
      <div className="h-6 w-full rounded-full overflow-hidden flex bg-luxury-sand shadow-inner border border-luxury-gold/20">
        {topTotal > 0 && (
          <div 
            style={{ width: `${topTotal}%` }} 
            className="bg-forest-300 transition-all duration-700 ease-out hover:opacity-90 flex items-center justify-center text-[10px] font-bold text-forest-900"
            title={`Top Notes: ${topTotal}%`}
          >
            {topTotal >= 10 && `${topTotal}%`}
          </div>
        )}
        {middleTotal > 0 && (
          <div 
            style={{ width: `${middleTotal}%` }} 
            className="bg-forest-500 transition-all duration-700 ease-out hover:opacity-90 flex items-center justify-center text-[10px] font-bold text-luxury-cream"
            title={`Middle Notes: ${middleTotal}%`}
          >
            {middleTotal >= 10 && `${middleTotal}%`}
          </div>
        )}
        {baseTotal > 0 && (
          <div 
            style={{ width: `${baseTotal}%` }} 
            className="bg-forest-800 transition-all duration-700 ease-out hover:opacity-90 flex items-center justify-center text-[10px] font-bold text-luxury-cream"
            title={`Base Notes: ${baseTotal}%`}
          >
            {baseTotal >= 10 && `${baseTotal}%`}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-forest-300 inline-block border border-forest-400"></span>
          <span className="font-medium text-forest-700">Top ({topTotal}%)</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-forest-500 inline-block border border-forest-600"></span>
          <span className="font-medium text-forest-700">Middle ({middleTotal}%)</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-forest-800 inline-block border border-forest-900"></span>
          <span className="font-medium text-forest-700">Base ({baseTotal}%)</span>
        </div>
      </div>
    </div>
  );
};
