import type { Task } from "../schema";

export function sortByOrder(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function sortByPriority(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
}

export function nextOrder(tasks: readonly Task[], dateKey: string): number {
  const orders = tasks.filter((task) => task.scheduledFor === dateKey).map((task) => task.order);
  return orders.length === 0 ? 0 : Math.max(...orders) + 1;
}
