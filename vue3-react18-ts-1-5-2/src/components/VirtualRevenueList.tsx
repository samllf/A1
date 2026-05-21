import { useMemo, useRef, useState } from 'react';
import type { RevenueRecord } from '../types';
import { formatMoney } from '../utils/date';
import { recordAmount } from '../utils/revenue';
import { getVirtualWindow } from '../utils/virtual';

interface VirtualRevenueListProps {
  records: RevenueRecord[];
}

const rowHeight = 48;
const viewportHeight = 420;

export const VirtualRevenueList = ({ records }: VirtualRevenueListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const useVirtual = records.length > 1000;

  const virtual = useMemo(
    () => getVirtualWindow(records.length, scrollTop, viewportHeight, rowHeight),
    [records.length, scrollTop]
  );

  const visibleRecords = useVirtual ? records.slice(virtual.start, virtual.end) : records;
  const header = (
    <thead>
      <tr>
        <th>日期</th>
        <th>小时</th>
        <th>档口</th>
        <th>金额</th>
        <th>订单</th>
      </tr>
    </thead>
  );
  const body = (
    <tbody>
      {visibleRecords.map((record) => (
        <tr key={record.id} style={useVirtual ? { height: rowHeight } : undefined}>
          <td>{record.date}</td>
          <td>{record.hour}:00</td>
          <td>{record.stall}</td>
          <td>{formatMoney(recordAmount(record))}</td>
          <td>{record.orders}</td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div className="table-panel">
      <div className="table-panel__header">
        <strong>营收明细</strong>
        <span>共 {records.length} 条</span>
      </div>
      {useVirtual ? (
        <>
          <table className="data-table virtual-head">{header}</table>
          <div ref={viewportRef} className="virtual-list" style={{ height: viewportHeight }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
            <div style={{ height: virtual.totalHeight, position: 'relative' }}>
              <table className="data-table virtual-table" style={{ top: virtual.offsetTop }}>
                {body}
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="simple-list">
          <table className="data-table">
            {header}
            {body}
          </table>
        </div>
      )}
    </div>
  );
};
