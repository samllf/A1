import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileUp, RefreshCw } from 'lucide-react';
import { LoadingPanel } from '../components/LoadingPanel';
import { Modal } from '../components/Modal';
import { VirtualRevenueList } from '../components/VirtualRevenueList';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchRevenue, importRevenue } from '../store/revenueSlice';
import type { DuplicateResolution, ImportMode, RevenueRecord } from '../types';
import { addDays, todayISO } from '../utils/date';
import { excelRowsToRevenue, revenueToExcelRows } from '../utils/excel';
import { findDuplicateRevenue } from '../utils/revenue';

export const DataPage = () => {
  const dispatch = useAppDispatch();
  const selectedProjectId = useAppSelector((state) => state.projects.selectedProjectId);
  const { records, loading, saving, error } = useAppSelector((state) => state.revenue);
  const [start, setStart] = useState(addDays(todayISO(), -60));
  const [end, setEnd] = useState(todayISO());
  const [mode, setMode] = useState<ImportMode>('append');
  const [pendingImport, setPendingImport] = useState<RevenueRecord[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);

  const refresh = useCallback(() => {
    if (selectedProjectId) dispatch(fetchRevenue({ projectId: selectedProjectId, start, end }));
  }, [dispatch, end, selectedProjectId, start]);

  useEffect(() => {
    if (!selectedProjectId) return undefined;
    const request = dispatch(fetchRevenue({ projectId: selectedProjectId, start, end }));
    return () => request.abort();
  }, [dispatch, end, selectedProjectId, start]);

  const fileName = useMemo(() => `团餐营收_${selectedProjectId || 'project'}_${start}_${end}.xlsx`, [end, selectedProjectId, start]);

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(revenueToExcelRows(records));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '营收明细');
    XLSX.writeFile(workbook, fileName);
  };

  const executeImport = async (resolution: DuplicateResolution) => {
    if (resolution === 'cancel' || !selectedProjectId) {
      setPendingImport([]);
      setDuplicates([]);
      return;
    }
    try {
      await dispatch(importRevenue({ projectId: selectedProjectId, records: pendingImport, mode: resolution })).unwrap();
      setPendingImport([]);
      setDuplicates([]);
      refresh();
    } catch (error) {
      console.warn('导入失败', error);
    }
  };

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedProjectId) return;

    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
    const incoming = excelRowsToRevenue(rows, selectedProjectId).filter((record) => record.projectId === selectedProjectId);
    const duplicateKeys = findDuplicateRevenue(incoming, records);

    if (!incoming.length) {
      alert('未识别到有效营收数据，请检查表头是否包含：日期、小时、档口、早餐、午餐、晚餐、夜宵、外卖、订单数');
      return;
    }

    if (duplicateKeys.length) {
      setPendingImport(incoming);
      setDuplicates(duplicateKeys);
      return;
    }

    try {
      await dispatch(importRevenue({ projectId: selectedProjectId, records: incoming, mode })).unwrap();
      refresh();
    } catch (error) {
      console.warn('导入失败', error);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">导入导出</p>
          <h1>营收数据中心</h1>
        </div>
        <button className="button button--secondary" type="button" onClick={refresh}>
          <RefreshCw size={18} />
          刷新
        </button>
      </div>

      <div className="toolbar toolbar--wrap">
        <label className="field field--inline">
          <span>开始</span>
          <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
        </label>
        <label className="field field--inline">
          <span>结束</span>
          <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        </label>
        <label className="field field--inline">
          <span>导入模式</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as ImportMode)}>
            <option value="append">追加</option>
            <option value="overwrite">覆盖重复项</option>
          </select>
        </label>
        <button className="button button--primary" type="button" onClick={exportExcel} disabled={!records.length}>
          <Download size={18} />
          导出 Excel
        </button>
        <label className="button button--secondary file-button">
          <FileUp size={18} />
          {saving ? '导入中...' : '导入 Excel'}
          <input type="file" accept=".xlsx,.xls" onChange={onImportFile} disabled={saving} />
        </label>
      </div>

      <LoadingPanel loading={loading && !records.length} error={error} onRetry={refresh}>
        <VirtualRevenueList records={records} />
      </LoadingPanel>

      {duplicates.length ? (
        <Modal
          title="发现重复营收记录"
          onClose={() => executeImport('cancel')}
          footer={
            <>
              <button className="button button--secondary" type="button" onClick={() => executeImport('cancel')}>
                取消导入
              </button>
              <button className="button button--secondary" type="button" onClick={() => executeImport('append')}>
                仍然追加
              </button>
              <button className="button button--primary" type="button" onClick={() => executeImport('overwrite')}>
                覆盖重复项
              </button>
            </>
          }
        >
          <p>检测到 {duplicates.length} 个“同一天 + 同档口”的重复项，请选择处理方式。</p>
          <div className="duplicate-list">
            {duplicates.slice(0, 12).map((item) => (
              <span key={item}>{item.replace('::', ' / ')}</span>
            ))}
            {duplicates.length > 12 ? <span>还有 {duplicates.length - 12} 项...</span> : null}
          </div>
        </Modal>
      ) : null}
    </section>
  );
};
