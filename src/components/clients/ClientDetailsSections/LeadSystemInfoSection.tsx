
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Database, MessageSquare, Building2, Users, GitBranch } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface LeadSystemInfoSectionProps {
  client: ClientData;
}

export function LeadSystemInfoSection({ client }: LeadSystemInfoSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Database className="h-5 w-5 text-[#d3d800]" />
        <h3 className="text-lg font-semibold text-gray-900">Informações do Sistema</h3>
      </div>
      
      <div className="space-y-4">
        {/* Data de Criação */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#d3d800]" />
            Data de Criação
          </Label>
          <p className="text-gray-900">{new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Última Atualização */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#d3d800]" />
            Última Atualização
          </Label>
          <p className="text-gray-900">{new Date(client.updated_at).toLocaleDateString('pt-BR')}</p>
        </div>

        {/* IDs do Sistema */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Database className="h-4 w-4 text-[#d3d800]" />
            IDs do Sistema
          </Label>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Cliente ID:</span>
              <span className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded">
                {client.id}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Empresa ID:</span>
              <span className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded">
                {client.company_id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
