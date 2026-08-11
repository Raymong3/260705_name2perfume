import React from 'react';
import { History, Sparkles } from 'lucide-react';

interface HeaderProps {
  onGoHome?: () => void;
  onOpenPastRecords?: () => void;
  showPastRecords?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, onOpenPastRecords, showPastRecords }) => {
  return (
    <header 
      className="border-b border-luxury-gold/15 px-6 sticky top-0 z-40 shadow-2xl flex items-center h-[90px] animate-fade-in w-full print:hidden backdrop-blur-xl"
      style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(13, 40, 32, 0.95) 0%, rgba(6, 16, 12, 0.98) 100%)',
      }}
    >
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center h-full">
        {/* Left Side: Brand Symbol & Text (Clickable -> Home) */}
        <div 
          onClick={onGoHome}
          className="flex items-center gap-4 select-none cursor-pointer group"
          title="첫페이지로 이동"
        >
          {/* 낙관형 더알 Symbol */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-luxury-gold/60 bg-forest-950/90 shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:border-luxury-gold group-hover:shadow-luxury-gold/30">
            <div className="flex flex-col items-center justify-center leading-[1.1] font-serif font-bold text-luxury-gold text-[12px] tracking-widest pl-[1px]">
              <span>더</span>
              <span>알</span>
            </div>
          </div>

          {/* Typography Text Stack */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl md:text-2xl font-bold tracking-[0.15em] text-white group-hover:text-luxury-gold transition-colors">
                Re:세종
              </span>
            </div>
            
            {/* 강조된 핵심 브랜드 슬로건 */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse"></span>
              <span className="text-xs md:text-[13px] tracking-[0.18em] text-luxury-cream font-serif font-medium leading-none drop-shadow">
                Re:세종 · 세종이라는 도시를 향기로 다시 떠올리는 경험
              </span>
            </div>
          </div>
        </div>

        {/* Center Tagline for Desktop */}
        <div className="hidden lg:flex items-center gap-2 text-forest-300/80 font-serif text-xs italic tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-luxury-gold/70" />
          <span>Korean Signature Scent Atelier</span>
        </div>

        {/* Right Side: Conditional Navigation Buttons */}
        <div className="flex items-center gap-3">
          {showPastRecords && onOpenPastRecords && (
            <button
              onClick={onOpenPastRecords}
              className="flex items-center gap-2 px-4 py-2 bg-forest-900/90 hover:bg-forest-850 text-luxury-gold border border-luxury-gold/50 rounded-full text-xs font-serif font-bold transition-all shadow-lg hover:shadow-luxury-gold/20 cursor-pointer active:scale-95 hover:border-luxury-gold"
            >
              <History className="w-4 h-4 text-luxury-gold" />
              <span>조향기록서 보관함</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
