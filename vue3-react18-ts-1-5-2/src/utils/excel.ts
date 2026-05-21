import type { RevenueRecord } from '../types';
import { recordAmount } from './revenue';

export interface ExcelRevenueRow {
  项目ID: string;
  日期: string;
  小时: number;
  档口: string;
  早餐: number;
  午餐: number;
  晚餐: number;
  夜宵: number;
  外卖: number;
  订单数: number;
  总金额: number;
}

export const revenueToExcelRows = (records: RevenueRecord[]): ExcelRevenueRow[] => {
  return records.map((record) => ({
    项目ID: record.projectId,
    日期: record.date,
    小时: record.hour,
    档口: record.stall,
    早餐: record.breakfast,
    午餐: record.lunch,
    晚餐: record.dinner,
    夜宵: record.midnight,
    外卖: record.takeaway,
    订单数: record.orders,
    总金额: recordAmount(record)
  }));
};

export const excelRowsToRevenue = (rows: Record<string, unknown>[], fallbackProjectId: string): RevenueRecord[] => {
  const now = new Date().toISOString();

  return rows
    .map((row, index) => ({
      id: `import-${Date.now()}-${index}`,
      projectId: String(row['项目ID'] || fallbackProjectId),
      date: String(row['日期'] || ''),
      hour: Number(row['小时'] ?? new Date().getHours()),
      stall: String(row['档口'] || '').trim(),
      breakfast: Number(row['早餐'] ?? 0),
      lunch: Number(row['午餐'] ?? 0),
      dinner: Number(row['晚餐'] ?? 0),
      midnight: Number(row['夜宵'] ?? 0),
      takeaway: Number(row['外卖'] ?? 0),
      orders: Number(row['订单数'] ?? 0),
      createdAt: now
    }))
    .filter((record) => record.date && record.stall && Number.isInteger(record.hour) && record.hour >= 0 && record.hour <= 23);
};
