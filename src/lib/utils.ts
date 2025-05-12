import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { FIXED_COLUMN_IDS } from "@/types/kanban"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get column color class based on column ID
export function getColumnColorClass(columnId: string) {
  switch (columnId) {
    case FIXED_COLUMN_IDS.NEW_LEAD:
      return "border-l-4 border-l-ticlin";
    case FIXED_COLUMN_IDS.WON:
      return "border-l-4 border-l-green-500";
    case FIXED_COLUMN_IDS.LOST:
      return "border-l-4 border-l-red-500";
    default:
      return ""; // Default, no special color for custom columns
  }
}

// Add custom scrollbar styling to the global css
document.documentElement.style.setProperty(
  "--scrollbar-thumb", 
  "rgba(156, 163, 175, 0.5)"
);
document.documentElement.style.setProperty(
  "--scrollbar-track", 
  "rgba(229, 231, 235, 0.1)"
);

/**
 * Format a number as currency (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
