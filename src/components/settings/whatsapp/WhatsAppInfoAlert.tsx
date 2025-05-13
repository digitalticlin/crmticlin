
import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppInfoAlert = () => {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) {
    return null;
  }
  
  return (
    <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
      <div className="flex gap-2">
        <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        <div className="flex-1">
          <AlertTitle className="text-blue-700 dark:text-blue-300 mb-1">Como conectar seu WhatsApp</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400 text-sm">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Clique em "Conectar WhatsApp" para gerar um código QR</li>
              <li>Abra o WhatsApp no seu celular</li>
              <li>Acesse Configurações &gt; Dispositivos conectados</li>
              <li>Escaneie o código QR que aparecerá na tela</li>
              <li>Aguarde alguns segundos para a conexão ser estabelecida</li>
            </ol>
          </AlertDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          onClick={() => setDismissed(true)}
        >
          Dispensar
        </Button>
      </div>
    </Alert>
  );
};

export default WhatsAppInfoAlert;
