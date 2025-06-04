
import { useState, useRef } from "react";
import { DashboardConfig, defaultConfig } from "../types/dashboardConfigTypes";

export const useDashboardState = () => {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  const triggerForceUpdate = () => {
    setForceUpdate(prev => prev + 1);
  };

  return {
    config,
    setConfig,
    loading,
    setLoading,
    saving,
    setSaving,
    forceUpdate,
    triggerForceUpdate,
    saveTimeoutRef,
    isMountedRef,
    isInitializedRef
  };
};
