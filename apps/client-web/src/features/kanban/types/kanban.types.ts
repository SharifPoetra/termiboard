export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: string;
  createdAt: string;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  content: string;
  position: string;
  createdAt: string;
}
