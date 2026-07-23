export type Priority = 'high' | 'medium' | 'low';

export interface TimelineRow {
  id: string;
  year?: number;
  month?: number;
  day: number;
  isOdd: boolean;
  date: string; // YYYY-MM-DD 格式
}

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD 格式
  rowIndex: number; // 动态计算
  column: number; // 动态计算，避免重叠
}

export interface Task {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD 格式
  endDate: string; // YYYY-MM-DD 格式
  priority: Priority;
  startRow: number; // 动态计算
  endRow: number; // 动态计算
  column: number;
  description?: string;
  assignee?: string;
  progress?: number;
}

export interface ThemeState {
  isDark: boolean;
}
