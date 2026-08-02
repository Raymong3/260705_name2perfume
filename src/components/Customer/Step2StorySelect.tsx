import React from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { SEJONG_STORIES } from '../../data/sejongStories';
import { SejongStory, NameAnalysis } from '../../types/perfume';

interface Step2StorySelectProps {
  analysis: NameAnalysis | null;
  selectedStory: SejongStory | null;
  onSelectStory: (story: SejongStory) => void;
  onBack: () => void;
  onNext: () => void;
}

export const Step2StorySelect: React.FC<Step2StorySelectProps> = ({
  analysis,
  selectedStory,
  onSelectStory,
  onBack,
  onNext
}) => {
  return (
    <div className="max-w-6xl w-full space-y-8 animate-slide-up print-exclude">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold tracking-widest text-luxury-gold uppercase bg-forest-900/80 px-3.5 py-1.5 rounded-full border border-forest-700 inline-block">2단계: 세종을 담다</span>
        <h2 className="font-serif text-3xl font-bold text-white">세종시의 이야기를 담다</h2>
        <p className="text-sm text-forest-200 max-w-lg mx-auto">
          이름 '{analysis?.normalizedName}'의 향에 녹여내고 싶은 세종시의 명소 이야기를 하나 선택해 주세요.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SEJONG_STORIES.map((story) => {
          const isSelected = selectedStory?.id === story.id;
          return (
            <button
              key={story.id}
              onClick={() => onSelectStory(story)}
              className={`text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-forest-950/80 relative overflow-hidden group hover:shadow-2xl cursor-pointer ${
                isSelected 
                  ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-xl bg-forest-850/90' 
                  : 'border-forest-800 hover:border-forest-650 hover:bg-forest-900/90'
              }`}
            >
              <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-forest-800/20 rounded-full group-hover:scale-110 transition-transform duration-500 -z-10"></div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-serif text-xs font-bold text-luxury-gold tracking-wider uppercase">
                    {story.title}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-luxury-gold text-forest-950 flex items-center justify-center text-[10px] font-bold shadow">
                      ✓
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg font-bold text-white group-hover:text-luxury-cream transition-colors">
                  {story.subtitle}
                </h3>
                <p className="text-xs text-forest-300 leading-relaxed font-medium line-clamp-4">
                  {story.description}
                </p>
              </div>

              <div className="text-[10px] font-semibold text-forest-400 italic pt-2.5 border-t border-forest-800 w-full mt-3">
                {story.imageDesc}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold text-forest-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> 이전으로
        </button>
        <button
          onClick={onNext}
          disabled={!selectedStory}
          className="flex items-center gap-1.5 px-6 py-3 bg-forest-800 text-luxury-cream rounded-xl text-sm font-semibold hover:bg-forest-700 border border-forest-650 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
        >
          <span>향 추천 제안 보기</span> <ArrowRight className="w-4 h-4 text-luxury-gold" />
        </button>
      </div>
    </div>
  );
};
