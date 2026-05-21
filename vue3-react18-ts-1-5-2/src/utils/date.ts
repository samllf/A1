export const toISODate = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
};

export const todayISO = (): string => toISODate(new Date());

export const addDays = (date: string, days: number): string => {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return toISODate(next);
};

export const isWithinRange = (date: string, start: string, end: string): boolean => {
  return date >= start && date <= end;
};

export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('zh-CN').format(value);
};
