import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует число с разделителями тысяч
 * @param value - число для форматирования (может быть числом или строкой)
 * @returns отформатированная строка (например: "5 000 000")
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0'
  return new Intl.NumberFormat('ru-RU').format(numValue)
}

/**
 * Форматирует процентное значение с одним знаком после запятой
 * @param value - процентное значение (может быть числом или строкой)
 * @returns отформатированная строка (например: "13.0%")
 */
export function formatRate(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0.0%'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0.0%'
  return `${numValue.toFixed(1)}%`
}





