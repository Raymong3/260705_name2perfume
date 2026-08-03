import React, { useState } from 'react';
import { Search, Printer, CheckCircle, Trash2, Plus, Sliders, FileText, FlaskConical, Clock, Activity } from 'lucide-react';
import { FinalRecipe, PerfumeNote } from '../../types/perfume';
import { SORTED_TOP_NOTES, SORTED_MIDDLE_NOTES, SORTED_BASE_NOTES } from '../../data/notes';
import { formatLoginIdDisplay, getDefaultMakerMemo } from '../../utils/formatters';

interface AdminDashboardProps {
  records: FinalRecipe[];
  selectedRecord: FinalRecipe | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'submitted' | 'completed';
  onStatusFilterChange: (status: 'all' | 'submitted' | 'completed') => void;
  addedNotesText: string;
  onAddedNotesTextChange?: (text: string) => void;
  onSelectRecord: (record: FinalRecipe) => void;
  onAddNote: (note: PerfumeNote) => void;
  onRemoveNote: (category: 'top' | 'middle' | 'base', noteId: string) => void;
  onCompleteRecord: (memo: string, perfumeName: string) => Promise<boolean>;
  onDeleteRecords: (ids: string[]) => Promise<boolean>;
  onPrintRecord: (record: FinalRecipe) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  records,
  selectedRecord,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  addedNotesText,
  onAddedNotesTextChange,
  onSelectRecord,
  onAddNote,
  onRemoveNote,
  onCompleteRecord,
  onDeleteRecords,
  onPrintRecord
}) => {
  const [selectedTopToAdd, setSelectedTopToAdd] = useState('');
  const [selectedMiddleToAdd, setSelectedMiddleToAdd] = useState('');
  const [selectedBaseToAdd, setSelectedBaseToAdd] = useState('');
  const [adminMemo, setAdminMemo] = useState(selectedRecord?.makerMemo || (selectedRecord ? getDefaultMakerMemo(selectedRecord.selectedType) : ''));
  const [adminPerfumeName, setAdminPerfumeName] = useState(selectedRecord?.perfumeName || '');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (selectedRecord) {
      const rawMakerMemo = selectedRecord.makerMemo ? selectedRecord.makerMemo.replace(/^(조향사 의견:|조향사메모:|조향사 메모:)\s*/, '') : '';
      setAdminMemo(rawMakerMemo || getDefaultMakerMemo(selectedRecord.selectedType));
      setAdminPerfumeName(selectedRecord.perfumeName || `${selectedRecord.guestName}의 향수`);
    }
  }, [selectedRecord?.id]);

  // Statistics calculation
  const totalCount = records.length;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const pendingCount = records.filter(r => r.status === 'submitted' || r.status !== 'completed').length;

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch = !searchQuery || 
      r.guestName.includes(searchQuery) || 
      r.loginId.includes(searchQuery) || 
      formatLoginIdDisplay(r.loginId).includes(searchQuery) ||
      r.perfumeName.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRecordClick = (r: FinalRecipe) => {
    onSelectRecord(r);
    setAdminMemo(r.makerMemo || getDefaultMakerMemo(r.selectedType));
    setAdminPerfumeName(r.perfumeName || '');
  };

  const handleAddTop = () => {
    if (!selectedTopToAdd) return;
    const note = SORTED_TOP_NOTES.find((n: PerfumeNote) => n.id === selectedTopToAdd);
    if (note) onAddNote(note);
    setSelectedTopToAdd('');
  };

  const handleAddMiddle = () => {
    if (!selectedMiddleToAdd) return;
    const note = SORTED_MIDDLE_NOTES.find((n: PerfumeNote) => n.id === selectedMiddleToAdd);
    if (note) onAddNote(note);
    setSelectedMiddleToAdd('');
  };

  const handleAddBase = () => {
    if (!selectedBaseToAdd) return;
    const note = SORTED_BASE_NOTES.find((n: PerfumeNote) => n.id === selectedBaseToAdd);
    if (note) onAddNote(note);
    setSelectedBaseToAdd('');
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    await onCompleteRecord(adminMemo, adminPerfumeName);
    setIsProcessing(false);
  };

  const handleDeleteCurrent = async () => {
    if (!selectedRecord) return;
    if (window.confirm(`${selectedRecord.guestName}님의 의뢰 기록을 삭제하시겠습니까?`)) {
      setIsProcessing(true);
      await onDeleteRecords([selectedRecord.id]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl w-full space-y-6 animate-fade-in print-exclude py-4 font-sans">
      
      {/* 1. 전문 조향사 상단 메트릭 대시보드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-forest-900/90 border border-forest-750 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-forest-950 flex items-center justify-center text-luxury-gold border border-luxury-gold/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-forest-400 uppercase tracking-widest">TOTAL WORK</div>
            <div className="text-xl font-bold font-serif text-white">{totalCount}건</div>
          </div>
        </div>

        <div className="bg-forest-900/90 border border-forest-750 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400 border border-amber-800/40">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">PENDING & ACTIVE</div>
            <div className="text-xl font-bold font-serif text-amber-400">{pendingCount}건</div>
          </div>
        </div>

        <div className="bg-forest-900/90 border border-forest-750 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800/40">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">COMPLETED</div>
            <div className="text-xl font-bold font-serif text-emerald-400">{completedCount}건</div>
          </div>
        </div>

        <div className="bg-forest-900/90 border border-forest-750 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-forest-950 flex items-center justify-center text-luxury-gold border border-forest-800">
            <Clock className="w-5 h-5 text-luxury-gold" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-forest-400 uppercase tracking-widest">AVG CRAFT TIME</div>
            <div className="text-xl font-bold font-serif text-luxury-cream">12 Min</div>
          </div>
        </div>
      </div>

      {/* 2. 관리자 컨트롤 바 (검색 및 필터) */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-forest-900/90 border border-forest-750 p-4 rounded-2xl shadow-xl backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse"></span>
          <h2 className="font-serif text-lg font-bold text-white tracking-wide">
            디지털 조향사 작업실 (Digital Perfumer's Workbench)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:w-64">
            <Search className="w-4 h-4 text-forest-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="의뢰자 성함 / ID / 향수명 검색"
              className="w-full pl-9 pr-4 py-2 bg-forest-950 border border-forest-800 rounded-xl text-xs text-white placeholder-forest-500 focus:outline-none focus:border-luxury-gold"
            />
          </div>

          <div className="flex border border-forest-800 rounded-xl overflow-hidden bg-forest-950 p-0.5">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-forest-800 text-luxury-gold' : 'text-forest-400 hover:text-white'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => onStatusFilterChange('submitted')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'submitted' ? 'bg-forest-800 text-amber-400' : 'text-forest-400 hover:text-white'
              }`}
            >
              작업 대기
            </button>
            <button
              onClick={() => onStatusFilterChange('completed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-forest-800 text-emerald-400' : 'text-forest-400 hover:text-white'
              }`}
            >
              제작 완료
            </button>
          </div>
        </div>
      </div>

      {/* 3. 대시보드 2열 레이아웃 */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* 좌측 컴팩트 고객 사이드바 (4열) */}
        <div className="lg:col-span-4 bg-forest-900/90 border border-forest-750 rounded-2xl p-4 shadow-xl space-y-3 max-h-[760px] overflow-y-auto backdrop-blur-lg">
          <div className="text-xs font-bold text-forest-300 px-2 pb-2 border-b border-forest-800 flex justify-between items-center">
            <span>고객 의뢰 리스트</span>
            <span className="font-mono text-luxury-gold">{filteredRecords.length}건</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-forest-400">의뢰 기록이 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                const isCompleted = r.status === 'completed';

                return (
                  <button
                    key={r.id}
                    onClick={() => handleRecordClick(r)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-forest-800 border-luxury-gold ring-2 ring-luxury-gold/40 text-white shadow-lg'
                        : 'bg-forest-950/70 border-forest-850 text-forest-300 hover:border-forest-700 hover:bg-forest-900/60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-2 h-full bg-luxury-gold"></div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="font-serif text-sm font-bold text-white">{r.guestName} 님</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {isCompleted ? '제작완료' : '작업대기'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-forest-400 font-mono">
                      <span>ID: {formatLoginIdDisplay(r.loginId)}</span>
                      <span>{r.createdDate}</span>
                    </div>

                    <div className="text-xs text-luxury-gold font-medium font-serif truncate mt-0.5">
                      {r.perfumeName}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 우측 조향 워크벤치 스테이션 (8열) */}
        <div className="lg:col-span-8 bg-forest-900/90 border border-forest-750 rounded-2xl p-6 shadow-xl space-y-6 backdrop-blur-lg">
          {!selectedRecord ? (
            <div className="p-16 text-center text-forest-400 space-y-2">
              <FlaskConical className="w-12 h-12 mx-auto text-forest-600 animate-pulse" />
              <h3 className="font-serif text-lg font-bold text-white">조향 작업대를 선택하세요</h3>
              <p className="text-xs font-medium">좌측 의뢰 리스트에서 실시간 조향 편집할 의뢰 건을 선택해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* 고객 및 작업 상태 정보 */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-forest-950/90 rounded-2xl border border-luxury-gold/30 gap-3 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-luxury-gold"></span>
                    <h3 className="font-serif text-xl font-bold text-white">{selectedRecord.guestName} 님의 레시피 작업대</h3>
                    <span className="text-xs text-luxury-gold font-mono font-semibold">({formatLoginIdDisplay(selectedRecord.loginId)})</span>
                  </div>
                  <p className="text-xs text-forest-300 mt-1">
                    접수일: {selectedRecord.createdDate} | 조향 방식: {selectedRecord.selectedType === 'name_sejong' ? '이름 + 세종 서사 융합' : '이름 소리 분석'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedRecord.status !== 'completed') {
                        alert('조향 제작 완료 처리 및 저장 후에 기록서를 인쇄하실 수 있습니다.');
                        return;
                      }
                      onPrintRecord(selectedRecord);
                    }}
                    className="px-4 py-2 bg-forest-800 hover:bg-forest-750 text-luxury-cream border border-luxury-gold/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Printer className="w-3.5 h-3.5 text-luxury-gold" />
                    <span>기록서 인쇄</span>
                  </button>
                  <button
                    onClick={handleDeleteCurrent}
                    disabled={isProcessing}
                    className="p-2 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/80 rounded-xl text-xs transition-all cursor-pointer"
                    title="의뢰 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 향수 이름 및 커스텀 변경 사항 기입 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-luxury-gold font-serif">시그니처 향수 이름 (Perfume Name)</label>
                  <input
                    type="text"
                    value={adminPerfumeName}
                    onChange={(e) => setAdminPerfumeName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-luxury-gold transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-forest-300 font-serif">
                    조향 변경 이력 기입 (Notes Modification)
                  </label>
                  <input
                    type="text"
                    value={addedNotesText}
                    onChange={(e) => onAddedNotesTextChange && onAddedNotesTextChange(e.target.value)}
                    placeholder="기본 비율 정밀 조향 완료"
                    className="w-full px-4 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-xs font-medium text-luxury-gold focus:outline-none focus:border-luxury-gold transition-all"
                  />
                </div>
              </div>

              {/* 향료 조향 워크스테이션 (Top / Middle / Base) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-forest-800 text-white">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-luxury-gold" />
                    <h4 className="font-serif text-sm font-bold">실시간 향료 포뮬러 제어</h4>
                  </div>
                  <span className="text-[10px] font-mono text-forest-400 uppercase">30ml EAU DE PARFUM BASE</span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Top Note */}
                  <div className="bg-forest-950/70 p-4 rounded-2xl border border-forest-800 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center pb-1.5 border-b border-forest-850">
                      <span className="font-serif text-xs font-bold text-luxury-gold">TOP NOTE</span>
                      <span className="text-[10px] text-forest-400 font-mono">({selectedRecord.top?.length || 0}종)</span>
                    </div>
                    <div className="space-y-1.5 min-h-[110px]">
                      {selectedRecord.top?.map((item) => (
                        <div key={item.note.id} className="bg-forest-900 p-2 rounded-xl border border-forest-800 text-xs flex justify-between items-center shadow-sm">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => onRemoveNote('top', item.note.id)} className="text-red-400 hover:text-red-300 font-bold px-1.5 text-xs cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <select 
                        value={selectedTopToAdd} onChange={(e) => setSelectedTopToAdd(e.target.value)}
                        className="flex-grow p-1.5 bg-forest-950 border border-forest-850 rounded-lg text-[10px] text-white focus:outline-none"
                      >
                        <option value="">탑 향료 추가...</option>
                        {SORTED_TOP_NOTES.map((n: PerfumeNote) => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={handleAddTop} className="px-2.5 py-1.5 bg-luxury-gold text-forest-950 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-luxury-cream">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Note */}
                  <div className="bg-forest-950/70 p-4 rounded-2xl border border-forest-800 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center pb-1.5 border-b border-forest-850">
                      <span className="font-serif text-xs font-bold text-luxury-gold">MIDDLE NOTE</span>
                      <span className="text-[10px] text-forest-400 font-mono">({selectedRecord.middle?.length || 0}종)</span>
                    </div>
                    <div className="space-y-1.5 min-h-[110px]">
                      {selectedRecord.middle?.map((item) => (
                        <div key={item.note.id} className="bg-forest-900 p-2 rounded-xl border border-forest-800 text-xs flex justify-between items-center shadow-sm">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => onRemoveNote('middle', item.note.id)} className="text-red-400 hover:text-red-300 font-bold px-1.5 text-xs cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <select 
                        value={selectedMiddleToAdd} onChange={(e) => setSelectedMiddleToAdd(e.target.value)}
                        className="flex-grow p-1.5 bg-forest-950 border border-forest-850 rounded-lg text-[10px] text-white focus:outline-none"
                      >
                        <option value="">미들 향료 추가...</option>
                        {SORTED_MIDDLE_NOTES.map((n: PerfumeNote) => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={handleAddMiddle} className="px-2.5 py-1.5 bg-luxury-gold text-forest-950 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-luxury-cream">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Base Note */}
                  <div className="bg-forest-950/70 p-4 rounded-2xl border border-forest-800 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center pb-1.5 border-b border-forest-850">
                      <span className="font-serif text-xs font-bold text-luxury-gold">BASE NOTE</span>
                      <span className="text-[10px] text-forest-400 font-mono">({selectedRecord.base?.length || 0}종)</span>
                    </div>
                    <div className="space-y-1.5 min-h-[110px]">
                      {selectedRecord.base?.map((item) => (
                        <div key={item.note.id} className="bg-forest-900 p-2 rounded-xl border border-forest-800 text-xs flex justify-between items-center shadow-sm">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => onRemoveNote('base', item.note.id)} className="text-red-400 hover:text-red-300 font-bold px-1.5 text-xs cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <select 
                        value={selectedBaseToAdd} onChange={(e) => setSelectedBaseToAdd(e.target.value)}
                        className="flex-grow p-1.5 bg-forest-950 border border-forest-850 rounded-lg text-[10px] text-white focus:outline-none"
                      >
                        <option value="">베이스 향료 추가...</option>
                        {SORTED_BASE_NOTES.map((n: PerfumeNote) => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={handleAddBase} className="px-2.5 py-1.5 bg-luxury-gold text-forest-950 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-luxury-cream">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* 고객 전달 메모 (읽기 전용) & 조향사 의견 (편집 가능) */}
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-forest-300 font-serif">고객 작성 요청 메모 (Read-only)</label>
                  <div className="w-full px-4 py-3 bg-forest-950/80 border border-forest-850 rounded-2xl text-xs text-forest-200 min-h-[54px] flex items-center whitespace-pre-wrap font-serif italic">
                    "{selectedRecord.guestMemo || '작성된 고객 메모가 없습니다.'}"
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-luxury-gold font-serif">조향사 의견 (Perfumer's Touch)</label>
                  <textarea
                    value={adminMemo}
                    onChange={(e) => setAdminMemo(e.target.value)}
                    placeholder="조향사의 의견 및 추천 소견을 입력하세요."
                    rows={2}
                    className="w-full px-4 py-3 bg-forest-950 border border-forest-800 rounded-2xl text-xs text-white focus:outline-none focus:border-luxury-gold transition-all"
                  />
                </div>
              </div>

              {/* 가장 강렬한 시선 집중 저장 버튼 */}
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className="w-full py-4 bg-luxury-gold hover:bg-luxury-cream text-forest-950 font-serif font-bold text-base rounded-2xl transition-all shadow-xl hover:shadow-luxury-gold/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 active:scale-98"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-forest-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-forest-950" />
                    <span>조향 제작 완료 처리 및 레시피 저장 (Save Formula)</span>
                  </>
                )}
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
