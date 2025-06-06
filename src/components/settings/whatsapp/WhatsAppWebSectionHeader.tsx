
import { RefreshCcw, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppWebSectionHeaderProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  isLoading: boolean;
  companyLoading: boolean;
  creationStage?: string;
}

export const WhatsAppWebSectionHeader = ({
  onConnect,
  isConnecting,
  isLoading,
  companyLoading,
  creationStage
}: WhatsAppWebSectionHeaderProps) => {
  return (
    <div className="flex flex-wrap justify-between gap-4 items-center">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">WhatsApp Web</h2>
        <p className="text-muted-foreground">
          Gerencie suas conexões e instâncias do WhatsApp Web.js
        </p>
        {/* CORREÇÃO CRÍTICA: Mostrar estágio da criação */}
        {creationStage && (
          <p className="text-sm text-blue-600 mt-1 font-medium">
            {creationStage}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={() => window.location.reload()}
          disabled={isConnecting}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1 bg-green-600 hover:bg-green-700"
          onClick={onConnect}
          disabled={isConnecting || companyLoading}
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{creationStage || 'Criando...'}</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Conexão</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
