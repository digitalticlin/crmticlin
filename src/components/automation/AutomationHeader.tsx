
import { BarChart } from "lucide-react";

export function AutomationHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Automação</h1>
        <p className="text-muted-foreground">
          Disparos em massa e listas de transmissão para WhatsApp
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-medium">Limite diário</p>
          <p className="text-ticlin text-xl font-bold">500/2000</p>
        </div>
        <BarChart className="h-10 w-10 text-ticlin" />
      </div>
    </div>
  );
}
