
import { useEffect } from "react";
import { WhatsAppSyncButton } from "./WhatsAppSyncButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const WhatsAppSyncTest = () => {
  useEffect(() => {
    // Executa automaticamente a sincronização quando o componente é montado
    const executeSync = async () => {
      console.log("Executando sincronização automática...");
      // Simula um clique no botão após 1 segundo
      setTimeout(() => {
        const button = document.querySelector('[data-sync-button]') as HTMLButtonElement;
        if (button) {
          button.click();
        }
      }, 1000);
    };

    executeSync();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Sincronização WhatsApp</CardTitle>
        <CardDescription>
          Sincronizar instâncias da Evolution API com o banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div data-sync-button>
          <WhatsAppSyncButton />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>A sincronização irá:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Buscar todas as instâncias da Evolution API</li>
            <li>Atualizar instâncias existentes no banco</li>
            <li>Inserir novas instâncias encontradas</li>
            <li>Remover instâncias que não existem mais na API</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
