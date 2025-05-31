
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { AddWhatsAppWebCard } from "./AddWhatsAppWebCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";

export function WhatsAppWebSection() {
  const { companyId, loading: companyLoading } = useCompanyData();
  const {
    instances,
    loading: instancesLoading,
    createInstance,
    deleteInstance,
    refreshQRCode
  } = useWhatsAppWebInstances(companyId, companyLoading);

  const isLoading = companyLoading || instancesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  // Se não tem companyId depois de carregar, mostrar mensagem
  if (!companyLoading && !companyId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Empresa não encontrada</h3>
          <p className="text-muted-foreground">
            Configure os dados da sua empresa primeiro na aba Perfil
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            <CardTitle>WhatsApp Web.js</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie suas conexões WhatsApp usando WhatsApp Web em seu próprio servidor
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AddWhatsAppWebCard
          onAdd={createInstance}
          isCreating={instancesLoading}
        />

        {instances.map((instance) => (
          <WhatsAppWebInstanceCard
            key={instance.id}
            instance={instance}
            onDelete={deleteInstance}
            onRefreshQR={refreshQRCode}
          />
        ))}
      </div>

      {instances.length === 0 && !instancesLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma instância WhatsApp Web</h3>
            <p className="text-muted-foreground">
              Crie sua primeira instância WhatsApp Web para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
