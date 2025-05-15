
import { useCallback } from "react";
import { getNextAvailableInstanceName } from "@/utils/whatsapp/whatsappNameUtils";

export const useUniqueWhatsAppInstanceName = () => {
  const getNextAvailable = useCallback(
    async (baseName: string) => await getNextAvailableInstanceName(baseName),
    []
  );
  return { getNextAvailableInstanceName: getNextAvailable };
};
