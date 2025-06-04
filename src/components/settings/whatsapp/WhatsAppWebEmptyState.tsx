
import { MessageSquare } from "lucide-react";

interface WhatsAppWebEmptyStateProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export const WhatsAppWebEmptyState = ({
  onConnect,
  isConnecting
}: WhatsAppWebEmptyStateProps) => {
  return (
    <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma instância conectada</h3>
        <p className="text-gray-600 mb-6">Conecte seu primeiro WhatsApp para começar a usar o sistema</p>
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              <span>Conectar WhatsApp</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
