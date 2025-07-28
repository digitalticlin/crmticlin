
import { Loader2 } from "lucide-react";

export const MessagesLoadingIndicator = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="backdrop-blur-sm bg-white/10 rounded-lg p-6 border border-white/20 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Carregando mensagens...
          </p>
        </div>
      </div>
    </div>
  );
};
