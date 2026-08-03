import React, { useState } from 'react';
import { Search, Printer, CheckCircle, Trash2, Plus, Sliders, FileText } from 'lucide-react';
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
    <div className="max-w-7xl w-full space-y-6 animate-fade-in print-exclude py-4">
      {/* 관리자 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-forest-900/90 border border-forest-750 p-6 rounded-2xl shadow-xl backdrop-blur-lg">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-luxury-gold uppercase bg-forest-950 px-3 py-1 rounded-full border border-forest-800">
            ADMIN DASHBOARD
          </span>
          <h2 className="font-serif text-2xl font-bold text-white mt-1">훈민향음 조향사 관제 대시보드</h2>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="w-4 h-4 text-forest-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="의뢰자 성함 / ID 검색"
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
              전체 ({records.length})
            </button>
            <button
              onClick={() => onStatusFilterChange('submitted')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'submitted' ? 'bg-forest-800 text-luxury-gold' : 'text-forest-400 hover:text-white'
              }`}
            >
              대기 ({records.filter(r => r.status === 'submitted').length})
            </button>
            <button
              onClick={() => onStatusFilterChange('completed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-forest-800 text-luxury-gold' : 'text-forest-400 hover:text-white'
              }`}
            >
              완료 ({records.filter(r => r.status === 'completed').length})
            </button>
          </div>
        </div>
      </div>

      {/* 대시보드 2열 레이아웃 */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* 좌측: 고객 목록 (4열) */}
        <div className="lg:col-span-4 bg-forest-900/90 border border-forest-750 rounded-2xl p-4 shadow-xl space-y-3 max-h-[750px] overflow-y-auto backdrop-blur-lg">
          <div className="text-xs font-bold text-forest-300 px-2 pb-2 border-b border-forest-800 flex justify-between items-center">
            <span>고객 의뢰 목록 ({filteredRecords.length}건)</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-forest-400">접수된 의뢰 기록이 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRecordClick(r)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-forest-800 border-luxury-gold ring-1 ring-luxury-gold/40 text-white'
                        : 'bg-forest-950/70 border-forest-850 text-forest-300 hover:border-forest-700 hover:bg-forest-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-sm font-bold text-white">{r.guestName}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        r.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {r.status === 'completed' ? '제작완료' : '조향대기'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-forest-400">
                      <span>ID: {formatLoginIdDisplay(r.loginId)}</span>
                      <span>{r.createdDate}</span>
                    </div>
                    <div className="text-xs text-luxury-cream font-medium font-serif truncate mt-1">
                      {r.perfumeName}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 우측: 상세 조향 편집 및 제어 (8열) */}
        <div className="lg:col-span-8 bg-forest-900/90 border border-forest-750 rounded-2xl p-6 shadow-xl space-y-6 backdrop-blur-lg">
          {!selectedRecord ? (
            <div className="p-16 text-center text-forest-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-forest-600" />
              <p className="text-sm font-medium">좌측 목록에서 의뢰 건을 선택해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* 고객 기본 정보 */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-forest-950/80 rounded-xl border border-forest-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-white">{selectedRecord.guestName} 님의 조향 의뢰</h3>
                    <span className="text-xs text-luxury-gold font-mono font-semibold">({formatLoginIdDisplay(selectedRecord.loginId)})</span>
                  </div>
                  <p className="text-xs text-forest-300 mt-0.5">
                    접수일: {selectedRecord.createdDate} | 테마: {selectedRecord.selectedType === 'name_sejong' ? '이름 + 세종 융합' : '이름 분석'}
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
                    className="px-3.5 py-2 bg-forest-800 hover:bg-forest-700 text-luxury-cream border border-forest-650 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-luxury-gold" />
                    <span>기록서 인쇄</span>
                  </button>
                  <button
                    onClick={handleDeleteCurrent}
                    disabled={isProcessing}
                    className="p-2 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/80 rounded-lg text-xs transition-all cursor-pointer"
                    title="의뢰 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 향수 이름 및 자동 변경사항 기입 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-luxury-gold font-serif">향수 이름</label>
                  <input
                    type="text"
                    value={adminPerfumeName}
                    onChange={(e) => setAdminPerfumeName(e.target.value)}
                    className="w-full px-3 py-2 bg-forest-950 border border-forest-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-forest-300 font-serif">
                    변경 사항 기입
                  </label>
                  <input
                    type="text"
                    value={addedNotesText}
                    onChange={(e) => onAddedNotesTextChange && onAddedNotesTextChange(e.target.value)}
                    placeholder="기본 레시피 유지 (비율 정밀 조정)"
                    className="w-full px-3 py-2 bg-forest-950 border border-forest-800 rounded-xl text-xs font-medium text-luxury-gold focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

              {/* 향료 조향 편집 영역 (Top / Middle / Base) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-forest-800 text-white">
                  <Sliders className="w-4 h-4 text-luxury-gold" />
                  <h4 className="font-serif text-sm font-bold">향료 포뮬러 실시간 편집</h4>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Top Note */}
                  <div className="bg-forest-950/60 p-3.5 rounded-xl border border-forest-800 space-y-2.5">
                    <div className="flex justify-between items-center pb-1 border-b border-forest-850">
                      <span className="font-serif text-xs font-bold text-luxury-gold">Top Notes</span>
                      <span className="text-[10px] text-forest-400 font-mono">({selectedRecord.top?.length || 0}종)</span>
                    </div>
                    <div className="space-y-1.5 min-h-[100px]">
                      {selectedRecord.top?.map((item) => (
                        <div key={item.note.id} className="bg-forest-950 p-2 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => onRemoveNote('top', item.note.id)} className="text-red-400 hover:text-red-300 font-bold px-1 text-xs cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <select 
                        value={selectedTopToAdd} onChange={(e) => setSelectedTopToAdd(e.target.value)}
                        className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                      >
                        <option value="">탑 향료 추가...</option>
                        {SORTED_TOP_NOTES.map((n: PerfumeNote) => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={handleAddTop} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Note */}
                  <div className="bg-forest-950/60 p-3.5 rounded-xl border border-forest-800 space-y-2.5">
                    <div className="flex justify-between items-center pb-1 border-b border-forest-850">
                      <span className="font-serif text-xs font-bold text-luxury-gold">Middle Notes</span>
                      <span className="text-[10px] text-forest-400 font-mono">({selectedRecord.middle?.length || 0}종)</span>
                    </div>
                    <div className="space-y-1.5 min-h-[100px]">
                      {selectedRecord.middle?.map((item) => (
                        <div key={item.note.id} className="bg-forest-950 p-2 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => onRemoveNote('middle', item.note.id)} className="text-red-400 hover:text-red-300 font-bold px-1 text-xs cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <select 
                        value={selectedMiddleToAdd} onChange={(e) => setSelectedMiddleToAdd(e.target.value)}
                        className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                      >
                        <option value="">미들 향료 추가...</option>
                        {SORTED_MIDDLE_NOTES.map((n: PerfumeNote) => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={handleAddMiddle} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Base Note */}
                  <div className="bg-forest-950/60 p-3.5 rounded-xl border border-forest-800 space-y-2.5">
                    <div className="flex justify-between items-center pb-1 border-b border-forest-850">
                      <span className="font-serif text-xs font-bold text-luxury-gold">Base Notes</span>
                      <span className="text-[10px] text-forest-400 font-mono">({selectedRecord.base?.length || 0}종)</span>
                    </div>
                    <div className="space-y-1.5 min-h-[100px]">
                      {selectedRecord.base?.map((item) => (
                        <div key={item.note.id} className="bg-forest-950 p-2 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => onRemoveNote('base', item.note.id)} className="text-red-400 hover:text-red-300 font-bold px-1 text-xs cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <select 
                        value={selectedBaseToAdd} onChange={(e) => setSelectedBaseToAdd(e.target.value)}
                        className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                      >
                        <option value="">베이스 향료 추가...</option>
                        {SORTED_BASE_NOTES.map((n: PerfumeNote) => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={handleAddBase} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* 고객 전달 메모 (읽기 전용) & 조향사 의견 (편집 가능) */}
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-forest-300 font-serif">고객 작성 메모 (Read-only)</label>
                  <div className="w-full px-3 py-2 bg-forest-950/80 border border-forest-850 rounded-xl text-xs text-forest-200 min-h-[46px] flex items-center whitespace-pre-wrap">
                    {selectedRecord.guestMemo || '작성된 고객 메모가 없습니다.'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-luxury-gold font-serif">조향사 의견</label>
                  <textarea
                    value={adminMemo}
                    onChange={(e) => setAdminMemo(e.target.value)}
                    placeholder="조향사의 의견 및 추천 소견을 입력하세요."
                    rows={2}
                    className="w-full px-3 py-2 bg-forest-950 border border-forest-800 rounded-xl text-xs text-white focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

                <button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-forest-800 hover:bg-forest-700 text-luxury-cream border border-forest-650 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-serif"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-luxury-cream border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-luxury-gold" />
                      <span>조향 제작 완료 처리 및 저장</span>
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
