import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function movingAverage(values: number[], windowSize: number) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    return average(values.slice(start, index + 1));
  });
}

export function formatNumber(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
}

export function sample<T>(items: T[], index: number) {
  return items[((index % items.length) + items.length) % items.length];
}
