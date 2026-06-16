export interface Board {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface DashboardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
}
