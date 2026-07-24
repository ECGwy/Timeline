import { TimelineRow } from '../types';

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function generateDateRange(startDate: Date, endDate: Date): TimelineRow[] {
  const rows: TimelineRow[] = [];
  let currentDate = new Date(startDate);
  let id = 1;
  let lastYear: number | undefined;
  let lastMonth: number | undefined;

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const isOdd = rows.length % 2 === 1;

    rows.push({
      id: String(id++),
      year: year !== lastYear ? year : undefined,
      month: month !== lastMonth ? month : undefined,
      day,
      isOdd,
      date: formatDate(currentDate),
    });

    lastYear = year;
    lastMonth = month;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return rows;
}

export function findRowIndex(rows: TimelineRow[], dateStr: string): number {
  return rows.findIndex(row => row.date === dateStr);
}
