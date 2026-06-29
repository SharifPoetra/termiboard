import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, boards, columns, cards, boardMembers } from './schema.ts';

export * from './schema.ts';

// ==========================================
// 🗄️ DATABASE INFERRED TYPES (From Drizzle Schema)
// ==========================================

// Users Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserResponseData = Omit<User, 'passwordHash' | 'createdAt'> & {
  createdAt: string;
};

// Boards Types
export type Board = InferSelectModel<typeof boards>;
export type NewBoard = InferInsertModel<typeof boards>;

// Columns Types
export type Column = InferSelectModel<typeof columns>;
export type NewColumn = InferInsertModel<typeof columns>;

// Cards Types
export type Card = InferSelectModel<typeof cards>;
export type NewCard = InferInsertModel<typeof cards>;

// Board Members Types
export type BoardMember = InferSelectModel<typeof boardMembers>;
export type NewBoardMember = InferInsertModel<typeof boardMembers>;

// ==========================================
// 📡 GLOBAL API RESPONSE WRAPPER
// ==========================================
export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: T;
}

// ==========================================
// ⚡ SOCKET.IO CONTRACTS (Cross-Platform)
// ==========================================

// Events sent by the Client to the Server (Inbound)
export interface ClientToServerEvents {
  join_board: (boardId: string) => void;
  subscribe_notifications: (userId: string) => void;
}

// Events transmitted by the Server to the Client (Outbound / Broadcast)
export interface ServerToClientEvents {
  // Boards Sync
  board_updated: (board: Board) => void;
  board_deleted: (payload: { id: string }) => void;

  // Members Sync
  invitation_received: (payload: { message: string; data: BoardMember }) => void;
  member_joined: (member: BoardMember) => void;
  member_kicked: (payload: { boardId: string; userId: string }) => void;

  // Columns Sync
  column_created: (column: Column) => void;
  column_updated: (column: Column) => void;
  column_deleted: (column: Column) => void;

  // Cards Sync
  card_created: (card: Card) => void;
  card_moved: (card: Card) => void;
  card_updated: (card: Card) => void;
  card_deleted: (card: Card) => void;
}
