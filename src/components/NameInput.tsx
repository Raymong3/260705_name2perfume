import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface NameInputProps {
  onNext: (name: string) => void;
  isLoading: boolean;
}

export const NameInput: React.FC<NameInputProps> = ({ onNext, isLoading }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
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

    setError('');
    onNext(trimmedName);
  };

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label 
            htmlFor="name" 
            className="block text-xs font-semibold tracking-wider text-forest-700 uppercase mb-2"
          >
            Your Name (한글 이름)
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
            className="w-full px-5 py-4 bg-luxury-cream border border-forest-200 focus:border-forest-600 focus:ring-forest-100 rounded-lg text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-4 transition-all duration-300 text-lg tracking-wide"
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
          <Sparkles className="w-4 h-4 text-luxury-gold" />
          <span>나를 읽다 (이름 분석 시작)</span>
        </button>
      </form>
    </div>
  );
};
