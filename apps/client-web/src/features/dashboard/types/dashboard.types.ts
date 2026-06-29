import { Board } from '@termiboard/core';

export interface DashboardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
}
