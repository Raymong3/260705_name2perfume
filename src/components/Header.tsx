import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
  step: 'input' | 'result';
  isEditingNames: boolean;
  setIsEditingNames: (value: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  step,
  isEditingNames,
  setIsEditingNames,
}) => {
  return (
    <header 
      className="border-b border-[#C9A46C]/10 px-6 sticky top-0 z-40 shadow-lg flex items-center h-[85px] animate-fade-in w-full"
      style={{
        background: 'radial-gradient(circle at 20% 50%, #0d2820 0%, #081A15 100%)',
      }}
    >
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center h-full">
        {/* Left Side: Brand Symbol & Text */}
        <div className="flex items-center gap-3.5 select-none">
          {/* 낙관형 더알 Symbol */}
          <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#C9A46C] bg-[#081A15]/80 backdrop-blur-sm shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[#C9A46C]/20 cursor-default group">
            <div className="flex flex-col items-center justify-center leading-[1.1] font-serif font-bold text-[#C9A46C] text-[11px] tracking-widest pl-[1px]">
              <span>더</span>
              <span>알</span>
            </div>
          </div>

          {/* Typography Text Stack */}
          <div className="flex flex-col justify-center leading-none">
            <span className="font-serif text-lg md:text-xl font-bold tracking-[0.12em] text-[#F8F6F1]">
              훈민향음
            </span>
            <span className="text-[10px] md:text-[11px] tracking-[0.15em] text-[#F8F6F1]/70 font-serif font-light mt-1">
              訓民香音 · 이름을 향기로 읽다
            </span>
          </div>
        </div>

        {/* Center: Empty Space for layout elegance */}
        <div className="hidden md:block flex-grow"></div>

        {/* Right Side: Scent Ingredient Customization Button */}
        <div className="flex items-center">
          {step === 'result' && (
            <button 
              onClick={() => setIsEditingNames(!isEditingNames)}
              className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-full border border-[#C9A46C]/25 text-xs text-[#C9A46C] bg-transparent hover:bg-[#C9A46C]/10 hover:border-[#C9A46C]/40 hover:text-[#F8F6F1] transition-all duration-300 shadow-sm font-medium tracking-wide active:scale-[0.97]"
            >
              <Settings className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-45" />
              <span>향료 관리</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
