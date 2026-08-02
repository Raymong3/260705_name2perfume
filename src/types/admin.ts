import { FinalRecipe } from './recipe';

export type AdminAuthState = {
  isAuthenticated: boolean;
  adminId: string | null;
};

export type AdminDashboardState = {
  records: FinalRecipe[];
  selectedRecord: FinalRecipe | null;
  searchQuery: string;
  statusFilter: 'all' | 'submitted' | 'completed';
  addedNotesText: string;
  isModalOpen: boolean;
};
