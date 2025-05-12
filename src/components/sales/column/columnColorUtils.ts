
import { FIXED_COLUMN_IDS } from "@/types/kanban";

export const getColumnColor = (columnId: string, columnTitle: string): string => {
  if (columnId === FIXED_COLUMN_IDS.NEW_LEAD) return "bg-yellow-400";
  if (columnId === FIXED_COLUMN_IDS.WON) return "bg-green-500";
  if (columnId === FIXED_COLUMN_IDS.LOST) return "bg-red-500";
  
  const lowerTitle = columnTitle.toLowerCase();
  if (lowerTitle.includes('contato')) return "bg-yellow-500";
  if (lowerTitle.includes('proposta')) return "bg-purple-500";
  if (lowerTitle.includes('ganho')) return "bg-green-500";
  
  return "bg-blue-500";
};
