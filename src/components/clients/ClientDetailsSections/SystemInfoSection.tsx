
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface SystemInfoSectionProps {
  client: ClientData;
}

export function SystemInfoSection({ client }: SystemInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-5 w-5 text-[#d3d800]" />
        <h3 className="text-lg font-semibold text-gray-900">Informações do Sistema</h3>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-700">Data de Criação</Label>
        <p className="text-gray-900">{new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
}
