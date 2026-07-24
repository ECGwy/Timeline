import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, FileText, Gauge } from 'lucide-react';
import { Priority, Task } from '../types';

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (
    title: string,
    startDate: string,
    endDate: string,
    priority: Priority,
    assignee: string,
    description: string,
    progress: number
  ) => void;
  onEdit: (
    id: string,
    title: string,
    startDate: string,
    endDate: string,
    priority: Priority,
    assignee: string,
    description: string,
    progress: number
  ) => void;
  editingTask?: Task | null;
}

export function AddTaskModal({ onClose, onAdd, onEdit, editingTask }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);

  const today = new Date();
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [startMonth, setStartMonth] = useState(today.getMonth() + 1);
  const [startDay, setStartDay] = useState(today.getDate());
  const [endYear, setEndYear] = useState(today.getFullYear());
  const [endMonth, setEndMonth] = useState(today.getMonth() + 1);
  const [endDay, setEndDay] = useState(today.getDate() + 7);

  const years = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const startDays = useMemo(() => {
    const daysInMonth = new Date(startYear, startMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [startYear, startMonth]);

  const endDays = useMemo(() => {
    const daysInMonth = new Date(endYear, endMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [endYear, endMonth]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setPriority(editingTask.priority);
      setAssignee(editingTask.assignee || '');
      setDescription(editingTask.description || '');
      setProgress(editingTask.progress ?? 0);
      const [sy, sm, sd] = editingTask.startDate.split('-').map(Number);
      const [ey, em, ed] = editingTask.endDate.split('-').map(Number);
      setStartYear(sy);
      setStartMonth(sm);
      setStartDay(sd);
      setEndYear(ey);
      setEndMonth(em);
      setEndDay(ed);
    } else {
      setTitle('');
      setPriority('medium');
      setAssignee('');
      setDescription('');
      setProgress(0);
      setStartYear(today.getFullYear());
      setStartMonth(today.getMonth() + 1);
      setStartDay(today.getDate());
      setEndYear(today.getFullYear());
      setEndMonth(today.getMonth() + 1);
      setEndDay(Math.min(today.getDate() + 7, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()));
    }
  }, [editingTask]);

  useEffect(() => {
    const maxDay = new Date(startYear, startMonth, 0).getDate();
    if (startDay > maxDay) setStartDay(maxDay);
  }, [startYear, startMonth, startDay]);

  useEffect(() => {
    const maxDay = new Date(endYear, endMonth, 0).getDate();
    if (endDay > maxDay) setEndDay(maxDay);
  }, [endYear, endMonth, endDay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const startDateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      const endDateStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      
      // 确保 startDate <= endDate
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      const finalStartDate = startDate <= endDate ? startDateStr : endDateStr;
      const finalEndDate = startDate <= endDate ? endDateStr : startDateStr;

      if (editingTask) {
        onEdit(editingTask.id, title.trim(), finalStartDate, finalEndDate, priority, assignee.trim(), description.trim(), progress);
      } else {
        onAdd(title.trim(), finalStartDate, finalEndDate, priority, assignee.trim(), description.trim(), progress);
      }
      onClose();
    }
  };

  const isEditing = !!editingTask;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose}></div>
      <div
        className="relative bg-[var(--tl-card)] rounded-lg shadow-xl w-full max-w-lg border border-[var(--tl-border)] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--tl-card)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--tl-border)] sticky top-0 bg-[var(--tl-card)]">
          <h2 className="text-lg font-semibold text-[var(--tl-card-foreground)]">
            {isEditing ? '编辑任务' : '添加任务'}
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
              任务名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务名称"
              className="w-full px-3 py-2 rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] placeholder:text-[var(--tl-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                开始日期
              </label>
              <div className="grid grid-cols-3 gap-1">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <select
                  value={startDay}
                  onChange={(e) => setStartDay(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
                >
                  {startDays.map((d) => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                结束日期
              </label>
              <div className="grid grid-cols-3 gap-1">
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <select
                  value={endDay}
                  onChange={(e) => setEndDay(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
                >
                  {endDays.map((d) => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
              优先级
            </label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors"
                style={{
                  borderColor: priority === 'high' ? 'var(--tl-state-error)' : 'var(--tl-border)',
                  background: priority === 'high' ? 'rgba(239,68,68,0.15)' : 'var(--tl-muted)',
                }}
              >
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={priority === 'high'}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="sr-only"
                />
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tl-state-error)' }}></span>
                <span className="text-sm text-[var(--tl-card-foreground)]">高</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors"
                style={{
                  borderColor: priority === 'medium' ? 'var(--tl-state-warning)' : 'var(--tl-border)',
                  background: priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'var(--tl-muted)',
                }}
              >
                <input
                  type="radio"
                  name="priority"
                  value="medium"
                  checked={priority === 'medium'}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="sr-only"
                />
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tl-state-warning)' }}></span>
                <span className="text-sm text-[var(--tl-card-foreground)]">中</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors"
                style={{
                  borderColor: priority === 'low' ? 'var(--tl-state-success)' : 'var(--tl-border)',
                  background: priority === 'low' ? 'rgba(16,185,129,0.15)' : 'var(--tl-muted)',
                }}
              >
                <input
                  type="radio"
                  name="priority"
                  value="low"
                  checked={priority === 'low'}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="sr-only"
                />
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tl-state-success)' }}></span>
                <span className="text-sm text-[var(--tl-card-foreground)]">低</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
              <User className="w-4 h-4 inline mr-1" />
              负责人
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="请输入负责人姓名"
              className="w-full px-3 py-2 rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] placeholder:text-[var(--tl-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入任务描述"
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-[var(--tl-border)] bg-[var(--tl-muted)] text-[var(--tl-card-foreground)] placeholder:text-[var(--tl-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--tl-primary)] resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tl-card-foreground)] mb-1">
              <Gauge className="w-4 h-4 inline mr-1" />
              进度
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[var(--tl-primary)]"
                style={{ background: `linear-gradient(to right, var(--tl-primary) ${progress}%, var(--tl-border) ${progress}%)` }}
              />
              <span className="text-sm font-medium text-[var(--tl-card-foreground)] min-w-[3rem] text-right">{progress}%</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setProgress(v)}
                  className="flex-1 px-2 py-1 text-xs rounded border transition-colors"
                  style={{
                    borderColor: progress === v ? 'var(--tl-primary)' : 'var(--tl-border)',
                    background: progress === v ? 'var(--tl-primary)' : 'var(--tl-muted)',
                    color: progress === v ? 'var(--tl-primary-foreground)' : 'var(--tl-muted-foreground)',
                  }}
                >
                  {v}%
                </button>
              ))}
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