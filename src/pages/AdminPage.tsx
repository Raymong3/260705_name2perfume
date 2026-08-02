import React, { useEffect } from 'react';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { AdminLoginModal } from '../components/Admin/AdminLoginModal';
import { AdminDashboard } from '../components/Admin/AdminDashboard';
import { FinalRecipe } from '../types/perfume';

interface AdminPageProps {
  onExitAdmin: () => void;
  onPrintRecord: (record: FinalRecipe) => void;
  refreshTrigger?: number;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onExitAdmin,
  onPrintRecord,
  refreshTrigger,
}) => {
  const {
    isAdminAuthenticated,
    records,
    selectedRecord,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    addedNotesText,
    errorMessage,
    verifyPassword,
    fetchRecords,
    handleSelectRecord,
    handleAddNote,
    handleRemoveNote,
    handleCompleteRecord,
    handleDeleteRecords
  } = useAdminDashboard();

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchRecords();
    }
  }, [isAdminAuthenticated, fetchRecords, refreshTrigger]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 2차 비밀번호 검증 모달 */}
      <AdminLoginModal
        isOpen={!isAdminAuthenticated}
        onClose={onExitAdmin}
        onVerify={verifyPassword}
        errorMessage={errorMessage}
      />

      {/* 관리자 메인 대시보드 */}
      {isAdminAuthenticated && (
        <AdminDashboard
          records={records}
          selectedRecord={selectedRecord}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          addedNotesText={addedNotesText}
          onSelectRecord={handleSelectRecord}
          onAddNote={handleAddNote}
          onRemoveNote={handleRemoveNote}
          onCompleteRecord={handleCompleteRecord}
          onDeleteRecords={handleDeleteRecords}
          onPrintRecord={onPrintRecord}
        />
      )}
    </div>
  );
};
