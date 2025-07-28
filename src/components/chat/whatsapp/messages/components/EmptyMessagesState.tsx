
import { MessageCircle } from "lucide-react";

export const EmptyMessagesState = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="backdrop-blur-sm bg-white/10 rounded-lg p-8 border border-white/20 shadow-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhuma mensagem
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Inicie uma conversa enviando uma mensagem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
