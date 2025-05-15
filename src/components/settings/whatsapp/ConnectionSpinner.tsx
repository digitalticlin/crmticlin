
import { LoaderCircle } from "lucide-react";

export default function ConnectionSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4 animate-fade-in">
      <LoaderCircle className="animate-spin text-primary w-8 h-8" />
      <span className="text-sm text-muted-foreground">Verificando conexão...</span>
    </div>
  );
}
