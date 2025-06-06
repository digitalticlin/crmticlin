
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface SystemInfoSectionProps {
  client: ClientData;
}

export function SystemInfoSection({ client }: SystemInfoSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-[#d3d800]/30 shadow-xl shadow-[#d3d800]/10">
      <h3 className="font-semibold text-white border-b border-[#d3d800]/30 pb-2 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-[#d3d800] rounded-full shadow-lg shadow-[#d3d800]/50"></div>
        Informações do Sistema
      </h3>
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-[#d3d800]" />
        <div>
          <Label className="text-sm font-medium text-white/80">Data de Criação</Label>
          <p className="text-sm text-white">{new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
