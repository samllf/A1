import type { BatchEntryRow, BatchRevenueInput, HourTrendPoint, KpiSummary, MealKey, RevenueRecord } from '../types';

export const mealKeys: MealKey[] = ['breakfast', 'lunch', 'dinner', 'midnight', 'takeaway'];

export const mealLabels: Record<MealKey, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  midnight: '夜宵',
  takeaway: '外卖'
};

export const recordAmount = (record: Pick<RevenueRecord, MealKey>): number => {
  return mealKeys.reduce((sum, key) => sum + Number(record[key] || 0), 0);
};

export const calculateKpis = (records: RevenueRecord[]): KpiSummary => {
  const totalRevenue = records.reduce((sum, record) => sum + recordAmount(record), 0);
  const orderCount = records.reduce((sum, record) => sum + record.orders, 0);
  return {
    totalRevenue,
    orderCount,
    avgTicket: orderCount ? totalRevenue / orderCount : 0
  };
};

export const buildHourlyTrend = (records: RevenueRecord[]): HourTrendPoint[] => {
  return Array.from({ length: 24 }, (_, hour) => {
    const byStall = new Map<string, { stall: string; amount: number; orders: number }>();
    let amount = 0;
    let orders = 0;

    records
      .filter((record) => record.hour === hour)
      .forEach((record) => {
        const value = recordAmount(record);
        amount += value;
        orders += record.orders;
        const current = byStall.get(record.stall) ?? { stall: record.stall, amount: 0, orders: 0 };
        current.amount += value;
        current.orders += record.orders;
        byStall.set(record.stall, current);
      });

    return {
      hour,
      amount,
      orders,
      stalls: Array.from(byStall.values()).sort((a, b) => b.amount - a.amount)
    };
  });
};

export const duplicateKey = (record: Pick<RevenueRecord, 'date' | 'stall'>): string => {
  return `${record.date}::${record.stall.trim().toLowerCase()}`;
};

export const findDuplicateRevenue = (incoming: RevenueRecord[], existing: RevenueRecord[]): string[] => {
  const existingKeys = new Set(existing.map(duplicateKey));
  const incomingKeys = new Set<string>();
  const duplicates = new Set<string>();
  incoming.forEach((record) => {
    const key = duplicateKey(record);
    if (existingKeys.has(key) || incomingKeys.has(key)) {
      duplicates.add(key);
    }
    incomingKeys.add(key);
  });
  return Array.from(duplicates);
};

export const normalizeBatchRows = (rows: BatchEntryRow[]): { values: BatchRevenueInput[]; errors: string[] } => {
  const errors: string[] = [];
  const values: BatchRevenueInput[] = [];

  rows.forEach((row, index) => {
    const label = `第 ${index + 1} 行`;
    const stall = row.stall.trim();
    const parsedMeals = Object.fromEntries(
      mealKeys.map((key) => [key, Number(row[key] === '' ? 0 : row[key])])
    ) as Record<MealKey, number>;
    const orders = Number(row.orders);

    if (!stall) errors.push(`${label}：档口不能为空`);
    mealKeys.forEach((key) => {
      if (!Number.isFinite(parsedMeals[key]) || parsedMeals[key] < 0) {
        errors.push(`${label}：${mealLabels[key]}金额必须是非负数字`);
      }
    });
    if (!Number.isInteger(orders) || orders < 0) {
      errors.push(`${label}：订单数必须是非负整数`);
    }

    values.push({
      stall,
      breakfast: parsedMeals.breakfast,
      lunch: parsedMeals.lunch,
      dinner: parsedMeals.dinner,
      midnight: parsedMeals.midnight,
      takeaway: parsedMeals.takeaway,
      orders
    });
  });

  return { values, errors };
};
