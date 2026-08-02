import { useState } from 'react';
import { Header } from '../components/Header';
import { GuestMainPage } from '../pages/GuestMainPage';
import { AdminPage } from '../pages/AdminPage';
import { A6CertificatePrint } from '../components/Print/A6CertificatePrint';
import { FinalRecipe } from '../types/perfume';

export function App() {
  const [currentMode, setCurrentMode] = useState<'guest' | 'admin' | 'print'>('guest');
  const [adminLoginId, setAdminLoginId] = useState('');
  const [printTargetRecipe, setPrintTargetRecipe] = useState<FinalRecipe | null>(null);
  const [pastRecordsSignal, setPastRecordsSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [showPastRecords, setShowPastRecords] = useState(false);
  const [adminRefreshTrigger, setAdminRefreshTrigger] = useState(0);

  const handleAdminTrigger = (loginId: string) => {
    setAdminLoginId(loginId);
    setCurrentMode('admin');
  };

  const handleExitAdmin = () => {
    setCurrentMode('guest');
    setAdminLoginId('');
  };

  const handleGoHome = () => {
    setCurrentMode('guest');
    setResetSignal(prev => prev + 1);
    setShowPastRecords(false);
  };

  const handleOpenPastRecords = () => {
    setCurrentMode('guest');
    setPastRecordsSignal(prev => prev + 1);
  };

  const handlePrintRecipe = (recipe: FinalRecipe) => {
    setPrintTargetRecipe(recipe);
    setCurrentMode('print');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Triggered when a new recipe is created by the guest flow
  const handleNewRecipe = () => {
    // Increment a trigger to force admin dashboard refresh
    setAdminRefreshTrigger(prev => prev + 1);
  };

  const handleLoginSuccess = () => {
    setShowPastRecords(true);
  };

  return (
    <div className="min-h-screen bg-forest-950 text-luxury-cream flex flex-col font-sans antialiased selection:bg-luxury-gold selection:text-forest-950 relative overflow-x-hidden">
      {/* Header */}
      <Header onGoHome={handleGoHome} onOpenPastRecords={handleOpenPastRecords} showPastRecords={showPastRecords} />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 max-w-7xl w-full mx-auto relative z-10">
        
        {/* Mode 1: Guest View */}
        {currentMode === 'guest' && (
          <GuestMainPage
            onAdminLoginTrigger={handleAdminTrigger}
            onPrintRecipe={handlePrintRecipe}
            pastRecordsSignal={pastRecordsSignal}
            resetSignal={resetSignal}
            onLoginSuccess={handleLoginSuccess}
            onNewRecipe={handleNewRecipe}
          />
        )}

        {/* Mode 2: Admin View */}
        {currentMode === 'admin' && (
          <AdminPage
            onExitAdmin={handleExitAdmin}
            onPrintRecord={handlePrintRecipe}
            refreshTrigger={adminRefreshTrigger}
          />
        )}

        {/* Mode 3: Print View */}
        {currentMode === 'print' && printTargetRecipe && (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between items-center max-w-md print-exclude bg-forest-900 border border-forest-750 p-4 rounded-xl">
              <button
                onClick={() => setCurrentMode(adminLoginId ? 'admin' : 'guest')}
                className="text-xs font-bold text-forest-300 hover:text-white px-3 py-1.5 rounded-lg border border-forest-800 bg-forest-950 cursor-pointer"
              >
                ← 이전 화면으로 돌아가기
              </button>
              <button
                onClick={() => window.print()}
                className="text-xs font-bold text-forest-950 bg-luxury-gold hover:bg-luxury-cream px-4 py-1.5 rounded-lg shadow-lg cursor-pointer"
              >
                기록서 다시 인쇄하기
              </button>
            </div>

            <A6CertificatePrint finalRecipe={printTargetRecipe} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-luxury-gold/10 bg-forest-950 text-forest-300 py-6 text-center text-xs print-exclude">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <div className="font-serif text-sm font-bold text-luxury-cream">
            훈민향음 (訓民香音)
          </div>
          <p className="text-[11px] text-forest-400 font-light">
            세종의 한글과 향기로 전하는 당신만의 고유한 시그니처 향수
          </p>
          <div className="text-[10px] text-forest-500 font-mono pt-1">
            © 2026 훈민향음. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
