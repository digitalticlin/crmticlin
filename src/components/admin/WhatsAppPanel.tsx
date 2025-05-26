import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";
import { WhatsAppFilters } from "./whatsapp/WhatsAppFilters";
import { WhatsAppInstanceTable } from "./whatsapp/WhatsAppInstanceTable";
import { SystemDiagnostic } from "./whatsapp/SystemDiagnostic";
import { getStatusBadge } from "./whatsapp/StatusBadge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Mock data for WhatsApp instances
const mockWhatsAppInstances = [
  { 
    id: '1', 
    name: 'Atendimento', 
    phone: '+5511912345678', 
    instanceName: 'tech_solutions_atendimento',
    company: 'Tech Solutions Ltda',
    companyId: '1',
    status: 'connected',
    lastActivity: '2024-05-13 15:45',
    messages: 143
  },
  { 
    id: '2', 
    name: 'Vendas', 
    phone: '+5511987654321', 
    instanceName: 'tech_solutions_vendas',
    company: 'Tech Solutions Ltda',
    companyId: '1',
    status: 'disconnected',
    lastActivity: '2024-05-12 10:30',
    messages: 78
  },
  { 
    id: '3', 
    name: 'Suporte', 
    phone: '+5511923456789', 
    instanceName: 'marketing_digital_suporte',
    company: 'Marketing Digital SA',
    companyId: '2',
    status: 'connected',
    lastActivity: '2024-05-13 16:10',
    messages: 229
  },
  { 
    id: '4', 
    name: 'Vendas', 
    phone: '+5511998765432', 
    instanceName: 'marketing_digital_vendas',
    company: 'Marketing Digital SA',
    companyId: '2',
    status: 'error',
    lastActivity: '2024-05-11 14:20',
    messages: 54
  },
  { 
    id: '5', 
    name: 'Atendimento', 
    phone: '+5511934567890', 
    instanceName: 'eletronicos_brasil',
    company: 'Comércio Eletrônico Brasil',
    companyId: '3',
    status: 'connecting',
    lastActivity: '2024-05-13 09:15',
    messages: 12
  }
];

export default function WhatsAppPanel() {
  const [instances] = useState(mockWhatsAppInstances);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);

  const companies = [
    { id: '1', name: 'Tech Solutions Ltda' },
    { id: '2', name: 'Marketing Digital SA' },
    { id: '3', name: 'Comércio Eletrônico Brasil' },
    { id: '4', name: 'Agência de Viagens Turismo' },
    { id: '5', name: 'Consultoria Empresarial' },
  ];
  
  const filteredInstances = instances.filter(instance => {
    const matchesSearch = 
      instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.phone.includes(searchTerm) ||
      instance.instanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || instance.companyId === companyFilter;
    
    return matchesSearch && matchesStatus && matchesCompany;
  });
  
  // Sincronização global de todas as instâncias (Edge Function)
  const handleGlobalSync = async () => {
    try {
      setIsGlobalSyncing(true);
      const response = await fetch("/functions/v1/sync_all_whatsapp_instances", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Erro ao invocar função de sync global");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      toast.success("Status de todas as instâncias WhatsApp atualizado!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao sincronizar status global.");
    } finally {
      setIsGlobalSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Instâncias WhatsApp</CardTitle>
              <CardDescription>
                Monitore todas as conexões WhatsApp integradas via Evolution API
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-1"
                onClick={handleGlobalSync}
                disabled={isGlobalSyncing}
              >
                {isGlobalSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Atualizar Status
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <WhatsAppFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            companyFilter={companyFilter}
            setCompanyFilter={setCompanyFilter}
            companies={companies}
          />
        </CardHeader>
        <CardContent>
          <WhatsAppInstanceTable
            filteredInstances={filteredInstances}
            getStatusBadge={getStatusBadge}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredInstances.length} de {instances.length} instâncias
          </div>
          <div className="text-sm text-muted-foreground">
            Última verificação: 13/05/2024 16:30
          </div>
        </CardFooter>
      </Card>
      
      <SystemDiagnostic />
    </div>
  );
}
