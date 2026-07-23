import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { TimelineSidebar } from './components/TimelineSidebar';
import { GanttChart } from './components/GanttChart';
import { AddEventModal } from './components/AddEventModal';
import { AddTaskModal } from './components/AddTaskModal';
import { EventDetailModal } from './components/EventDetailModal';
import { events as initialEvents, tasks as initialTasks } from './data/mockData';
import { Event, Task, Priority, TimelineRow } from './types';
import { assignTaskColumns } from './utils/taskLayout';
import { generateDateRange, addDays, addMonths, formatDate, findRowIndex } from './utils/dateUtils';
import { getMonthGroups, getActiveMonthIndex } from './utils/monthGroups';
import { loadEvents, loadTasks, saveEvents, saveTasks } from './utils/storage';

const ROW_HEIGHT = 64;
const INITIAL_PAST_DAYS = 15;
const INITIAL_FUTURE_DAYS = 30;
const EXTEND_MONTHS = 1;

function App() {
  const [isDark, setIsDark] = useState(false);
  const [events, setEvents] = useState<Event[]>(() => loadEvents(initialEvents));
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(initialTasks));
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerMonthRef = useRef<HTMLSpanElement>(null);
  const activeMonthIdxRef = useRef(0);
  const updateActiveMonthRef = useRef<(scrollTop: number) => void>(() => {});
  const isExtendingRef = useRef(false);
  const isVerticalDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);

  // 动态日期范围
  const today = useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = useState(() => ({
    start: addDays(today, -INITIAL_PAST_DAYS),
    end: addDays(today, INITIAL_FUTURE_DAYS),
  }));

  // 生成时间轴行
  const [timelineRows, setTimelineRows] = useState<TimelineRow[]>(() =>
    generateDateRange(dateRange.start, dateRange.end)
  );

  // 今天的 rowIndex
  const todayRowIndex = useMemo(() => {
    const todayStr = formatDate(today);
    return findRowIndex(timelineRows, todayStr);
  }, [timelineRows, today]);

  // 月份分组（与侧边栏共享），用于第一列顶部固定块计算当前年份+月份
  const monthGroups = useMemo(() => getMonthGroups(timelineRows), [timelineRows]);
  const initialMonthLabel = useMemo(() => {
    if (!monthGroups.length) return '';
    const g = monthGroups[0];
    return `${g.year}年${g.month}月`;
  }, [monthGroups]);

  // 根据滚动位置更新第一列顶部固定块的年份/月份（直接操作 DOM，避免整树重渲染）
  const updateActiveMonth = useCallback((scrollTop: number) => {
    const idx = getActiveMonthIndex(monthGroups, scrollTop, ROW_HEIGHT);
    if (idx !== activeMonthIdxRef.current && headerMonthRef.current) {
      activeMonthIdxRef.current = idx;
      const g = monthGroups[idx];
      headerMonthRef.current.textContent = `${g.year}年${g.month}月`;
    }
  }, [monthGroups]);

  useEffect(() => {
    updateActiveMonthRef.current = updateActiveMonth;
  }, [updateActiveMonth]);

  // 动态计算事件的 rowIndex 和 column（避免重叠）
  const computedEvents = useMemo(() => {
    const eventsWithRowIndex = events.map(event => ({
      ...event,
      rowIndex: findRowIndex(timelineRows, event.date),
    })).filter(e => e.rowIndex >= 0);

    // 按 rowIndex 分组，同一天的事件分配不同列
    const rowEvents: { [key: number]: typeof eventsWithRowIndex } = {};
    eventsWithRowIndex.forEach(event => {
      if (!rowEvents[event.rowIndex]) rowEvents[event.rowIndex] = [];
      rowEvents[event.rowIndex].push(event);
    });

    // 分配列
    return eventsWithRowIndex.map(event => {
      const sameRowEvents = rowEvents[event.rowIndex] || [];
      const column = sameRowEvents.findIndex(e => e.id === event.id);
      return { ...event, column };
    });
  }, [events, timelineRows]);

  // 动态计算任务的 startRow / endRow
  const computedTasks = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      startRow: findRowIndex(timelineRows, task.startDate),
      endRow: findRowIndex(timelineRows, task.endDate),
    })).filter(t => t.startRow >= 0 && t.endRow >= 0);
  }, [tasks, timelineRows]);

  // 任务列分配
  const layoutedTasks = useMemo(() => {
    return assignTaskColumns(computedTasks);
  }, [computedTasks]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // 事项/任务变更时写入 localStorage，刷新与重开都不丢
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // 初始定位到今天
  useEffect(() => {
    if (todayRowIndex >= 0 && scrollContainerRef.current) {
      const scrollPosition = todayRowIndex * ROW_HEIGHT - 100;
      const container = scrollContainerRef.current;
      container.scrollTop = Math.max(0, scrollPosition);
      updateActiveMonthRef.current(container.scrollTop);
    }
  }, [todayRowIndex]);

  // 滚动监听：到顶部/底部时扩展日期范围
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isExtendingRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // 滚动到顶部，扩展过去1个月
    if (scrollTop < 50) {
      isExtendingRef.current = true;
      const oldScrollHeight = container.scrollHeight;
      const oldScrollTop = container.scrollTop;

      setDateRange(prev => ({
        start: addMonths(prev.start, -EXTEND_MONTHS),
        end: prev.end,
      }));

      // 在下一帧调整滚动位置
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
        }
        setTimeout(() => { isExtendingRef.current = false; }, 300);
      });
    }

    // 滚动到底部，扩展未来1个月
    if (scrollTop + clientHeight > scrollHeight - 50) {
      isExtendingRef.current = true;
      setDateRange(prev => ({
        start: prev.start,
        end: addMonths(prev.end, EXTEND_MONTHS),
      }));
      setTimeout(() => { isExtendingRef.current = false; }, 300);
    }
  }, []);

  // 当 dateRange 变化时重新生成 timelineRows
  useEffect(() => {
    setTimelineRows(generateDateRange(dateRange.start, dateRange.end));
  }, [dateRange]);

  // 注册滚动监听
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          if (container) updateActiveMonthRef.current(container.scrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  // 垂直拖拽事件处理
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.task-bar')) return;
      if (target.closest('.event-item')) return;
      if (target.tagName === 'SELECT' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      isVerticalDraggingRef.current = true;
      startYRef.current = e.pageY;
      scrollTopRef.current = container.scrollTop;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVerticalDraggingRef.current || !container) return;

      const deltaY = e.pageY - startYRef.current;
      container.scrollTop = scrollTopRef.current - deltaY;
    };

    const handleMouseUp = () => {
      isVerticalDraggingRef.current = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleGoToToday = () => {
    if (todayRowIndex >= 0 && scrollContainerRef.current) {
      const scrollPosition = todayRowIndex * ROW_HEIGHT - 100;
      scrollContainerRef.current.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });

      const ganttContainer = document.getElementById('drag-container');
      if (ganttContainer) {
        ganttContainer.scrollLeft = 0;
      }
    }
  };

  const handleAddEvent = (title: string, date: string) => {
    const newEvent: Event = {
      id: `e${Date.now()}`,
      title,
      date,
      rowIndex: 0,
      column: 0,
    };
    setEvents([...events, newEvent]);
  };

  const handleEditEvent = (id: string, title: string, date: string) => {
    setEvents(events.map(event =>
      event.id === id ? { ...event, title, date } : event
    ));
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    setSelectedEvent(null);
  };

  const handleAddTask = (
    title: string,
    startDate: string,
    endDate: string,
    priority: Priority,
    assignee: string,
    description: string
  ) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title,
      startDate,
      endDate,
      priority,
      startRow: 0,
      endRow: 0,
      column: 1,
      assignee: assignee || undefined,
      description: description || undefined,
      progress: 0,
    };
    setTasks([...tasks, newTask]);
  };

  const handleEditTask = (
    id: string,
    title: string,
    startDate: string,
    endDate: string,
    priority: Priority,
    assignee: string,
    description: string
  ) => {
    setTasks(tasks.map(task =>
      task.id === id
        ? {
            ...task,
            title,
            startDate,
            endDate,
            priority,
            assignee: assignee || undefined,
            description: description || undefined,
          }
        : task
    ));
    setEditingTask(null);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowAddTaskModal(true);
  };

  const handleOpenAddEventModal = () => {
    setEditingEvent(null);
    setShowAddEventModal(true);
  };

  const handleOpenEditEventModal = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      setShowAddEventModal(true);
      setSelectedEvent(null);
    }
  };

  const handleOpenAddTaskModal = () => {
    setEditingTask(null);
    setShowAddTaskModal(true);
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <Header
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onAddEvent={handleOpenAddEventModal}
        onAddTask={handleOpenAddTaskModal}
        onGoToToday={handleGoToToday}
      />
      <div className="relative flex-1 overflow-hidden">
        {/* 固定块：第一列时间轴顶部，显示年份+月份，对应第二列（日期）顶部当前时间，不随竖向滚动移动 */}
        <div className="absolute top-0 left-0 z-30 w-[180px] h-12 flex items-center justify-center border-r border-b border-[var(--tl-border)] bg-[var(--tl-background)] text-sm font-semibold text-[var(--tl-foreground)]">
          <span ref={headerMonthRef}>{initialMonthLabel}</span>
        </div>

        {/* 竖向滚动区：顶部留 48px 给固定块，保证首行不被遮挡且左右对齐 */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 pt-12 overflow-y-auto overflow-x-hidden"
          style={{ cursor: 'grab' }}
        >
          <div className="flex">
            <TimelineSidebar rows={timelineRows} todayRowIndex={todayRowIndex} />
            <div className="flex-1 min-w-0">
            <GanttChart
              events={computedEvents}
              tasks={layoutedTasks}
              rowCount={timelineRows.length}
              onEventClick={handleEventClick}
              onTaskEdit={handleTaskEdit}
              todayRowIndex={todayRowIndex}
              scrollContainerRef={scrollContainerRef}
            />
            </div>
          </div>
        </div>
      </div>

      {showAddEventModal && (
        <AddEventModal
          onClose={() => {
            setShowAddEventModal(false);
            setEditingEvent(null);
          }}
          onAdd={handleAddEvent}
          onEdit={handleEditEvent}
          editingEvent={editingEvent}
        />
      )}

      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => {
            setShowAddTaskModal(false);
            setEditingTask(null);
          }}
          onAdd={handleAddTask}
          onEdit={handleEditTask}
          editingTask={editingTask}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          rows={timelineRows}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleOpenEditEventModal}
          onDelete={() => handleDeleteEvent(selectedEvent.id)}
        />
      )}
    </main>
  );
}

export default App;
