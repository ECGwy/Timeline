import { TimelineRow } from '../types';
import { parseDate } from '../utils/dateUtils';
import { getMonthGroups } from '../utils/monthGroups';

interface TimelineSidebarProps {
  rows: TimelineRow[];
  todayRowIndex?: number;
}

const ROW_HEIGHT = 64;
const MONTH_LABEL_WIDTH = 76;

export function TimelineSidebar({ rows, todayRowIndex }: TimelineSidebarProps) {
  // 按月份分组，用于渲染跨行月份/年份标签
  const monthGroups = getMonthGroups(rows);

  return (
    <div className="w-[180px] flex-shrink-0 border-r border-[var(--tl-border)] bg-[var(--tl-background)] relative">
      {/* 中轴线 */}
      <div
        className="absolute top-0 bottom-0 w-[2px] z-20"
        style={{ left: '144px', background: 'rgba(79,70,229,0.3)' }}
      ></div>

      {/* 月份标签：定位在该月首行（1日）处。一月显示「年份+月份」，其他月仅显示「月份」 */}
      {monthGroups.map((group) => {
        const isJanuary = group.month === 1;
        return (
          <div
            key={`${group.year}-${group.month}`}
            className="absolute left-0 flex items-start justify-center text-xs font-semibold text-[var(--tl-foreground)] bg-[var(--tl-background)] border-r border-[var(--tl-border)] z-10"
            style={{
              top: `${group.startIndex * ROW_HEIGHT}px`,
              height: `${group.count * ROW_HEIGHT}px`,
              width: `${MONTH_LABEL_WIDTH}px`,
              paddingTop: '22px',
            }}
          >
            <span className="px-1 text-center leading-tight">
              {isJanuary ? `${group.year}年${group.month}月` : `${group.month}月`}
            </span>
          </div>
        );
      })}

      {rows.map((row, index) => {
        const isToday = index === todayRowIndex;
        const d = parseDate(row.date);
        return (
          <div
            key={row.id}
            className="h-[64px] relative flex items-center"
            style={{
              background: isToday
                ? 'rgba(79,70,229,0.15)'
                : (row.isOdd ? 'var(--tl-muted)' : undefined),
              borderLeft: isToday ? '3px solid var(--tl-primary)' : undefined,
            }}
          >
            <span
              className={`absolute text-xs leading-none ${isToday ? 'text-[var(--tl-primary)] font-medium' : 'text-[var(--tl-muted-foreground)]'}`}
              style={{ left: `${MONTH_LABEL_WIDTH + 12}px` }}
            >
              {d.getDate()}日
              {isToday && <span className="ml-1">今天</span>}
            </span>
            <div
              className="absolute w-3 h-3 rounded-full cursor-pointer transition-transform duration-150 hover:scale-150"
              style={{
                left: '138px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: isToday ? 'var(--tl-primary)' : 'rgba(79,70,229,0.3)',
                boxShadow: isToday ? '0 0 8px var(--tl-primary)' : undefined,
              }}
              title={isToday ? '今天' : `第${index + 1}行`}
            ></div>
          </div>
        );
      })}
    </div>
  );
}
