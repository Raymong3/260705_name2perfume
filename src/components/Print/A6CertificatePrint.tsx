import React, { useState } from 'react';
import { FinalRecipe } from '../../types/perfume';
import { Sparkles, Printer, Eye, Layers } from 'lucide-react';

interface A6CertificatePrintProps {
  finalRecipe: FinalRecipe;
  onPrint?: () => void;
}

export const A6CertificatePrint: React.FC<A6CertificatePrintProps> = ({ finalRecipe }) => {
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'both'>('front');

  const totalNotesCount = (finalRecipe.top?.length || 0) + (finalRecipe.middle?.length || 0) + (finalRecipe.base?.length || 0);

  const calcEqualNoteMl = (count: number): string => {
    if (count <= 0) return '0ml';
    const ml = 30 / count;
    const formatted = ml % 1 === 0 ? ml.toFixed(0) : ml.toFixed(1);
    return `${formatted}ml`;
  };

  const getSerialNumber = (recipe: FinalRecipe): string => {
    const dateStr = recipe.createdDate ? recipe.createdDate.replace(/[^0-9]/g, '').slice(2, 8) : '260803';
    const idSeed = recipe.id ? recipe.id.replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase() : '014';
    return `HY-${dateStr}-${idSeed.padStart(3, '0')}`;
  };

  const getDefaultMakerMemo = (selectedType: string) => {
    if (selectedType === 'name_sejong') {
      return '고객님의 이름이 가진 세련되고 맑은 음가 특성과 세종시 명소의 공간적 서사를 섬세하게 조합하여 고유한 시그니처 향으로 표현하였습니다.';
    }
    return '고객님의 한글 이름 분석을 기반으로 탑, 미들, 베이스 노트를 균형감 있게 안착시켜 개성적이면서도 은은한 조화를 이루도록 조향하였습니다.';
  };

  const serialNo = getSerialNumber(finalRecipe);
  const makerMemoText = (finalRecipe.makerMemo || getDefaultMakerMemo(finalRecipe.selectedType)).replace(/^(조향사 의견:|조향사메모:|조향사 메모:)\s*/, '');

  return (
    <div className="flex flex-col items-center space-y-6 my-6 w-full max-w-2xl mx-auto">
      
      {/* 화면 제어 탭 & 인쇄 안내 (화면 표시 전용) */}
      <div className="w-full bg-forest-900/90 border border-forest-750 p-4 rounded-2xl shadow-xl backdrop-blur-md print-exclude space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-luxury-gold" />
            <span className="text-xs font-serif font-bold text-white">RE:SEJONG BRAND CARD</span>
          </div>

          <div className="flex items-center bg-forest-950 p-1 rounded-xl border border-forest-800">
            <button
              onClick={() => setActiveTab('front')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'front' ? 'bg-forest-800 text-luxury-gold shadow' : 'text-forest-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 앞면 (Front)
            </button>
            <button
              onClick={() => setActiveTab('back')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'back' ? 'bg-forest-800 text-luxury-gold shadow' : 'text-forest-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 뒷면 (Back)
            </button>
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'both' ? 'bg-forest-800 text-luxury-gold shadow' : 'text-forest-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> 전체 2면 출력
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-luxury-gold hover:bg-luxury-cream text-forest-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> 브랜드 카드 출력
          </button>
        </div>

        <p className="text-[11px] text-forest-300 text-center sm:text-left leading-relaxed">
          ✦ A6(105×148mm) 규격에 맞춘 프리미엄 브랜드 레시피 카드입니다.<br />
          ✦ 인스타그램 등 SNS 촬영 시 향수병 옆에 함께 놓고 연출하시면 매력적인 시그니처 컷을 완성할 수 있습니다.
        </p>
      </div>

      {/* 카드 인쇄 영역 */}
      <div className="flex flex-col items-center gap-8 w-full">
        
        {/* ===== [ 앞면 카드 (FRONT SIDE) ] ===== */}
        {(activeTab === 'front' || activeTab === 'both') && (
          <div 
            id="printable-area-front"
            className="w-[105mm] h-[148mm] min-w-[105mm] min-h-[148mm] bg-[#FAF8F5] text-stone-900 p-[7mm] shadow-2xl flex flex-col justify-between relative overflow-hidden print-card-front font-sans border border-stone-300/80 rounded-sm"
            style={{ boxSizing: 'border-box' }}
          >
            {/* 상단 미니멀 브랜드 헤더 */}
            <div className="border-b border-stone-300/60 pb-2 space-y-1">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 text-left">
                  <div className="text-[7.5px] font-mono tracking-[0.25em] text-stone-500 uppercase font-semibold">
                    RE:SEJONG
                  </div>
                  <div className="font-serif text-base font-bold text-stone-900 tracking-tight leading-none">
                    Re:세종
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="text-[7px] font-mono text-stone-400 uppercase tracking-widest">BATCH NO.</div>
                  <div className="text-[8px] font-mono font-bold text-amber-900/80 tracking-wider">
                    {serialNo}
                  </div>
                </div>
              </div>
              <p className="text-[6.5px] text-stone-400 font-serif italic tracking-tight text-left">
                "세종의 장소와 당신의 이름이 향으로 이어지다"
              </p>
            </div>

            {/* 메인 히어로 섹션 (이름 & 향수명 - 가장 돋보이는 부분) */}
            <div className="py-2 space-y-2 border-b border-stone-300/60">
              <div className="flex justify-between items-end">
                <div className="text-[8px] font-mono uppercase text-stone-400 tracking-wider">
                  FOR. <span className="font-serif font-bold text-stone-800 text-[10px] ml-1">{finalRecipe.guestName}</span>
                </div>
                <span className="text-[7.5px] font-mono text-stone-400">{finalRecipe.createdDate}</span>
              </div>

              {/* 향수 이름 라벨 (르라보 / 딥티크 타이틀 스타일) */}
              <div className="bg-stone-100/80 border border-stone-300/70 p-2.5 rounded-sm text-center relative shadow-sm">
                <div className="text-[6.5px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-0.5">
                  EAU DE PARFUM / SIGNATURE SCENT
                </div>
                <h2 className="font-serif text-lg font-bold text-stone-900 tracking-wide leading-snug">
                  {finalRecipe.perfumeName}
                </h2>
              </div>
            </div>

            {/* 향의 이야기 (감성적 에디토리얼 영역 - 좁은 폭 & 충분한 여백) */}
            <div className="py-1.5 px-2">
              <div className="text-[7px] font-mono uppercase tracking-widest text-stone-400 mb-1 text-center font-semibold">
                — SCENT STORY —
              </div>
              <p className="text-[8px] leading-relaxed text-stone-700 font-serif text-center italic max-w-[90%] mx-auto">
                "{finalRecipe.originalRecipe?.description || finalRecipe.originalRecipe?.concept}"
              </p>
            </div>

            {/* 향료 포뮬러 노트 (TOP / MIDDLE / BASE - 갤러리 레시피 카드 스타일) */}
            <div className="py-2 border-t border-b border-stone-300/60 space-y-1.5">
              <div className="text-[7px] font-mono uppercase tracking-widest text-stone-400 font-bold mb-1">
                RECIPE FORMULA
              </div>

              {/* Top Note */}
              <div className="flex items-baseline text-[8px] space-x-2">
                <span className="font-mono text-[7px] text-stone-400 w-12 font-bold uppercase">TOP</span>
                <div className="flex-1 flex flex-wrap gap-x-2 gap-y-0.5 text-stone-800 font-medium">
                  {finalRecipe.top?.map(item => (
                    <span key={item.note.id} className="whitespace-nowrap">
                      {item.note.nameKo || item.note.nameEn}
                      <span className="font-mono text-[6.5px] text-stone-400 ml-0.5">({calcEqualNoteMl(totalNotesCount)})</span>
                    </span>
                  ))}
                  {(!finalRecipe.top || finalRecipe.top.length === 0) && <span className="text-stone-300">-</span>}
                </div>
              </div>

              {/* Middle Note */}
              <div className="flex items-baseline text-[8px] space-x-2">
                <span className="font-mono text-[7px] text-stone-400 w-12 font-bold uppercase">MID</span>
                <div className="flex-1 flex flex-wrap gap-x-2 gap-y-0.5 text-stone-800 font-medium">
                  {finalRecipe.middle?.map(item => (
                    <span key={item.note.id} className="whitespace-nowrap">
                      {item.note.nameKo || item.note.nameEn}
                      <span className="font-mono text-[6.5px] text-stone-400 ml-0.5">({calcEqualNoteMl(totalNotesCount)})</span>
                    </span>
                  ))}
                  {(!finalRecipe.middle || finalRecipe.middle.length === 0) && <span className="text-stone-300">-</span>}
                </div>
              </div>

              {/* Base Note */}
              <div className="flex items-baseline text-[8px] space-x-2">
                <span className="font-mono text-[7px] text-stone-400 w-12 font-bold uppercase">BASE</span>
                <div className="flex-1 flex flex-wrap gap-x-2 gap-y-0.5 text-stone-800 font-medium">
                  {finalRecipe.base?.map(item => (
                    <span key={item.note.id} className="whitespace-nowrap">
                      {item.note.nameKo || item.note.nameEn}
                      <span className="font-mono text-[6.5px] text-stone-400 ml-0.5">({calcEqualNoteMl(totalNotesCount)})</span>
                    </span>
                  ))}
                  {(!finalRecipe.base || finalRecipe.base.length === 0) && <span className="text-stone-300">-</span>}
                </div>
              </div>
            </div>

            {/* 커스텀 내역, 메모 & 조향사 메시지 */}
            <div className="py-1 space-y-1 text-left">
              {/* 조향 변경 이력 */}
              {((finalRecipe.addedNotes && finalRecipe.addedNotes.length > 0) || (finalRecipe.removedNotes && finalRecipe.removedNotes.length > 0)) && (
                <div className="text-[7.5px] text-stone-600 space-x-1.5 flex items-center pt-0.5">
                  <span className="font-mono font-bold text-amber-900/80 text-[7px] uppercase">MODIFIED:</span>
                  <span className="truncate">
                    {finalRecipe.addedNotes && finalRecipe.addedNotes.length > 0 && `+${finalRecipe.addedNotes.join(', ')} `}
                    {finalRecipe.removedNotes && finalRecipe.removedNotes.length > 0 && `-${finalRecipe.removedNotes.join(', ')}`}
                  </span>
                </div>
              )}

              {/* 고객 메모 */}
              {finalRecipe.guestMemo && (
                <div className="pt-0.5">
                  <div className="text-[6.5px] font-mono uppercase text-stone-400 font-semibold">GUEST NOTE</div>
                  <p className="text-[7.5px] leading-tight text-stone-700 font-serif italic">
                    "{finalRecipe.guestMemo}"
                  </p>
                </div>
              )}

              {/* 조향사 의견 */}
              <div className="pt-0.5">
                <div className="text-[6.5px] font-mono uppercase text-stone-400 font-semibold">PERFUMER'S MESSAGE</div>
                <p className="text-[7.5px] leading-relaxed text-stone-700 font-serif text-justify">
                  {makerMemoText}
                </p>
              </div>
            </div>

            {/* 미니멀 브랜딩 푸터 & 조향사 서명 */}
            <div className="pt-2 border-t border-stone-300/60 flex justify-between items-end text-[6.5px] text-stone-400 font-mono">
              <div className="space-y-0.5 text-left">
                <div className="font-serif font-bold text-stone-600">Crafted in Sejong</div>
                <div className="text-[6px] tracking-wider text-stone-400">© Re:세종 2026. ALL RIGHTS RESERVED.</div>
              </div>

              <div className="text-right flex items-center gap-1.5">
                <span className="text-[7px] text-stone-400 font-serif italic">Perfumed by</span>
                <span className="font-serif text-[8.5px] font-bold text-stone-900 px-2 py-0.5 border-b border-stone-800">
                  이나경
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ===== [ 뒷면 카드 (BACK SIDE) ] ===== */}
        {(activeTab === 'back' || activeTab === 'both') && (
          <div 
            id="printable-area-back"
            className="w-[105mm] h-[148mm] min-w-[105mm] min-h-[148mm] bg-[#FAF8F5] text-stone-900 p-[8mm] shadow-2xl flex flex-col justify-between items-center relative overflow-hidden print-card-back font-sans border border-stone-300/80 rounded-sm text-center"
            style={{ boxSizing: 'border-box' }}
          >
            {/* 상단 엠블럼 워터마크 */}
            <div className="pt-4 space-y-2">
              <img 
                src="/images/stamp.png" 
                alt="Re:세종 직인" 
                className="w-11 h-auto mx-auto object-contain"
              />
              <div className="text-[8px] font-mono tracking-[0.3em] text-stone-400 uppercase">
                RE:SEJONG
              </div>
            </div>

            {/* 중앙 감성 브랜딩 시적 문구 */}
            <div className="py-6 space-y-4 max-w-[85%] mx-auto">
              <div className="w-6 h-[1px] bg-amber-900/40 mx-auto"></div>
              <p className="font-serif text-sm leading-loose text-stone-800 font-medium">
                이 향은<br />
                세종의 이야기와<br />
                당신의 이름이 만나<br />
                탄생한 단 하나의 향입니다.
              </p>
              <div className="w-6 h-[1px] bg-amber-900/40 mx-auto"></div>
            </div>

            {/* 하단 QR 코드 & 브랜드 굿즈 안내 */}
            <div className="pb-2 space-y-3 w-full flex flex-col items-center">
              
              {/* 더알(DEORAL) QR 코드 이미지 렌더링 */}
              <img 
                src="/images/qrcode.png" 
                alt="더알 QR 코드" 
                className="w-16 h-16 bg-white p-1 border border-stone-300 rounded shadow-sm object-contain" 
              />

              <div className="space-y-1">
                <div className="text-[7.5px] font-mono font-bold tracking-widest text-stone-700 uppercase">
                  TheR SHOP & ARCHIVE
                </div>
                <p className="text-[7px] text-stone-500 font-serif leading-tight">
                  스마트폰 카메라로 QR 코드를 스캔하시면<br />
                  Re:세종과 더알(TheR)의 브랜드 소식을 확인하실 수 있습니다.
                </p>
                <div className="text-[7px] font-mono text-stone-400 pt-0.5">
                  @ther_nagyeong
                </div>
              </div>

              <div className="pt-2 text-[6px] font-mono text-stone-400 tracking-wider uppercase border-t border-stone-200 w-full text-center">
                Crafted with Memory & Story in Sejong
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
