export interface VirtualWindow {
  start: number;
  end: number;
  offsetTop: number;
  totalHeight: number;
}

export const getVirtualWindow = (
  total: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  overscan = 8
): VirtualWindow => {
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(total, start + visibleCount + overscan * 2);

  return {
    start,
    end,
    offsetTop: start * rowHeight,
    totalHeight: total * rowHeight
  };
};
