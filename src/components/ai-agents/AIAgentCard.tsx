
import { AIAgent } from "@/types/aiAgent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Users, Zap, Sparkles, Pencil, Trash2, CheckCircle2, XCircle, Filter, MessageCircle } from "lucide-react";

interface AIAgentCardProps {
  agent: AIAgent & { flow?: any[] };
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isTogglingStatus: boolean;
}

export const AIAgentCard = ({
  agent,
  onEdit,
  onDelete,
  onToggleStatus,
  isTogglingStatus
}: AIAgentCardProps) => {
  // Validações de configuração
  const hasFunnel = !!(agent.funnel_id);
  const hasWhatsApp = !!(agent.instance_phone);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "attendance":
        return <MessageSquare className="h-5 w-5" />;
      case "sales":
        return <Zap className="h-5 w-5" />;
      case "support":
        return <Users className="h-5 w-5" />;
      case "custom":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case "attendance":
        return "from-blue-500/20 to-cyan-500/10 border-blue-500/20";
      case "sales":
        return "from-ticlin/20 to-orange-400/10 border-ticlin/20";
      case "support":
        return "from-purple-500/20 to-pink-500/10 border-purple-500/20";
      case "custom":
        return "from-gray-500/20 to-slate-400/10 border-gray-500/20";
      default:
        return "from-ticlin/20 to-ticlin/10 border-ticlin/20";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "attendance":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 text-xs">
            <MessageSquare className="h-3 w-3" /> Atendimento
          </Badge>
        );
      case "sales":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-ticlin/10 text-black border-ticlin/30 text-xs">
            <Zap className="h-3 w-3" /> Vendas
          </Badge>
        );
      case "support":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 text-xs">
            <Users className="h-3 w-3" /> Suporte
          </Badge>
        );
      case "custom":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Sparkles className="h-3 w-3" /> Personalizado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl p-5 space-y-4 transition-all duration-300 hover:bg-white/15 hover:border-white/30">
      {/* Header: Nome e Ícone */}
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getTypeGradient(agent.type)} grid place-items-center border backdrop-blur-sm flex-shrink-0`}>
          {getTypeIcon(agent.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg truncate">
            {agent.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {getTypeBadge(agent.type)}
          </div>
        </div>
      </div>

      {/* Status + Switch */}
      <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${agent.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
          <span className="text-sm font-medium text-gray-800">
            {agent.status === "active" ? "Ativo" : "Inativo"}
          </span>
        </div>
        <Switch
          checked={agent.status === "active"}
          onCheckedChange={onToggleStatus}
          disabled={isTogglingStatus}
        />
        {isTogglingStatus && (
          <div className="animate-spin h-4 w-4 border-2 border-ticlin border-t-transparent rounded-full ml-2"></div>
        )}
      </div>

      {/* Mensagens Enviadas - Simples */}
      <div className="text-center py-3">
        <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Mensagens Enviadas
        </div>
        <div className="text-4xl font-bold text-gray-900">
          {agent.messages_count?.toLocaleString() || 0}
        </div>
      </div>

      {/* Configuração - 2 itens com ícones */}
      <div className="space-y-2.5 bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
        <div className="flex items-center gap-2">
          <Filter className={`h-4 w-4 flex-shrink-0 ${hasFunnel ? 'text-green-600' : 'text-gray-400'}`} />
          <span className={`text-sm ${hasFunnel ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
            Funil conectado
          </span>
        </div>

        <div className="flex items-center gap-2">
          <MessageCircle className={`h-4 w-4 flex-shrink-0 ${hasWhatsApp ? 'text-green-600' : 'text-gray-400'}`} />
          <span className={`text-sm ${hasWhatsApp ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
            WhatsApp conectado
          </span>
        </div>
      </div>

      {/* Ações - Minimalista */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-9 w-9 hover:bg-white/30 transition-all"
          title="Editar agente"
        >
          <Pencil className="h-4 w-4 text-gray-700" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-9 w-9 hover:bg-red-500/20 transition-all"
          title="Excluir agente"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
};
