import { useState, useEffect, useMemo } from 'react';
import { X, Calendar } from 'lucide-react';
import { Event } from '../types';

interface AddEventModalProps {
  onClose: () => void;
  onAdd: (title: string, date: string) => void;
  onEdit: (id: string, title: string, date: string) => void;
  editingEvent?: Event | null;
}

export function AddEventModal({ onClose, onAdd, onEdit, editingEvent }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());

  // 年份范围：当前年份前后5年
  const years = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const days = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [year, month]);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      const [y, m, d] = editingEvent.date.split('-').map(Number);
      setYear(y);
      setMonth(m);
      setDay(d);
    } else {
      setTitle('');
      setYear(today.getFullYear());
      setMonth(today.getMonth() + 1);
      setDay(today.getDate());
    }
  }, [editingEvent]);

  // 确保日期不超过当月最大天数
  useEffect(() => {
    const maxDay = new Date(year, month, 0).getDate();
    if (day > maxDay) {
      setDay(maxDay);
    }
  }, [year, month, day]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (editingEvent) {
        onEdit(editingEvent.id, title.trim(), dateStr);
      } else {
        onAdd(title.trim(), dateStr);
      }
      onClose();
    }
  };

  const isEditing = !!editingEvent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose}></div>
      <div
        className="relative bg-[var(--tl-card)] rounded-lg shadow-xl w-full max-w-md border border-[var(--tl-border)]"
        style={{ background: 'var(--tl-card)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--tl-border)]">
          <h2 className="text-lg font-semibold text-[var(--tl-card-foreground)]">
            {isEditing ? '编辑事项' : '添加事项'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--tl-muted)] transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-[var(--tl-muted-foreground)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
              事项名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入事项名称"
              className="w-full px-3 py-2 rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] placeholder:text-[var(--tl-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              选择日期
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-2 rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="px-3 py-2 rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}日</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-[var(--tl-card-foreground)] bg-[var(--tl-muted)] hover:bg-[var(--tl-border)] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--tl-primary)] hover:opacity-90 transition-opacity"
            >
              {isEditing ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}