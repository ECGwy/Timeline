import { Task, Priority } from '../types';

const priorityOrder: Priority[] = ['high', 'medium', 'low'];

function getPriorityIndex(priority: Priority): number {
  return priorityOrder.indexOf(priority);
}

function tasksOverlap(task1: Task, task2: Task): boolean {
  return task1.startRow <= task2.endRow && task2.startRow <= task1.endRow;
}

export function assignTaskColumns(tasks: Task[]): Task[] {
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityCompare = getPriorityIndex(a.priority) - getPriorityIndex(b.priority);
    if (priorityCompare !== 0) return priorityCompare;
    const startCompare = a.startRow - b.startRow;
    if (startCompare !== 0) return startCompare;
    return a.endRow - b.endRow;
  });

  const priorityGroups: { [key: string]: Task[] } = {};
  priorityOrder.forEach(p => {
    priorityGroups[p] = sortedTasks.filter(t => t.priority === p);
  });

  const resultTasks: Task[] = [];
  let currentColumn = 1;

  priorityOrder.forEach(priority => {
    const groupTasks = priorityGroups[priority];
    if (groupTasks.length === 0) return;

    const columns: Task[][] = [];

    for (const task of groupTasks) {
      let placed = false;

      for (const column of columns) {
        const lastTask = column[column.length - 1];
        if (!tasksOverlap(task, lastTask)) {
          column.push(task);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([task]);
      }
    }

    columns.forEach((column, index) => {
      column.forEach(task => {
        resultTasks.push({
          ...task,
          column: currentColumn + index,
        });
      });
    });

    currentColumn += columns.length;
  });

  return resultTasks;
}
