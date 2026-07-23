import { Event, Task } from '../types';

const EVENTS_KEY = 'timeline.events.v1';
const TASKS_KEY = 'timeline.tasks.v1';

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadEvents(fallback: Event[]): Event[] {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Event[]) : fallback;
  } catch {
    return fallback;
  }
}

export function loadTasks(fallback: Task[]): Task[] {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : fallback;
  } catch {
    return fallback;
  }
}

export function saveEvents(events: Event[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    /* 存储空间不足或被禁用时静默忽略 */
  }
}

export function saveTasks(tasks: Task[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    /* 存储空间不足或被禁用时静默忽略 */
  }
}
