
import { useRef } from 'react';
import { useWhatsAppStatusMonitor } from '../useWhatsAppStatusMonitor';

interface UseInstanceStatusCheckProps {
  isUnmountedRef: React.MutableRefObject<boolean>;
}

export const useInstanceStatusCheck = ({ isUnmountedRef }: UseInstanceStatusCheckProps) => {
  const { checkInstanceStatus, addConnectingInstance } = useWhatsAppStatusMonitor();
  const lastStatusCheckRef = useRef<number>(0);

  const handleCheckInstanceStatus = (instanceId: string, forceFresh?: boolean) => {
    if (isUnmountedRef.current) return;
    console.log('[useInstanceStatusCheck] Manual status check requested for:', instanceId);
    const now = Date.now();
    if (!forceFresh && now - lastStatusCheckRef.current < 15000) {
      console.log('[useInstanceStatusCheck] Manual status check throttled');
      return;
    }
    lastStatusCheckRef.current = now;
    return checkInstanceStatus(instanceId, forceFresh);
  };

  const handleAddConnectingInstance = (instanceId: string) => {
    if (!isUnmountedRef.current) {
      addConnectingInstance(instanceId);
    }
  };

  return {
    checkInstanceStatus: handleCheckInstanceStatus,
    addConnectingInstance: handleAddConnectingInstance
  };
};
