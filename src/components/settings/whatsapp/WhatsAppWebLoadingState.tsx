
import { Loader2 } from "lucide-react";

export const WhatsAppWebLoadingState = () => {
  return (
    <div className="flex justify-center py-12">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
        <p className="text-sm text-gray-600">Carregando instâncias...</p>
      </div>
    </div>
  );
};
