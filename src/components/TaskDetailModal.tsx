import { X, User, Calendar, AlertCircle, Edit3 } from 'lucide-react';
import { Task } from '../types';
import { parseDate } from '../utils/dateUtils';

function formatDateDisplay(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
}

const priorityLabels = {
  high: { text: '高优先级', color: 'var(--tl-state-error)', bg: 'rgba(239,68,68,0.15)' },
  medium: { text: '中优先级', color: 'var(--tl-state-warning)', bg: 'rgba(245,158,11,0.15)' },
  low: { text: '低优先级', color: 'var(--tl-state-success)', bg: 'rgba(16,185,129,0.15)' },
};

export function TaskDetailModal({ task, onClose, onEdit }: TaskDetailModalProps) {
  const priority = priorityLabels[task.priority];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>
      <div 
        className="relative bg-[var(--tl-card)] rounded-lg shadow-xl w-full max-w-md border border-[var(--tl-border)] animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--tl-card)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--tl-border)]">
          <h2 className="text-lg font-semibold text-[var(--tl-card-foreground)]">{task.title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--tl-muted)] transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-[var(--tl-muted-foreground)]" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: priority.color }} />
            <span 
              className="px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ color: priority.color, background: priority.bg }}
            >
              {priority.text}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[var(--tl-muted-foreground)]">
            <Calendar className="w-4 h-4" />
            <span>{formatDateDisplay(task.startDate)} - {formatDateDisplay(task.endDate)}</span>
          </div>
          
          {task.assignee && (
            <div className="flex items-center gap-2 text-sm text-[var(--tl-muted-foreground)]">
              <User className="w-4 h-4" />
              <span>负责人：{task.assignee}</span>
            </div>
          )}
          
          {task.description && (
            <div>
              <p className="text-sm text-[var(--tl-muted-foreground)] mb-1">描述</p>
              <p className="text-sm text-[var(--tl-card-foreground)] bg-[var(--tl-muted)] p-3 rounded-md">
                {task.description}
              </p>
            </div>
          )}
          
          {task.progress !== undefined && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[var(--tl-muted-foreground)]">进度</span>
                <span className="text-[var(--tl-card-foreground)] font-medium">{task.progress}%</span>
              </div>
              <div className="w-full bg-[var(--tl-border)] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${task.progress}%`,
                    backgroundColor: priority.color,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 p-4 border-t border-[var(--tl-border)]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-[var(--tl-card-foreground)] bg-[var(--tl-muted)] hover:bg-[var(--tl-border)] transition-colors"
          >
            关闭
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--tl-primary)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            编辑任务
          </button>
        </div>
      </div>
    </div>
  );
}
