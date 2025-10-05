
import { ClientData } from "@/hooks/clients/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Building, Edit, Calendar } from "lucide-react";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { ClientDeleteDialog } from "./ClientDeleteDialog";
import { WhatsAppButton } from "./actions/WhatsAppButton";

interface ClientsCardProps {
  client: ClientData;
  onSelectClient: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientsCard = ({
  client,
  onSelectClient,
  onEditClient,
  onDeleteClient
}: ClientsCardProps) => {
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getClientTags = (client: ClientData) => {
    if (!client.tags || client.tags.length === 0) {
      // Fallback para mostrar status baseado em purchase_value se não há tags
      if (client.purchase_value && client.purchase_value > 0) {
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Cliente</Badge>;
      }
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Lead</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {client.tags.slice(0, 2).map(tag => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
            className="text-xs font-medium"
          >
            {tag.name}
          </Badge>
        ))}
        {client.tags.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{client.tags.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div
      className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg p-4 space-y-3 active:bg-white/40 transition-all duration-200"
      onClick={() => onSelectClient(client)}
    >
      {/* Header: Nome e Valor */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">
            {client.name}
          </h3>
          {client.notes && (
            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
              {client.notes}
            </p>
          )}
        </div>
        {formatCurrency(client.purchase_value) && (
          <div className="flex-shrink-0">
            <span className="font-bold text-sm text-gray-900">
              {formatCurrency(client.purchase_value)}
            </span>
          </div>
        )}
      </div>

      {/* Tags/Status */}
      <div className="flex items-center gap-2">
        {getClientTags(client)}
      </div>

      {/* Contatos */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3.5 w-3.5 text-black flex-shrink-0" />
          <span className="text-gray-800">{formatPhoneDisplay(client.phone)}</span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-black flex-shrink-0" />
            <span className="text-gray-700 truncate">{client.email}</span>
          </div>
        )}
        {client.company && (
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-3.5 w-3.5 text-black flex-shrink-0" />
            <span className="text-gray-800 truncate">{client.company}</span>
          </div>
        )}
      </div>

      {/* Footer: Data e Ações */}
      <div className="flex items-center justify-between pt-2 border-t border-white/30">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar className="h-3 w-3" />
          <span>{new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="flex items-center gap-1">
          <WhatsAppButton client={client} />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-black hover:text-gray-700 hover:bg-white/30"
            onClick={(e) => {
              e.stopPropagation();
              onEditClient(client);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <ClientDeleteDialog
            client={client}
            onDeleteClient={onDeleteClient}
          />
        </div>
      </div>
    </div>
  );
};
