import { X, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Event, TimelineRow } from '../types';

interface EventDetailModalProps {
  event: Event;
  rows: TimelineRow[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventDetailModal({ event, rows, onClose, onEdit, onDelete }: EventDetailModalProps) {
  const row = rows.find(r => r.date === event.date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose}></div>
      <div
        className="relative bg-[var(--tl-card)] rounded-lg shadow-xl w-full max-w-md border border-[var(--tl-border)]"
        style={{ background: 'var(--tl-card)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--tl-border)]">
          <h2 className="text-lg font-semibold text-[var(--tl-card-foreground)]">事项详情</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--tl-muted)] transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-[var(--tl-muted-foreground)]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-[var(--tl-muted-foreground)] mb-1">事项名称</p>
            <p className="text-lg font-semibold text-[var(--tl-card-foreground)]">
              {event.title}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--tl-muted-foreground)]">
            <Calendar className="w-4 h-4" />
            <span>
              {row?.year ? `${row.year}年` : ''}
              {row?.month ? `${row.month}月` : ''}
              {row?.day}日
            </span>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-[var(--tl-border)]">
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-[var(--tl-state-error)] bg-[var(--tl-state-error)]/10 hover:bg-[var(--tl-state-error)]/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
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
            编辑
          </button>
        </div>
      </div>
    </div>
  );
}
