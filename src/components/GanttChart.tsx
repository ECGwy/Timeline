import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { RefObject } from 'react';
import { Event, Task } from '../types';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';

interface GanttChartProps {
  events: Event[];
  tasks: Task[];
  rowCount: number;
  onEventClick: (event: Event) => void;
  onTaskEdit: (task: Task) => void;
  onTaskProgressChange?: (id: string, progress: number) => void;
  onTaskDelete?: (id: string) => void;
  todayRowIndex?: number;
  // 外层竖向滚动容器（App 的 scrollContainerRef）：用于滚动时把任务描述贴到条块可见上沿
  scrollContainerRef?: RefObject<HTMLDivElement>;
}

const ROW_HEIGHT = 64;
// 顶部固定块高度（App 滚动容器 pt-12 = 48px）：描述贴可见上沿时让出这一高度
const HEADER_OFFSET = 48;

// 事项区布局常量
const EVENT_START = 20;          // 事项区左边距
const EVENT_COL_WIDTH = 96;      // 单个事项列宽
const EVENT_LABEL_MAX_WIDTH = 70; // 事项标签最大宽度（超出省略）
const MAX_INLINE_EVENTS = 3;     // 单日最多内联显示的事项数（含 +N 徽标）
const ZONE_GAP = 28;             // 事项区与任务区之间的间隔
const DEFAULT_TASK_START = 110;  // 无事项时任务区起始位置

// 任务区布局常量
const TASK_COL_WIDTH = 120;
const TASK_WIDTH = 100;

type EventLayoutItem =
  | { type: 'event'; rowIndex: number; col: number; event: Event }
  | { type: 'overflow'; rowIndex: number; col: number; events: Event[] };

interface OverflowPopover {
  rowIndex: number;
  left: number;
  top: number;
  events: Event[];
}

