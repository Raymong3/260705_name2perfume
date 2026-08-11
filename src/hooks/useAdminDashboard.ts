import { useState, useCallback } from 'react';
import { FinalRecipe, PerfumeNote, RecommendedNote } from '../types/perfume';
import { ScentService } from '../services/scentService';
import { AdminAuthService } from '../services/adminAuthService';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { SEJONG_STORIES } from '../data/sejongStories';

/**
 * Calculates recipe diff between original theme formula and current modified formula
 */
export function calcRecipeDiff(
  originalTop: RecommendedNote[],
  originalMiddle: RecommendedNote[],
  originalBase: RecommendedNote[],
  currentTop: RecommendedNote[],
  currentMiddle: RecommendedNote[],
  currentBase: RecommendedNote[]
): { addedNotesText: string; addedNotes: string[]; removedNotes: string[] } {
  const origNames = new Set([
    ...originalTop.map(item => item.note.nameKo || item.note.nameEn),
    ...originalMiddle.map(item => item.note.nameKo || item.note.nameEn),
    ...originalBase.map(item => item.note.nameKo || item.note.nameEn)
  ]);

  const currNames = new Set([
    ...currentTop.map(item => item.note.nameKo || item.note.nameEn),
    ...currentMiddle.map(item => item.note.nameKo || item.note.nameEn),
    ...currentBase.map(item => item.note.nameKo || item.note.nameEn)
  ]);

  const added: string[] = [];
  currNames.forEach(name => {
    if (!origNames.has(name)) added.push(name);
  });

  const removed: string[] = [];
  origNames.forEach(name => {
    if (!currNames.has(name)) removed.push(name);
  });

  const diffParts: string[] = [];
  if (added.length > 0) diffParts.push(`추가: ${added.join(', ')}`);
  if (removed.length > 0) diffParts.push(`제거: ${removed.join(', ')}`);

  return {
    addedNotesText: diffParts.join(' / '),
    addedNotes: added,
    removedNotes: removed
  };
}

