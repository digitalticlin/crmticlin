
import { useState } from "react";

export const useSyncLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Global Sync UI] ${message}`);
  };

  const clearLogs = () => setLogs([]);

  return { logs, addLog, clearLogs };
};
