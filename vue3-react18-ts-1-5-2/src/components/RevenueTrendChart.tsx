import { useMemo } from 'react';
import type { HourTrendPoint } from '../types';
import { formatMoney } from '../utils/date';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useThrottle } from '../hooks/useThrottle';

interface RevenueTrendChartProps {
  data: HourTrendPoint[];
  onHourClick: (point: HourTrendPoint) => void;
}

export const RevenueTrendChart = ({ data, onHourClick }: RevenueTrendChartProps) => {
  const debouncedData = useDebouncedValue(data, 220);
  const throttledClick = useThrottle(onHourClick, 180);

  const chart = useMemo(() => {
    const width = 920;
    const height = 300;
    const padding = { top: 24, right: 24, bottom: 44, left: 64 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const max = Math.max(100, ...debouncedData.map((point) => point.amount));
    const x = (hour: number) => padding.left + (hour / 23) * innerWidth;
    const y = (amount: number) => padding.top + innerHeight - (amount / max) * innerHeight;
    const points = debouncedData.map((point) => `${x(point.hour)},${y(point.amount)}`).join(' ');
    return { width, height, padding, innerWidth, innerHeight, max, x, y, points };
  }, [debouncedData]);

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="今日实时营收趋势">
        <defs>
          <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(20, 184, 166, 0.32)" />
            <stop offset="100%" stopColor="rgba(20, 184, 166, 0.02)" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chart.padding.top + chart.innerHeight * ratio;
          const value = chart.max * (1 - ratio);
          return (
            <g key={ratio}>
              <line className="chart-grid" x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={y} y2={y} />
              <text className="chart-axis" x={10} y={y + 4}>
                {Math.round(value / 1000)}k
              </text>
            </g>
          );
        })}
        <polyline
          points={`${chart.padding.left},${chart.height - chart.padding.bottom} ${chart.points} ${chart.width - chart.padding.right},${chart.height - chart.padding.bottom}`}
          fill="url(#trendGradient)"
          stroke="none"
        />
        <polyline className="chart-line" points={chart.points} fill="none" />
        {debouncedData.map((point) => (
          <g
            key={point.hour}
            className="svg-button"
            role="button"
            tabIndex={0}
            aria-label={`${point.hour}点营收 ${formatMoney(point.amount)}`}
            onClick={() => throttledClick(point)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') throttledClick(point);
            }}
          >
            <circle className="chart-dot" cx={chart.x(point.hour)} cy={chart.y(point.amount)} r="6" />
            {point.hour % 3 === 0 ? (
              <text className="chart-axis" textAnchor="middle" x={chart.x(point.hour)} y={chart.height - 16}>
                {point.hour}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
};
