import { Sun, Moon, PlusCircle, PlusSquare, Calendar } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onAddEvent: () => void;
  onAddTask: () => void;
  onGoToToday: () => void;
}

export function Header({ isDark, onToggleTheme, onAddEvent, onAddTask, onGoToToday }: HeaderProps) {
  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-5 border-b border-[var(--tl-border)] bg-[var(--tl-card)]">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-[var(--tl-foreground)]">Timeline</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onGoToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--tl-card-foreground)] bg-[var(--tl-muted)] hover:bg-[var(--tl-border)] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            回到今天
          </button>
          <button
            onClick={onAddEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--tl-primary)] bg-[var(--tl-primary)]/10 hover:bg-[var(--tl-primary)]/20 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            添加事项
          </button>
          <button
            onClick={onAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-[var(--tl-primary)] hover:opacity-90 transition-opacity"
          >
            <PlusSquare className="w-4 h-4" />
            添加任务
          </button>
        </div>
      </div>
      <div className="flex items-center gap-5 text-xs text-[var(--tl-muted-foreground)]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[var(--tl-primary)]"></span>
          <span>事项</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span 
            className="inline-block w-3 h-5 rounded-sm"
            style={{ background: 'rgba(79,70,229,0.15)', borderLeft: '3px solid var(--tl-primary)' }}
          ></span>
          <span>任务</span>
        </div>
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-[var(--tl-border)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tl-state-error)' }}></span>
            高
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tl-state-warning)' }}></span>
            中
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tl-state-success)' }}></span>
            低
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md hover:bg-[var(--tl-muted)] transition-colors"
          aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[var(--tl-foreground)]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--tl-foreground)]" />
          )}
        </button>
      </div>
    </header>
  );
}
