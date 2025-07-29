
import { DashboardConfig } from "../types/dashboardConfigTypes";

export const validateConfig = (config: any): boolean => {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Validação básica da estrutura
  return !!(config.kpis && config.charts && config.layout);
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};
