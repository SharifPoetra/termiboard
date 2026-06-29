import { UserResponseData } from '@termiboard/core';

export interface AuthState {
  user: UserResponseData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
