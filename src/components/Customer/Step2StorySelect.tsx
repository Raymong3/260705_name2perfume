import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
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
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(selectedStory?.id || null);

  const handleCardClick = (story: SejongStory) => {
    onSelectStory(story);
    setExpandedStoryId(expandedStoryId === story.id ? null : story.id);
  };

  return (
    <div className="max-w-6xl w-full space-y-8 animate-slide-up print-exclude py-4">
      {/* Step Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold tracking-[0.2em] text-luxury-gold uppercase bg-forest-950/90 px-4 py-1.5 rounded-full border border-luxury-gold/30 inline-block shadow-md">
          2단계: 세종의 서사를 담다
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-wide">
          세종시의 시그니처 감성을 선택하세요
        </h2>
        <p className="text-sm text-forest-200/90 max-w-xl mx-auto font-serif leading-relaxed">
          이름 <span className="text-luxury-gold font-bold">'{analysis?.normalizedName}'</span>에 조화롭게 결합될 세종의 장소 서사를 하나 선택해 주세요.
        </p>
      </div>

      {/* 갤러리 카드 그리드 (감성 비주얼 중심) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SEJONG_STORIES.map((story) => {
          const isSelected = selectedStory?.id === story.id;
          const isExpanded = expandedStoryId === story.id;

          return (
            <div
              key={story.id}
              onClick={() => handleCardClick(story)}
              className={`rounded-2xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col justify-between relative group ${
                isSelected 
                  ? 'bg-forest-850/95 ring-2 ring-luxury-gold shadow-2xl scale-[1.02]' 
                  : 'bg-forest-950/80 hover:bg-forest-900/90 hover:shadow-xl hover:scale-[1.01]'
              }`}
            >
              {/* 이미지 썸네일 히어로 영역 */}
              <div className="relative h-44 w-full overflow-hidden">
                <img 
                  src={story.imageUrl} 
                  alt={story.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-transparent"></div>

                {/* 선택 체크 마크 */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-luxury-gold text-forest-950 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 font-serif">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>선택됨</span>
                  </div>
                )}

                {/* 장소 이름 & 한 줄 서사 */}
                <div className="absolute bottom-3 left-4 right-4 space-y-0.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-luxury-gold uppercase">
                    SEJONG ATELIER STORY
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-luxury-cream transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs text-forest-200 font-serif line-clamp-1 italic">
                    {story.subtitle}
                  </p>
                </div>
              </div>

              {/* 본문 콘텐츠 & 펼치기 릴리즈 */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                
                {/* 펼쳤을 때 또는 선택 상태 시 노출되는 상세 설명 */}
                {(isExpanded || isSelected) ? (
                  <div className="space-y-3 animate-fade-in pt-1">
                    <p className="text-xs text-forest-200 leading-relaxed font-serif text-justify border-t border-forest-800/80 pt-3">
                      {story.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {story.bonusTags?.map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-forest-900 text-luxury-gold/90 px-2 py-0.5 rounded-full font-serif border border-luxury-gold/20">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-[10px] text-forest-400 font-mono italic pt-2 border-t border-forest-850">
                      대표 노트: {story.bonusNotes?.join(' · ')}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs text-forest-400 font-serif pt-1 group-hover:text-luxury-gold">
                    <span>상세 스토리 및 향료 정보 펼치기</span>
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 탐색 버튼 */}
      <div className="flex justify-between items-center pt-6 border-t border-forest-800/50">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-forest-300 hover:text-white transition-colors cursor-pointer px-4 py-2 rounded-xl bg-forest-950/60 border border-forest-850"
        >
          <ChevronLeft className="w-4 h-4" /> 이전 단계로
        </button>
        <button
          onClick={onNext}
          disabled={!selectedStory}
          className="flex items-center gap-2 px-7 py-3.5 bg-luxury-gold hover:bg-luxury-cream text-forest-950 rounded-xl text-sm font-bold shadow-xl hover:shadow-luxury-gold/30 disabled:opacity-40 transition-all cursor-pointer font-serif"
        >
          <span>향 포뮬러 추천 제안 보기</span> 
          <ArrowRight className="w-4 h-4 text-forest-950" />
        </button>
      </div>
    </div>
  );
};
