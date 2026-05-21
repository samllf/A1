import { FormEvent, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { LoadingPanel } from '../components/LoadingPanel';
import { setUnsavedChanges } from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { saveBatchRevenue } from '../store/revenueSlice';
import type { BatchEntryRow, MealKey } from '../types';
import { todayISO } from '../utils/date';
import { mealKeys, mealLabels, normalizeBatchRows } from '../utils/revenue';

const makeRow = (): BatchEntryRow => ({
  localId: `row-${Date.now()}-${Math.random()}`,
  stall: '',
  breakfast: '',
  lunch: '',
  dinner: '',
  midnight: '',
  takeaway: '',
  orders: ''
});

export const BatchEntryPage = () => {
  const dispatch = useAppDispatch();
  const selectedProjectId = useAppSelector((state) => state.projects.selectedProjectId);
  const { saving, error } = useAppSelector((state) => state.revenue);
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<BatchEntryRow[]>([makeRow()]);
  const [errors, setErrors] = useState<string[]>([]);

  const totals = useMemo(() => {
    const normalized = normalizeBatchRows(rows).values;
    return normalized.reduce(
      (summary, row) => ({
        amount: summary.amount + mealKeys.reduce((sum, key) => sum + (Number.isFinite(row[key]) ? row[key] : 0), 0),
        orders: summary.orders + (Number.isFinite(row.orders) ? row.orders : 0)
      }),
      { amount: 0, orders: 0 }
    );
  }, [rows]);

  const markDirty = () => dispatch(setUnsavedChanges(true));

  const updateRow = (id: string, field: keyof BatchEntryRow, value: string) => {
    setRows((current) => current.map((row) => (row.localId === id ? { ...row, [field]: value } : row)));
    markDirty();
  };

  const addRow = () => {
    setRows((current) => [...current, makeRow()]);
    markDirty();
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.localId !== id)));
    markDirty();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setErrors(['请先选择项目']);
      return;
    }

    const normalized = normalizeBatchRows(rows);
    if (normalized.errors.length) {
      setErrors(normalized.errors);
      return;
    }

    try {
      await dispatch(saveBatchRevenue({ projectId: selectedProjectId, date, rows: normalized.values })).unwrap();
      setRows([makeRow()]);
      setErrors([]);
      dispatch(setUnsavedChanges(false));
    } catch (error) {
      console.warn('批量录入失败', error);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">批量营收录入</p>
          <h1>动态录入表</h1>
        </div>
        <button className="button button--primary" type="button" onClick={addRow}>
          <Plus size={18} />
          增加行
        </button>
      </div>

      <LoadingPanel error={error}>
        <form className="entry-form" onSubmit={submit}>
          <div className="entry-meta">
            <label className="field">
              <span>入账日期</span>
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  markDirty();
                }}
              />
            </label>
            <div className="summary-strip">
              <span>当前合计金额：¥{Math.round(totals.amount).toLocaleString('zh-CN')}</span>
              <span>当前合计订单：{totals.orders.toLocaleString('zh-CN')}</span>
            </div>
          </div>

          {errors.length ? (
            <div className="form-errors" role="alert">
              {errors.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}

          <div className="entry-table-wrap">
            <table className="data-table entry-table">
              <thead>
                <tr>
                  <th>档口</th>
                  {mealKeys.map((key) => (
                    <th key={key}>{mealLabels[key]}</th>
                  ))}
                  <th>订单数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.localId}>
                    <td>
                      <input value={row.stall} placeholder="如：川湘热菜" onChange={(event) => updateRow(row.localId, 'stall', event.target.value)} />
                    </td>
                    {mealKeys.map((key) => (
                      <td key={key}>
                        <input
                          type="number"
                          min="0"
                          value={row[key]}
                          onChange={(event) => updateRow(row.localId, key as MealKey, event.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <input type="number" min="0" value={row.orders} onChange={(event) => updateRow(row.localId, 'orders', event.target.value)} />
                    </td>
                    <td>
                      <button className="icon-button icon-button--danger" type="button" title="删除行" onClick={() => removeRow(row.localId)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="form-footer">
            <button className="button button--secondary" type="button" onClick={addRow}>
              <Plus size={18} />
              继续增加
            </button>
            <button className="button button--primary" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? '提交中...' : '一次性提交保存'}
            </button>
          </footer>
        </form>
      </LoadingPanel>
    </section>
  );
};
