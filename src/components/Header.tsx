import React from 'react';
import { History, Home } from 'lucide-react';

interface HeaderProps {
  onGoHome?: () => void;
  onOpenPastRecords?: () => void;
  showPastRecords?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, onOpenPastRecords, showPastRecords }) => {
  return (
    <header 
      className="border-b border-[#C9A46C]/10 px-6 sticky top-0 z-40 shadow-lg flex items-center h-[85px] animate-fade-in w-full print:hidden"
      style={{
        background: 'radial-gradient(circle at 20% 50%, #0d2820 0%, #081A15 100%)',
      }}
    >
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center h-full">
        {/* Left Side: Brand Symbol & Text (Clickable -> Home) */}
        <div 
          onClick={onGoHome}
          className="flex items-center gap-3.5 select-none cursor-pointer group"
          title="첫페이지로 이동"
        >
          {/* 낙관형 더알 Symbol */}
          <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#C9A46C] bg-[#081A15]/80 backdrop-blur-sm shadow-md transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[#C9A46C]/40">
            <div className="flex flex-col items-center justify-center leading-[1.1] font-serif font-bold text-[#C9A46C] text-[11px] tracking-widest pl-[1px]">
              <span>더</span>
              <span>알</span>
            </div>
          </div>

          {/* Typography Text Stack */}
          <div className="flex flex-col justify-center leading-none">
            <span className="font-serif text-lg md:text-xl font-bold tracking-[0.12em] text-[#F8F6F1] group-hover:text-luxury-gold transition-colors">
              훈민향음
            </span>
            <span className="text-[10px] md:text-[11px] tracking-[0.15em] text-[#F8F6F1]/70 font-serif font-light mt-1">
              訓民香音 · 이름을 향기로 읽다
            </span>
          </div>
        </div>

        {/* Center: Empty Space for layout elegance */}
        <div className="hidden md:block flex-grow"></div>

        {/* Right Side: Conditional Navigation Buttons */}
        <div className="flex items-center gap-2">
          {showPastRecords && onOpenPastRecords && (
            <button
              onClick={onOpenPastRecords}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-900/90 hover:bg-forest-800 text-luxury-gold border border-luxury-gold/40 rounded-full text-xs font-serif font-bold transition-all shadow-md hover:shadow-luxury-gold/20 cursor-pointer active:scale-95"
            >
              <History className="w-3.5 h-3.5 text-luxury-gold" />
              <span>과거 조향기록 보기</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
