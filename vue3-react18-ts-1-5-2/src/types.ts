export type ProjectStatus = 'preparing' | 'active' | 'paused' | 'closed';

export type PageKey = 'dashboard' | 'projects' | 'entry' | 'data';

export type ImportMode = 'append' | 'overwrite';

export type DuplicateResolution = 'append' | 'overwrite' | 'cancel';

export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'midnight' | 'takeaway';

export interface Project {
  id: string;
  name: string;
  location: string;
  date: string;
  status: ProjectStatus;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  location: string;
  date: string;
  status: ProjectStatus;
}

export interface RevenueRecord {
  id: string;
  projectId: string;
  date: string;
  hour: number;
  stall: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  midnight: number;
  takeaway: number;
  orders: number;
  createdAt: string;
}

export interface BatchEntryRow {
  localId: string;
  stall: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  midnight: string;
  takeaway: string;
  orders: string;
}

export interface BatchRevenueInput {
  stall: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  midnight: number;
  takeaway: number;
  orders: number;
}

export interface HourTrendPoint {
  hour: number;
  amount: number;
  orders: number;
  stalls: Array<{
    stall: string;
    amount: number;
    orders: number;
  }>;
}

export interface KpiSummary {
  totalRevenue: number;
  orderCount: number;
  avgTicket: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RevenueQuery {
  projectId: string;
  start: string;
  end: string;
}

export interface SyncMessage {
  type: 'projects:changed' | 'revenue:changed';
  projectId?: string;
  at: string;
}
