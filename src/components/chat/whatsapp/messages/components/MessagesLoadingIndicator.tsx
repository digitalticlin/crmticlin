
import { Loader2 } from "lucide-react";

export const MessagesLoadingIndicator = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Carregando mensagens...
        </p>
      </div>
    </div>
  );
};