export function useAdminDashboard() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [records, setRecords] = useState<FinalRecipe[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FinalRecipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'completed'>('all');
  const [addedNotesText, setAddedNotesText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Verify 2nd Admin Password
  const verifyPassword = useCallback(async (password: string) => {
    const res = await AdminAuthService.verifyAdminPassword(password);
    if (res.success) {
      setIsAdminAuthenticated(true);
      return true;
    }
    setErrorMessage(res.error || '인증 실패');
    return false;
  }, []);

  // 2. Refresh Records List
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const res = await ScentService.getRecords(undefined, true);
    setIsLoading(false);

    if (res.success) {
      setRecords(res.data);
      if (res.data.length > 0 && !selectedRecord) {
        handleSelectRecord(res.data[0]);
      }
    } else {
      setErrorMessage(res.error || '목록을 불러오는 중 오류가 발생했습니다.');
    }
  }, [selectedRecord]);

  // 3. Select Record & Auto-calculate Diff
  const handleSelectRecord = useCallback((record: FinalRecipe) => {
    setSelectedRecord(record);

    let origRecipe = record.originalRecipe;
    if (!origRecipe && record.analysis) {
      const selectedStory = record.selectedStory || SEJONG_STORIES[0];
      const recipe = recommendPerfumes(record.analysis, selectedStory);
      origRecipe = recipe;
    }

    const customerNotesParts: string[] = [];
    if (record.addedNotes && record.addedNotes.length > 0) {
      customerNotesParts.push(`추가: ${record.addedNotes.join(', ')}`);
    }
    if (record.removedNotes && record.removedNotes.length > 0) {
      customerNotesParts.push(`제거: ${record.removedNotes.join(', ')}`);
    }

    if (customerNotesParts.length > 0) {
      setAddedNotesText(customerNotesParts.join(' / '));
    } else if (origRecipe) {
      const diff = calcRecipeDiff(
        origRecipe.top || [],
        origRecipe.middle || [],
        origRecipe.base || [],
        record.top || [],
        record.middle || [],
        record.base || []
      );
      setAddedNotesText(diff.addedNotesText);
    } else {
      setAddedNotesText('');
    }
  }, []);

  // 4. Add Note to Selected Record (Incremental Cumulative Diff)
  const handleAddNote = useCallback((note: PerfumeNote) => {
    if (!selectedRecord) return;
    const category = note.type;
    const currentCategoryNotes = selectedRecord[category] || [];

    if (currentCategoryNotes.some(item => item.note.id === note.id)) return;

    const newNoteItem: RecommendedNote = {
      note,
      ratio: 20,
      reason: '관리자 직접 추가'
    };

    const noteName = note.nameKo || note.nameEn;
    const currentAdded = selectedRecord.addedNotes || [];
    const currentRemoved = selectedRecord.removedNotes || [];

    const updatedAdded = currentAdded.includes(noteName) ? currentAdded : [...currentAdded, noteName];
    const updatedRemoved = currentRemoved.filter(n => n !== noteName);

    const updated = {
      ...selectedRecord,
      [category]: [...currentCategoryNotes, newNoteItem],
      addedNotes: updatedAdded,
      removedNotes: updatedRemoved
    };

    const parts: string[] = [];
    if (updatedAdded.length > 0) parts.push(`추가: ${updatedAdded.join(', ')}`);
    if (updatedRemoved.length > 0) parts.push(`제거: ${updatedRemoved.join(', ')}`);
    setAddedNotesText(parts.join(' / '));

    setSelectedRecord(updated);
  }, [selectedRecord]);

  // 5. Remove Note from Selected Record (Incremental Cumulative Diff)
  const handleRemoveNote = useCallback((category: 'top' | 'middle' | 'base', noteId: string) => {
    if (!selectedRecord) return;
    const currentCategoryNotes = selectedRecord[category] || [];
    const removedItem = currentCategoryNotes.find(item => item.note.id === noteId);
    const updatedCategoryNotes = currentCategoryNotes.filter(item => item.note.id !== noteId);

    const noteName = removedItem ? (removedItem.note.nameKo || removedItem.note.nameEn) : '';
    const currentAdded = selectedRecord.addedNotes || [];
    const currentRemoved = selectedRecord.removedNotes || [];

    const updatedAdded = noteName ? currentAdded.filter(n => n !== noteName) : currentAdded;
    const updatedRemoved = (noteName && !currentRemoved.includes(noteName)) ? [...currentRemoved, noteName] : currentRemoved;

    const updated = {
      ...selectedRecord,
      [category]: updatedCategoryNotes,
      addedNotes: updatedAdded,
      removedNotes: updatedRemoved
    };

    const parts: string[] = [];
    if (updatedAdded.length > 0) parts.push(`추가: ${updatedAdded.join(', ')}`);
    if (updatedRemoved.length > 0) parts.push(`제거: ${updatedRemoved.join(', ')}`);
    setAddedNotesText(parts.join(' / '));

    setSelectedRecord(updated);
  }, [selectedRecord]);

  // 6. Complete Record Processing
  const handleCompleteRecord = useCallback(async (memo: string, name: string) => {
    if (!selectedRecord) return false;

    const updates: Partial<FinalRecipe> = {
      status: 'completed',
      top: selectedRecord.top,
      middle: selectedRecord.middle,
      base: selectedRecord.base,
      addedNotes: selectedRecord.addedNotes,
      removedNotes: selectedRecord.removedNotes,
      modifiedNotes: selectedRecord.modifiedNotes,
      perfumeName: name || selectedRecord.perfumeName,
      makerMemo: memo,
      selectedType: selectedRecord.selectedType
    };

    setIsLoading(true);
    const res = await ScentService.completeRecord(selectedRecord.id, updates);
    setIsLoading(false);

    if (res.success) {
      const completedRecord = { ...selectedRecord, ...updates, status: 'completed' } as FinalRecipe;
      setSelectedRecord(completedRecord);
      setRecords(prev => prev.map(r => r.id === selectedRecord.id ? completedRecord : r));
      return true;
    }
    setErrorMessage(res.error || '완료 처리 중 오류가 발생했습니다.');
    return false;
  }, [selectedRecord]);

  // 7. Delete Record(s)
  const handleDeleteRecords = useCallback(async (ids: string[]) => {
    setIsLoading(true);
    const res = await ScentService.deleteRecords(ids);
    setIsLoading(false);

    if (res.success) {
      setRecords(prev => prev.filter(r => !ids.includes(r.id)));
      if (selectedRecord && ids.includes(selectedRecord.id)) {
        setSelectedRecord(null);
        setAddedNotesText('');
      }
      return true;
    }
    setErrorMessage(res.error || '삭제 처리 중 오류가 발생했습니다.');
    return false;
  }, [selectedRecord]);

  return {
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    records,
    selectedRecord,
    setSelectedRecord,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    addedNotesText,
    setAddedNotesText,
    isLoading,
    errorMessage,
    verifyPassword,
    fetchRecords,
    handleSelectRecord,
    handleAddNote,
    handleRemoveNote,
    handleCompleteRecord,
    handleDeleteRecords
  };
}
