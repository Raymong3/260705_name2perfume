import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface NameInputProps {
  onRecommend: (name: string, keyword: string) => void;
  isLoading: boolean;
}

export const NameInput: React.FC<NameInputProps> = ({ onRecommend, isLoading }) => {
  const [name, setName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedKeyword = keyword.trim();
    
    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!/^[가-힣]+$/.test(trimmedName)) {
      setError('공백 없는 한글 이름만 입력 가능합니다.');
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 5) {
      setError('이름은 2자에서 5자 사이로 입력해주세요.');
      return;
    }

    if (!trimmedKeyword) {
      setError('세종 하면 떠오르는 단어/이미지를 입력해주세요.');
      return;
    }

    if (trimmedKeyword.length < 1 || trimmedKeyword.length > 15) {
      setError('연상 단어는 1자에서 15자 사이로 입력해주세요.');
      return;
    }

    setError('');
    onRecommend(trimmedName, trimmedKeyword);
  };

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label 
            htmlFor="name" 
            className="block text-xs font-semibold tracking-wider text-forest-700 uppercase mb-2"
          >
            Your Name (이름)
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="이름을 입력하세요 (예: 홍길동)"
            disabled={isLoading}
            className={`w-full px-5 py-4 bg-luxury-cream border border-forest-200 focus:border-forest-600 focus:ring-forest-100 rounded-lg text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-4 transition-all duration-300 text-lg tracking-wide`}
          />
        </div>

        <div className="relative">
          <label 
            htmlFor="keyword" 
            className="block text-xs font-semibold tracking-wider text-forest-700 uppercase mb-2"
          >
            Sejong Word (세종 연상 단어/이미지)
          </label>
          <input
            type="text"
            id="keyword"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              if (error) setError('');
            }}
            placeholder="예: 한글, 지혜, 책, 왕 등"
            disabled={isLoading}
            className={`w-full px-5 py-4 bg-luxury-cream border border-forest-200 focus:border-forest-600 focus:ring-forest-100 rounded-lg text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-4 transition-all duration-300 text-lg tracking-wide`}
          />
          {error && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-red-600 font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="luxury-btn w-full flex items-center justify-center gap-2 px-6 py-4 bg-forest-800 text-luxury-cream font-medium rounded-lg hover:bg-forest-900 transition-all duration-300 shadow-md shadow-forest-950/10 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-luxury-cream border-t-transparent rounded-full animate-spin"></div>
              <span>이름 및 단어 향기 분석 중...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-luxury-gold animate-pulse-slow" />
              <span>나만의 향수 조합 추천받기</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
