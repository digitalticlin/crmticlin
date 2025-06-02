
import { RefreshCw } from "lucide-react";

export const EmptyVersionState = () => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Clique em "Verificar Versão" para diagnóstico via edge function</p>
    </div>
  );
};
