
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Database, MessageSquare, Building2, Users, GitBranch } from "lucide-react";
import { KanbanLead } from "@/types/kanban";

interface GlassmorphismSystemInfoProps {
  selectedLead: KanbanLead;
}

export const GlassmorphismSystemInfo = ({ selectedLead }: GlassmorphismSystemInfoProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-400/80 to-cyan-300/80 rounded-xl shadow-lg shadow-blue-400/30">
          <Database className="h-5 w-5 text-black" />
        </div>
        Informações do Sistema
      </h3>

      <div className="space-y-5">
        {/* Data de Criação */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-lime-400" />
            Data de Criação
          </Label>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-white/80">
              {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('pt-BR') : 'Não informado'}
            </p>
          </div>
        </div>

        {/* Última Atualização */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-lime-400" />
            Última Atualização
          </Label>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-white/80">
              {selectedLead.updated_at ? new Date(selectedLead.updated_at).toLocaleDateString('pt-BR') : 'Não informado'}
            </p>
          </div>
        </div>

        {/* Mensagens Não Lidas */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-lime-400" />
            Mensagens Não Lidas
          </Label>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Badge className={`${
              selectedLead.unreadCount && selectedLead.unreadCount > 0 
                ? "bg-gradient-to-r from-red-500/90 to-pink-600/90 text-white border-red-400/60" 
                : "bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white border-green-400/60"
            } backdrop-blur-sm border-2 px-3 py-1.5 rounded-full font-semibold`}>
              {selectedLead.unreadCount || 0} mensagens
            </Badge>
          </div>
        </div>

        {/* IDs do Sistema */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-lime-400" />
            IDs do Sistema
          </Label>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Lead ID:</span>
              <span className="text-white/90 text-xs font-mono bg-black/20 px-2 py-1 rounded">
                {selectedLead.id}
              </span>
            </div>
            {selectedLead.company_id && (
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Empresa ID:</span>
                <span className="text-white/90 text-xs font-mono bg-black/20 px-2 py-1 rounded">
                  {selectedLead.company_id}
                </span>
              </div>
            )}
            {selectedLead.whatsapp_number_id && (
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">WhatsApp ID:</span>
                <span className="text-white/90 text-xs font-mono bg-black/20 px-2 py-1 rounded">
                  {selectedLead.whatsapp_number_id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Funil e Etapa */}
        <div className="space-y-3">
          <Label className="text-white/90 font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-lime-400" />
            Funil e Etapa
          </Label>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Funil:</span>
              <span className="text-white/90">
                {selectedLead.funnel_id ? 'Vinculado ao funil' : 'Sem funil definido'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Etapa:</span>
              <span className="text-white/90">
                {selectedLead.kanban_stage_id ? 'Em etapa definida' : 'Sem etapa definida'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
