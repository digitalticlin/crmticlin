
import { AIAgent } from "@/types/aiAgent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Users, Zap, Bot, Pencil, Trash2, Calendar } from "lucide-react";

interface AIAgentCardProps {
  agent: AIAgent;
  agentConfig: {
    hasPrompt: boolean;
    flowSteps: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isTogglingStatus: boolean;
}

export const AIAgentCard = ({
  agent,
  agentConfig,
  onEdit,
  onDelete,
  onToggleStatus,
  isTogglingStatus
}: AIAgentCardProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "attendance":
        return <MessageSquare className="h-5 w-5" />;
      case "sales":
        return <Zap className="h-5 w-5" />;
      case "support":
        return <Users className="h-5 w-5" />;
      case "custom":
        return <Bot className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
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
            <Bot className="h-3 w-3" /> Personalizado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg p-4 space-y-3">
      {/* Header: Nome, Ícone e Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-ticlin/20 to-ticlin/10 grid place-items-center border border-ticlin/20 flex-shrink-0">
            {getTypeIcon(agent.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {agent.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(agent.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Switch de Status */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Switch
            checked={agent.status === "active"}
            onCheckedChange={onToggleStatus}
            disabled={isTogglingStatus}
          />
          {isTogglingStatus && (
            <div className="animate-spin h-3 w-3 border-2 border-ticlin border-t-transparent rounded-full"></div>
          )}
        </div>
      </div>

      {/* Badge de Tipo */}
      <div>
        {getTypeBadge(agent.type)}
      </div>

      {/* Configurações */}
      <div className="space-y-1.5 bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agentConfig.hasPrompt ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-xs text-gray-700">
            {agentConfig.hasPrompt ? 'Prompt configurado' : 'Prompt pendente'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agentConfig.flowSteps > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-xs text-gray-700">
            Fluxo ({agentConfig.flowSteps} passos)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agent.funnel_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-xs text-gray-700">
            {agent.funnel_id ? 'Funil conectado' : 'Sem funil'}
          </span>
        </div>
      </div>

      {/* Mensagens */}
      <div className="bg-gradient-to-br from-ticlin/10 to-ticlin/5 rounded-lg p-3 border border-ticlin/20 text-center">
        <div className="font-bold text-2xl text-gray-900">
          {agent.messages_count.toLocaleString()}
        </div>
        <div className="text-xs text-gray-700 mt-0.5">
          mensagens enviadas
        </div>
      </div>

      {/* Footer: Ações */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/30">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1 h-9 bg-ticlin/10 hover:bg-ticlin/20 border-ticlin/30 text-black"
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="h-9 w-9 p-0 bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