export function GanttChart({ events, tasks, rowCount, onEventClick, onTaskEdit, onTaskProgressChange, onTaskDelete, todayRowIndex, scrollContainerRef }: GanttChartProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;
  const [isDragging, setIsDragging] = useState(false);
  const [extraWidth, setExtraWidth] = useState(0);
  const [overflowPopover, setOverflowPopover] = useState<OverflowPopover | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // 任务描述容器 ref 与条块坐标（startRow/endRow 计算），用于滚动时动态定位描述
  const descRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const barInfo = useRef<Map<string, { top: number; height: number }>>(new Map());
  const popoverRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isExtendingRef = useRef(false);
  const didDragRef = useRef(false);

  const rowHeight = ROW_HEIGHT;
  const totalHeight = rowCount * rowHeight;

  // 事项布局：按行分组，超过上限则折叠为 +N，独立占据事项区，避免溢出到任务区
  const { eventLayout, maxEventCols } = useMemo(() => {
    const byRow: Record<number, Event[]> = {};
    events.forEach(e => {
      if (e.rowIndex < 0) return;
      (byRow[e.rowIndex] ||= []).push(e);
    });

    const items: EventLayoutItem[] = [];
    let maxCols = 0;

    Object.keys(byRow).forEach(rowStr => {
      const rowIndex = Number(rowStr);
      const rowEvents = byRow[rowIndex];

      if (rowEvents.length <= MAX_INLINE_EVENTS) {
        rowEvents.forEach((event, col) => {
          items.push({ type: 'event', rowIndex, col, event });
        });
        maxCols = Math.max(maxCols, rowEvents.length);
      } else {
        // 显示前 (MAX-1) 个事项，最后一列折叠为 +N 徽标
        const inline = rowEvents.slice(0, MAX_INLINE_EVENTS - 1);
        const overflow = rowEvents.slice(MAX_INLINE_EVENTS - 1);
        inline.forEach((event, col) => {
          items.push({ type: 'event', rowIndex, col, event });
        });
        items.push({ type: 'overflow', rowIndex, col: MAX_INLINE_EVENTS - 1, events: overflow });
        maxCols = Math.max(maxCols, MAX_INLINE_EVENTS);
      }
    });

    return { eventLayout: items, maxEventCols: maxCols };
  }, [events]);

  // 事项区总宽度（动态）——任务区从这里之后开始，二者不再重叠
  const eventZoneWidth = useMemo(() => {
    if (maxEventCols <= 0) return DEFAULT_TASK_START;
    return EVENT_START + maxEventCols * EVENT_COL_WIDTH + ZONE_GAP;
  }, [maxEventCols]);

  const baseContentWidth = useMemo(() => {
    const maxTaskColumn = tasks.reduce((max, task) => Math.max(max, task.column), 0);
    // 任务 left = eventZoneWidth + (column - 1) * TASK_COL_WIDTH
    const tasksRight = maxTaskColumn > 0
      ? eventZoneWidth + (maxTaskColumn - 1) * TASK_COL_WIDTH + TASK_WIDTH
      : eventZoneWidth;
    const baseWidth = 800;
    return Math.max(baseWidth, tasksRight + 60);
  }, [tasks, eventZoneWidth]);

  const contentWidth = baseContentWidth + extraWidth;

  // dateRange / events 变化时，关闭可能失效的弹层
  useEffect(() => {
    setOverflowPopover(null);
  }, [eventLayout, rowCount]);

  // 水平滚动到右侧边缘时自动扩展
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleHScroll = () => {
      if (isExtendingRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (scrollLeft + clientWidth >= scrollWidth - 50) {
        isExtendingRef.current = true;
        setExtraWidth(prev => prev + 800);
        setTimeout(() => { isExtendingRef.current = false; }, 300);
      }
      // 横向滚动时关闭弹层，避免错位
      setOverflowPopover(prev => (prev ? null : prev));
    };

    container.addEventListener('scroll', handleHScroll);
    return () => container.removeEventListener('scroll', handleHScroll);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.task-bar')) return;
    if ((e.target as Element).closest('.event-item')) return;
    if (!containerRef.current) return;

    setIsDragging(true);
    didDragRef.current = false;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 3) didDragRef.current = true;
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // 点击空白处关闭 +N 弹层
  useEffect(() => {
    if (!overflowPopover) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current && popoverRef.current.contains(target)) return;
      if ((target as Element).closest?.('.event-overflow-badge')) return;
      setOverflowPopover(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [overflowPopover]);

  // 根据竖向滚动位置，把每个任务描述贴到「条块可见部分的上沿」：
  // 条块顶部还在视口内 → 描述在条块顶部；条块顶部已滚出 → 描述粘在视口顶（让出顶部固定块高度）；
  // 条块底部快到视口顶 → 描述贴条块底部。始终保证描述在条块范围内且可见。
  const updateLabels = useCallback(() => {
    const sc = scrollContainerRef?.current;
    if (!sc) return;
    const scrollTop = sc.scrollTop;
    const clientH = sc.clientHeight;
    descRefs.current.forEach((el, id) => {
      const info = barInfo.current.get(id);
      if (!info) return;
      const { top, height } = info;
      const barBottom = top + height;
      // 仅当条块与可视区相交时才需要处理
      if (barBottom <= scrollTop || top >= scrollTop + clientH) return;
      const descH = el.offsetHeight || 46;
      let y = scrollTop - HEADER_OFFSET;
      if (y < top) y = top;
      if (y > barBottom - descH) y = barBottom - descH;
      if (y < top) y = top;
      el.style.top = `${y - top}px`;
    });
  }, [scrollContainerRef]);

  // 注册竖向滚动监听（rAF 节流），并在数据/布局变化时重定位一次
  useEffect(() => {
    const sc = scrollContainerRef?.current;
    if (!sc) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateLabels();
          ticking = false;
        });
        ticking = true;
      }
    };
    sc.addEventListener('scroll', onScroll);
    updateLabels();
    return () => sc.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef, updateLabels, tasks, rowCount, extraWidth]);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-visible bg-[var(--tl-background)]"
        id="drag-container"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="relative"
          style={{ minWidth: `${contentWidth}px`, height: `${totalHeight}px` }}
        >
          {Array.from({ length: rowCount - 1 }).map((_, i) => (
            <div
              key={`grid-${i}`}
              className="absolute left-0 right-0 h-px"
              style={{ top: `${(i + 1) * rowHeight}px`, background: 'var(--tl-border)', opacity: 0.5 }}
            ></div>
          ))}

          {Array.from({ length: rowCount }).map((_, i) => {
            const isToday = i === todayRowIndex;
            if (isToday) {
              return (
                <div
                  key={`today-bg-${i}`}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${i * rowHeight}px`,
                    height: `${rowHeight}px`,
                    background: 'rgba(79,70,229,0.1)',
                    borderLeft: '3px solid var(--tl-primary)',
                  }}
                ></div>
              );
            }
            if (i % 2 === 1) {
              return (
                <div
                  key={`bg-${i}`}
                  className="absolute left-0 right-0"
                  style={{ top: `${i * rowHeight}px`, height: `${rowHeight}px`, background: 'var(--tl-muted)' }}
                ></div>
              );
            }
            return null;
          })}

          {eventLayout.map((item) => {
            const left = EVENT_START + item.col * EVENT_COL_WIDTH;
            const centerY = item.rowIndex * rowHeight + rowHeight / 2;

            if (item.type === 'overflow') {
              const titles = item.events.map(e => e.title).join('\n');
              return (
                <button
                  key={`ovf-${item.rowIndex}`}
                  type="button"
                  className="absolute event-item event-overflow-badge flex items-center justify-center text-[10px] font-semibold rounded-full cursor-pointer"
                  style={{
                    left: `${left}px`,
                    top: `${centerY}px`,
                    transform: 'translateY(-50%)',
                    height: '18px',
                    minWidth: '28px',
                    padding: '0 6px',
                    background: 'var(--tl-primary)',
                    color: 'var(--tl-primary-foreground)',
                  }}
                  title={titles}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOverflowPopover(prev =>
                      prev && prev.rowIndex === item.rowIndex
                        ? null
                        : {
                            rowIndex: item.rowIndex,
                            left: left,
                            top: centerY,
                            events: item.events,
                          }
                    );
                  }}
                >
                  +{item.events.length}
                </button>
              );
            }

            const { event } = item;
            return (
              <div
                key={event.id}
                className="absolute event-item cursor-pointer"
                onClick={() => onEventClick(event)}
              >
                <div
                  className="w-3 h-3 rounded-full bg-[var(--tl-primary)] cursor-pointer transition-transform duration-150 hover:scale-150"
                  style={{
                    left: `${left}px`,
                    top: `${centerY}px`,
                    transform: 'translateY(-50%)',
                    position: 'absolute',
                  }}
                  title={event.title}
                ></div>
                <span
                  className="absolute text-xs font-medium text-[var(--tl-foreground)]"
                  style={{
                    left: `${left + 14}px`,
                    top: `${centerY}px`,
                    transform: 'translateY(-50%)',
                    maxWidth: `${EVENT_LABEL_MAX_WIDTH}px`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={event.title}
                >
                  {event.title}
                </span>
              </div>
            );
          })}

          {tasks.map((task) => {
            const top = task.startRow * ROW_HEIGHT + 3;
            const height = (task.endRow - task.startRow + 1) * ROW_HEIGHT - 6;
            barInfo.current.set(task.id, { top, height });
            return (
              <TaskCard
                key={task.id}
                task={task}
                left={eventZoneWidth + (task.column - 1) * TASK_COL_WIDTH}
                onClick={() => setSelectedTaskId(task.id)}
                labelRef={(el) => {
                  if (el) descRefs.current.set(task.id, el);
                  else descRefs.current.delete(task.id);
                }}
              />
            );
          })}

          {overflowPopover && (
            <div
              ref={popoverRef}
              className="absolute z-20 event-item rounded-md shadow-lg"
              style={{
                left: `${overflowPopover.left}px`,
                top: `${overflowPopover.top + 14}px`,
                minWidth: '160px',
                maxWidth: '220px',
                background: 'var(--tl-popover)',
                border: '1px solid var(--tl-border)',
                padding: '4px',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] px-2 py-1 text-[var(--tl-muted-foreground)]">
                该日事项（{overflowPopover.events.length}）
              </div>
              {overflowPopover.events.map(ev => (
                <button
                  key={ev.id}
                  type="button"
                  className="w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 hover:bg-[var(--tl-muted)] text-[var(--tl-foreground)]"
                  onClick={() => {
                    onEventClick(ev);
                    setOverflowPopover(null);
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--tl-primary)' }}></span>
                  <span className="truncate">{ev.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onEdit={() => {
            onTaskEdit(selectedTask);
            setSelectedTaskId(null);
          }}
          onProgressChange={onTaskProgressChange}
          onDelete={() => {
            if (selectedTask) onTaskDelete?.(selectedTask.id);
            setSelectedTaskId(null);
          }}
        />
      )}
    </>
  );
}
