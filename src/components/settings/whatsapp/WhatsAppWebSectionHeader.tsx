
import { MessageSquare } from "lucide-react";

interface WhatsAppWebSectionHeaderProps {
  onConnect: () => void;
  isConnecting: boolean;
  isLoading: boolean;
  companyLoading: boolean;
}

export const WhatsAppWebSectionHeader = ({
  onConnect,
  isConnecting,
  isLoading,
  companyLoading
}: WhatsAppWebSectionHeaderProps) => {
  return (
    <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
            <MessageSquare className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Instâncias WhatsApp</h3>
            <p className="text-gray-600 mt-1">Conecte e gerencie suas conexões do WhatsApp</p>
          </div>
        </div>
        
        <button
          onClick={onConnect}
          disabled={isConnecting || isLoading || companyLoading}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              <span>Adicionar WhatsApp</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
