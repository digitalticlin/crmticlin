
import { MessageSquare } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">WhatsApp Chat</h2>
      <p className="text-muted-foreground max-w-md">
        Selecione um contato da lista para iniciar uma conversa ou atender um lead.
      </p>
    </div>
  );
};
