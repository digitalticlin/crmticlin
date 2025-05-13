
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ClientsHeaderProps {
  onAddClient: () => void;
}

export const ClientsHeader = ({ onAddClient }: ClientsHeaderProps) => {
  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gerencie todos os seus clientes em um só lugar</p>
      </div>
      <Button onClick={onAddClient} className="gap-2">
        <Plus className="h-4 w-4" />
        <span>Novo Cliente</span>
      </Button>
    </div>
  );
};
