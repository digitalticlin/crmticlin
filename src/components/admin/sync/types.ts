
export interface SyncResult {
  success: boolean;
  data?: {
    syncId?: string;
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
    errorCount?: number;
    vpsInstancesCount: number;
    supabaseInstancesCount: number;
    syncLog?: string[];
    message: string;
  };
  error?: string;
}

export interface SyncState {
  isRunning: boolean;
  result: SyncResult | null;
  logs: string[];
}
