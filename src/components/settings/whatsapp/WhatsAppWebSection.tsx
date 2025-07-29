import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Copy, Edit, Trash } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { CreateInstanceButton } from "@/modules/whatsapp/instanceCreation/components/CreateInstanceButton";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone: string;
  status: string;
  // Add other properties as needed
}

export const WhatsAppWebSection = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const { user } = useAuth();
  const { companyId } = useCompanyData();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchInstances = useCallback(async () => {
    if (!user?.id || !companyId) return [];

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockInstances = [
        { id: '1', instance_name: 'WhatsApp 1', phone: '+5511999999999', status: 'connected' },
        { id: '2', instance_name: 'WhatsApp 2', phone: '+5511999999998', status: 'disconnected' },
      ];

      setInstances(mockInstances);
      return mockInstances;

    } catch (error) {
      console.error("Error fetching instances:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar instâncias",
        description: "Ocorreu um erro ao buscar as instâncias do WhatsApp."
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, companyId, toast]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const refreshInstances = async () => {
    await fetchInstances();
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: "Status atualizado",
        description: "O status de todas as instâncias foi atualizado com sucesso."
      });

    } catch (error) {
      console.error("Error syncing all instances:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status das instâncias."
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleInstanceCreated = async () => {
    // Refresh the instances list after successful creation
    await refreshInstances();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Web</CardTitle>
          <CardDescription>
            Gerencie suas instâncias do WhatsApp Web.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Empty state */}
            {instances.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="mb-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma instância WhatsApp encontrada
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Crie sua primeira instância para começar a usar o WhatsApp
                  </p>
                </div>
                <CreateInstanceButton
                  onSuccess={handleInstanceCreated}
                  variant="whatsapp"
                  className="mx-auto"
                  size="lg"
                />
              </div>
            )}

            {/* Instances grid */}
            {instances.length > 0 && !isLoading && (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instances.map((instance) => (
                  <Card key={instance.id}>
                    <CardHeader>
                      <CardTitle>{instance.instance_name}</CardTitle>
                      <CardDescription>
                        {instance.phone} - {instance.status}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>ID: {instance.id}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="ml-auto flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar ID
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Trash className="mr-2 h-4 w-4" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="text-center">
                Carregando instâncias...
              </div>
            )}

            {/* Add new instance button */}
            {instances.length > 0 && (
              <div className="text-center pt-6">
                <CreateInstanceButton
                  onSuccess={handleInstanceCreated}
                  variant="whatsapp"
                  className="mx-auto"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
