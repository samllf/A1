import { describe, expect, it } from 'vitest';
import type { RevenueRecord } from '../types';
import { calculateKpis, buildHourlyTrend, findDuplicateRevenue, normalizeBatchRows } from '../utils/revenue';
import { getVirtualWindow } from '../utils/virtual';

const makeRecord = (overrides: Partial<RevenueRecord>): RevenueRecord => ({
  id: 'rev-1',
  projectId: 'project-1',
  date: '2026-05-21',
  hour: 12,
  stall: '川湘热菜',
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  midnight: 0,
  takeaway: 0,
  orders: 4,
  createdAt: '2026-05-21T00:00:00.000Z',
  ...overrides
});

describe('revenue utilities', () => {
  it('calculates KPI totals and average ticket', () => {
    const kpis = calculateKpis([makeRecord({ lunch: 120, orders: 4 }), makeRecord({ id: 'rev-2', dinner: 80, orders: 2 })]);

    expect(kpis.totalRevenue).toBe(200);
    expect(kpis.orderCount).toBe(6);
    expect(kpis.avgTicket).toBeCloseTo(33.33, 2);
  });

  it('builds hourly trend with stall details', () => {
    const trend = buildHourlyTrend([
      makeRecord({ stall: 'A档', lunch: 100, takeaway: 0, orders: 5, hour: 11 }),
      makeRecord({ id: 'rev-2', stall: 'B档', lunch: 60, takeaway: 10, orders: 3, hour: 11 })
    ]);

    expect(trend).toHaveLength(24);
    expect(trend[11].amount).toBe(170);
    expect(trend[11].orders).toBe(8);
    expect(trend[11].stalls[0].stall).toBe('A档');
  });

  it('detects duplicate revenue by date and stall', () => {
    const duplicates = findDuplicateRevenue(
      [makeRecord({ id: 'incoming', stall: ' 川湘热菜 ' })],
      [makeRecord({ id: 'existing', stall: '川湘热菜' })]
    );

    expect(duplicates).toEqual(['2026-05-21::川湘热菜']);
  });

  it('validates batch entry rows', () => {
    const result = normalizeBatchRows([
      {
        localId: 'row-1',
        stall: '',
        breakfast: '-1',
        lunch: '12',
        dinner: '',
        midnight: '',
        takeaway: '',
        orders: '1.2'
      }
    ]);

    expect(result.errors).toHaveLength(3);
  });

  it('computes a stable virtual scroll window', () => {
    const win = getVirtualWindow(1500, 960, 420, 48, 4);

    expect(win.start).toBe(16);
    expect(win.end).toBeGreaterThan(win.start);
    expect(win.totalHeight).toBe(72_000);
  });
});
