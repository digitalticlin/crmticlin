
import { Funnel } from "@/types/funnel";
import { Button } from "@/components/ui/button";

interface FunnelSelectorProps {
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  setSelectedFunnel: (f: Funnel) => void;
  onCreateFunnel: (name: string) => void;
}
export function FunnelSelector({ funnels, selectedFunnel, setSelectedFunnel, onCreateFunnel }: FunnelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1"
        value={selectedFunnel?.id || ""}
        onChange={e => {
          const funnel = funnels.find(f => f.id === e.target.value);
          if (funnel) setSelectedFunnel(funnel);
        }}
      >
        {funnels.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      <Button variant="outline" size="sm" onClick={() => {
        const name = prompt("Novo funil:");
        if (name) onCreateFunnel(name);
      }}>+ Funil</Button>
    </div>
  );
}
