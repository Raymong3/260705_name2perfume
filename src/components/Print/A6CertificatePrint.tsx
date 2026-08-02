import React from 'react';
import { FinalRecipe } from '../../types/perfume';

interface A6CertificatePrintProps {
  finalRecipe: FinalRecipe;
  onPrint?: () => void;
}

export const A6CertificatePrint: React.FC<A6CertificatePrintProps> = ({ finalRecipe }) => {

  const totalNotesCount = (finalRecipe.top?.length || 0) + (finalRecipe.middle?.length || 0) + (finalRecipe.base?.length || 0);

  const calcNoteMl = (ratio: number, count: number): string => {
    if (!ratio && count > 0) {
      const equalRatio = 100 / count;
      const ml = (equalRatio * 0.1).toFixed(1);
      return `${ml}ml`;
    }
    const ml = (ratio * 0.1).toFixed(1);
    return `${ml}ml`;
  };

  const getDefaultMakerMemo = (selectedType: string) => {
    if (selectedType === 'name_sejong') {
      return '조향사 의견: 고객님의 이름이 가진 세련되고 맑은 음가 특성과 세종시 명소의 공간적 서사를 섬세하게 조합하여 고유한 시그니처 향으로 표현하였습니다.';
    }
    return '조향사 의견: 고객님의 한글 이름 분석을 기반으로 탑, 미들, 베이스 노트를 균형감 있게 안착시켜 개성적이면서도 은은한 조화를 이루도록 조향하였습니다.';
  };

  return (
    <div className="flex flex-col items-center space-y-4 my-8">
      
      {/* A6 포스트카드 실물 크기 템플릿 (105mm x 148mm) */}
      <div 
        id="printable-area" 
        className="w-[105mm] h-[148mm] min-w-[105mm] min-h-[148mm] bg-luxury-cream text-forest-950 p-[6mm] border border-luxury-gold/40 shadow-2xl flex flex-col justify-between relative overflow-hidden print-cert-container font-sans"
        style={{ boxSizing: 'border-box' }}
      >
        {/* 장식용 프레임 테두리 */}
        <div className="absolute inset-[3mm] border border-luxury-gold/30 pointer-events-none"></div>

        {/* 상단 엠블럼 & 헤더 */}
        <div className="text-center space-y-1 pt-1 border-b border-luxury-gold/30 pb-2">
          <div className="text-[8px] font-mono tracking-[0.2em] text-luxury-goldDark uppercase">HUNMINHYANGEUM RECORD</div>
          <h1 className="font-serif text-lg font-bold tracking-tight text-forest-900 leading-tight">
            훈민향음 조향 기록서
          </h1>
          <p className="text-[7px] text-forest-600 font-serif italic">
            "세종의 이야기와 당신의 이름이 향으로 이어지다"
          </p>
        </div>

        {/* 메인 레시피 명세 */}
        <div className="flex-grow py-2 space-y-2 flex flex-col justify-between">
          
          {/* 의뢰자 및 향수 이름 헤더 */}
          <div className="flex justify-between items-baseline border-b border-luxury-gold/20 pb-1">
            <div className="space-y-0.5">
              <span className="text-[7px] text-forest-400 font-mono block">CLIENT / PERFUME</span>
              <span className="font-serif text-sm font-bold text-forest-900">
                {finalRecipe.guestName} <span className="text-[9px] font-normal text-forest-600">의뢰인</span>
              </span>
              <span className="font-serif text-xs font-bold text-luxury-goldDark block">
                [ {finalRecipe.perfumeName} ]
              </span>
            </div>
            <span className="text-forest-400 font-mono text-[7px] font-semibold">{finalRecipe.createdDate}</span>
          </div>

          {/* 향 스토리 문구 */}
          <div className="py-1">
            <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider mb-0.5">Scent Story (향의 이야기)</span>
            <p className="text-[8px] leading-relaxed text-forest-700 font-serif text-justify">
              {finalRecipe.originalRecipe?.description || finalRecipe.originalRecipe?.concept}
            </p>
          </div>

          {/* 최종 노트 구성 리스트 */}
          <div className="space-y-1.5 border-t border-b border-luxury-gold/20 py-2">
            
            {/* Top Notes */}
            <div className="grid grid-cols-4 gap-1 items-baseline">
              <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Top Note</span>
              <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                {finalRecipe.top?.map(item => (
                  <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                    {item.note.nameKo || item.note.nameEn}{' '}
                    <span className="font-mono text-[7px] text-luxury-goldDark">
                      ({calcNoteMl(item.ratio || 0, totalNotesCount)})
                    </span>
                  </span>
                ))}
                {(!finalRecipe.top || finalRecipe.top.length === 0) && <span className="text-[8px] text-forest-300">-</span>}
              </div>
            </div>

            {/* Middle Notes */}
            <div className="grid grid-cols-4 gap-1 items-baseline">
              <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Middle Note</span>
              <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                {finalRecipe.middle?.map(item => (
                  <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                    {item.note.nameKo || item.note.nameEn}{' '}
                    <span className="font-mono text-[7px] text-luxury-goldDark">
                      ({calcNoteMl(item.ratio || 0, totalNotesCount)})
                    </span>
                  </span>
                ))}
                {(!finalRecipe.middle || finalRecipe.middle.length === 0) && <span className="text-[8px] text-forest-300">-</span>}
              </div>
            </div>

            {/* Base Notes */}
            <div className="grid grid-cols-4 gap-1 items-baseline">
              <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Base Note</span>
              <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                {finalRecipe.base?.map(item => (
                  <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                    {item.note.nameKo || item.note.nameEn}{' '}
                    <span className="font-mono text-[7px] text-luxury-goldDark">
                      ({calcNoteMl(item.ratio || 0, totalNotesCount)})
                    </span>
                  </span>
                ))}
                {(!finalRecipe.base || finalRecipe.base.length === 0) && <span className="text-[8px] text-forest-300">-</span>}
              </div>
            </div>

          </div>

          {/* 조향사의 손길 */}
          <div className="space-y-1.5 py-1">
            {finalRecipe.addedNotes && finalRecipe.addedNotes.length > 0 && (
              <div className="text-[7px] text-forest-700 flex flex-wrap gap-x-1 font-semibold bg-luxury-sand/40 p-1.5 rounded border border-luxury-gold/20">
                <span>[조향 변경]: {finalRecipe.addedNotes.join(', ')}</span>
              </div>
            )}

            <div className="space-y-0.5">
              <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider font-mono">Perfumer's Touch (조향사 의견)</span>
              <p className="text-[8px] leading-normal text-forest-700 text-justify">
                {finalRecipe.makerMemo || getDefaultMakerMemo(finalRecipe.selectedType)}
              </p>
            </div>
          </div>

          {/* 훈민향음 낙인 서명 푸터 */}
          <div className="flex justify-between items-end border-t border-luxury-gold/20 pt-2 text-[6px] text-forest-400 font-mono">
            <span className="tracking-[0.1em]">© 訓民香音 2026. ALL RIGHTS RESERVED.</span>
            <div className="flex items-center gap-1 font-serif">
              <span>조향사 :</span>
              <span className="px-1.5 py-0.5 border border-forest-300 rounded-full flex items-center justify-center text-[7px] font-bold text-forest-600">
                이나경
              </span>
            </div>
          </div>

        </div>
      </div>

      <p className="text-center text-xs text-forest-500 print-exclude">
        A6(105mm x 148mm) 규격의 포스트카드 형태로 인쇄하도록 맞춤 최적화되어 있습니다.<br />
        '출력하기' 버튼을 누르면 기록서 부분만 한 장에 깔끔하게 인쇄 가능합니다.
      </p>

    </div>
  );
};
