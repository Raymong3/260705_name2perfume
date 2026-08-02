import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<boolean>;
  errorMessage: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  errorMessage
}) => {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError('비밀번호를 입력해 주세요.');
      return;
    }

    setIsVerifying(true);
    setLocalError('');
    const success = await onVerify(password);
    setIsVerifying(false);

    if (!success) {
      setLocalError(errorMessage || '관리자 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-forest-900 border border-forest-750 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-forest-400 hover:text-white p-1 rounded-lg hover:bg-forest-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-forest-950 rounded-full border border-luxury-gold/40 flex items-center justify-center mx-auto text-luxury-gold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-white">관리자 2차 비밀번호 인증</h3>
          <p className="text-xs text-forest-300">관리자 전용 대시보드 진입을 위한 2차 보안 비밀번호를 입력해 주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (localError) setLocalError('');
              }}
              placeholder="관리자 2차 비밀번호 입력"
              className="w-full px-4 py-3 bg-forest-950 border border-forest-800 rounded-xl text-white text-center font-bold tracking-widest focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30"
              autoFocus
            />
            {(localError || errorMessage) && (
              <p className="text-xs text-red-400 font-semibold text-center mt-2 bg-red-950/40 p-2 rounded border border-red-900/60">
                {localError || errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-forest-800 hover:bg-forest-700 text-luxury-cream font-bold text-sm rounded-xl transition-all border border-forest-650 shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-luxury-cream border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              '관리자 대시보드 진입'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
