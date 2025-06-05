
import { Funnel } from "@/types/funnel";
import { Button } from "@/components/ui/button";

interface FunnelSelectorProps {
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin: boolean;
}

export function FunnelSelector({ 
  funnels, 
  selectedFunnel, 
  onSelectFunnel, 
  onCreateFunnel, 
  isAdmin 
}: FunnelSelectorProps) {
  const handleCreateFunnel = async () => {
    const name = prompt("Nome do novo funil:");
    if (name) {
      const description = prompt("Descrição (opcional):");
      await onCreateFunnel(name, description || undefined);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1"
        value={selectedFunnel?.id || ""}
        onChange={e => {
          const funnel = funnels.find(f => f.id === e.target.value);
          if (funnel) onSelectFunnel(funnel);
        }}
      >
        {funnels.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      {isAdmin && (
        <Button variant="outline" size="sm" onClick={handleCreateFunnel}>
          + Funil
        </Button>
      )}
    </div>
  );
}
