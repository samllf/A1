import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Clock3, Maximize2, ReceiptText } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { LoadingPanel } from '../components/LoadingPanel';
import { Modal } from '../components/Modal';
import { RevenueTrendChart } from '../components/RevenueTrendChart';
import { VirtualRevenueList } from '../components/VirtualRevenueList';
import { setBigScreen } from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchRevenue, fetchTodayRevenue } from '../store/revenueSlice';
import type { HourTrendPoint } from '../types';
import { addDays, formatMoney, formatNumber, todayISO } from '../utils/date';
import { buildHourlyTrend, calculateKpis } from '../utils/revenue';

export const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const selectedProjectId = useAppSelector((state) => state.projects.selectedProjectId);
  const bigScreen = useAppSelector((state) => state.app.bigScreen);
  const { records, todayRecords, loading, error } = useAppSelector((state) => state.revenue);
  const [selectedHour, setSelectedHour] = useState<HourTrendPoint | null>(null);

  const refresh = useCallback(() => {
    if (!selectedProjectId) return;
    const today = todayISO();
    dispatch(fetchTodayRevenue(selectedProjectId));
    dispatch(fetchRevenue({ projectId: selectedProjectId, start: addDays(today, -60), end: today }));
  }, [dispatch, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return undefined;
    const today = todayISO();
    const todayRequest = dispatch(fetchTodayRevenue(selectedProjectId));
    const rangeRequest = dispatch(fetchRevenue({ projectId: selectedProjectId, start: addDays(today, -60), end: today }));
    return () => {
      todayRequest.abort();
      rangeRequest.abort();
    };
  }, [dispatch, selectedProjectId]);

  useEffect(() => {
    const interval = window.setInterval(refresh, bigScreen ? 5000 : 10_000);
    return () => window.clearInterval(interval);
  }, [bigScreen, refresh]);

  const kpis = useMemo(() => calculateKpis(todayRecords), [todayRecords]);
  const trend = useMemo(() => buildHourlyTrend(todayRecords), [todayRecords]);
  const toggleDashboardBigScreen = async () => {
    if (!bigScreen) {
      dispatch(setBigScreen(true));
      await document.documentElement.requestFullscreen?.().catch(() => undefined);
      return;
    }
    await document.exitFullscreen?.().catch(() => undefined);
    dispatch(setBigScreen(false));
  };

  return (
    <section className="page dashboard-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">实时营收看板</p>
          <h1>今日运营态势</h1>
        </div>
        <button className="button button--secondary" type="button" onClick={toggleDashboardBigScreen}>
          <Maximize2 size={18} />
          {bigScreen ? '退出大屏' : '大屏模式'}
        </button>
      </div>

      <div className="kpi-grid">
        <KpiCard label="今日累计营收" value={formatMoney(kpis.totalRevenue)} icon={<Banknote size={22} />} tone="green" />
        <KpiCard label="今日订单数" value={formatNumber(kpis.orderCount)} icon={<ReceiptText size={22} />} tone="blue" />
        <KpiCard label="客单价" value={formatMoney(kpis.avgTicket)} icon={<Clock3 size={22} />} tone="amber" />
      </div>

      <LoadingPanel loading={loading && !records.length} error={error} onRetry={refresh}>
        <section className="panel chart-panel">
          <div className="panel__header">
            <div>
              <h2>0-23 点实时趋势</h2>
              <span>实时更新中</span>
            </div>
            <button className="button button--secondary" type="button" onClick={refresh}>
              手动刷新
            </button>
          </div>
          <RevenueTrendChart data={trend} onHourClick={setSelectedHour} />
        </section>

        <VirtualRevenueList records={records} />
      </LoadingPanel>

      {selectedHour ? (
        <Modal title={`${selectedHour.hour}:00 档口营收明细`} onClose={() => setSelectedHour(null)}>
          {selectedHour.stalls.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>档口</th>
                  <th>金额</th>
                  <th>订单</th>
                </tr>
              </thead>
              <tbody>
                {selectedHour.stalls.map((stall) => (
                  <tr key={stall.stall}>
                    <td>{stall.stall}</td>
                    <td>{formatMoney(stall.amount)}</td>
                    <td>{stall.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-copy">该小时暂无营收记录</p>
          )}
        </Modal>
      ) : null}
    </section>
  );
};
