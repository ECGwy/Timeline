import { Task } from '../types';
import { parseDate } from '../utils/dateUtils';

function formatDateDisplay(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface TaskCardProps {
  task: Task;
  left: number;
  onClick: () => void;
  // 任务条描述的定位容器 ref：由 GanttChart 在滚动时动态设置 top，使其始终可见
  labelRef?: (el: HTMLDivElement | null) => void;
}

const priorityStyles = {
  high: {
    bg: 'rgba(239,68,68,0.15)',
    border: 'var(--tl-state-error)',
  },
  medium: {
    bg: 'rgba(245,158,11,0.15)',
    border: 'var(--tl-state-warning)',
  },
  low: {
    bg: 'rgba(16,185,129,0.15)',
    border: 'var(--tl-state-success)',
  },
};

export function TaskCard({ task, left, onClick, labelRef }: TaskCardProps) {
  const style = priorityStyles[task.priority];
  const rowHeight = 64;
  const top = task.startRow * rowHeight + 3;
  const height = (task.endRow - task.startRow + 1) * rowHeight - 6;

  return (
    <div
      className="absolute cursor-pointer transition-all duration-150 task-bar"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: '100px',
        height: `${height}px`,
        background: style.bg,
        borderLeft: `3px solid ${style.border}`,
        borderRadius: 'var(--tl-radius-md)',
      }}
      onClick={onClick}
      title={`${task.title} (${formatDateDisplay(task.startDate)}-${formatDateDisplay(task.endDate)}) ${task.priority === 'high' ? '高优先' : task.priority === 'medium' ? '中优先' : '低优先'}`}
    >
      {/* 描述容器：绝对定位，top 由 GanttChart 在滚动时动态调整，保证条块可见时描述始终可见 */}
      <div
        ref={labelRef}
        className="absolute left-0 right-0 flex flex-col"
        style={{ top: 0, padding: '6px 8px' }}
      >
        <span className="text-xs font-medium text-[var(--tl-foreground)]">{task.title}</span>
        <span className="text-[10px] text-[var(--tl-muted-foreground)] mt-1">{formatDateDisplay(task.startDate)} - {formatDateDisplay(task.endDate)}</span>
        {task.progress !== undefined && task.progress > 0 && (
          <div className="mt-2 w-full bg-[var(--tl-border)] rounded-full h-1">
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: `${task.progress}%`,
                backgroundColor: style.border,
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
