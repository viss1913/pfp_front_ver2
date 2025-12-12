import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует число с разделителями тысяч
 * @param value - число для форматирования
 * @returns отформатированная строка (например: "5 000 000")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

/**
 * Форматирует процентное значение с одним знаком после запятой
 * @param value - процентное значение
 * @returns отформатированная строка (например: "13.0%")
 */
export function formatRate(value: number): string {
  return `${value.toFixed(1)}%`
}





