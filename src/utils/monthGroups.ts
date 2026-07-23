import { TimelineRow } from '../types';
import { parseDate } from './dateUtils';

export interface MonthGroup {
  year: number;
  month: number;
  startIndex: number;
  count: number;
}

/**
 * 把连续日期行按 (年, 月) 分组，返回每个分组的起始行与行数。
 * 用于侧边栏跨行月份标签。
 */
export function getMonthGroups(rows: TimelineRow[]): MonthGroup[] {
  return rows.reduce<MonthGroup[]>((groups, row, index) => {
    const d = parseDate(row.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const last = groups[groups.length - 1];
    if (last && last.year === year && last.month === month) {
      last.count += 1;
    } else {
      groups.push({ year, month, startIndex: index, count: 1 });
    }
    return groups;
  }, []);
}

/**
 * 根据竖向滚动偏移量，计算当前应主导显示的月份分组下标。
 * 规则：某月份的「1 日」滚过滚动区顶部（startIndex*rowHeight <= scrollTop）即成为主导月份。
 * 该值用于侧边栏顶部固定块显示「当前年份+月份」（对应第二列顶部时间）。
 */
export function getActiveMonthIndex(groups: MonthGroup[], scrollTop: number, rowHeight: number): number {
  if (!groups.length) return 0;
  let idx = 0;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].startIndex * rowHeight <= scrollTop) {
      idx = i;
    } else {
      break;
    }
  }
  return idx;
}
