
import { useState } from "react";
import { Check, AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CheckStatus = "pending" | "success" | "error" | "running";

interface CheckItem {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  details?: string;
  testFn: () => Promise<boolean>;
}

export default function SystemChecklistPanel() {
  const { isSuperAdmin } = usePermissions();
  const [checkResults, setCheckResults] = useState<CheckItem[]>([
    {
      id: "auth",
      name: "Autenticação",
      description: "Verifica se o sistema de autenticação está funcionando corretamente",
      status: "pending",
      testFn: testAuth
    },
    {
      id: "permissions",
      name: "Permissões",
      description: "Verifica se as regras de permissão estão aplicadas corretamente",
      status: "pending",
      testFn: testPermissions
    },
    {
      id: "whatsapp",
      name: "Integração WhatsApp",
      description: "Verifica se a integração com o WhatsApp está funcionando",
      status: "pending",
      testFn: testWhatsApp
    },
    {
      id: "kanban",
      name: "Kanban de Vendas",
      description: "Verifica o funcionamento do funil de vendas",
      status: "pending",
      testFn: testKanban
    },
    {
      id: "database",
      name: "Banco de Dados",
      description: "Verifica a conectividade com o Supabase",
      status: "pending",
      testFn: testDatabase
    },
    {
      id: "userManagement",
      name: "Gestão de Usuários",
      description: "Verifica o funcionamento do gerenciamento de usuários",
      status: "pending", 
      testFn: testUserManagement
    }
  ]);
  
  const [isRunningAll, setIsRunningAll] = useState(false);

  async function runAllTests() {
    setIsRunningAll(true);
    
    // Reset all tests to pending
    setCheckResults(prev => prev.map(item => ({ ...item, status: "pending" as CheckStatus })));
    
    // Run each test sequentially
    for (const check of checkResults) {
      await runTest(check.id);
    }
    
    setIsRunningAll(false);
    toast.success("Todos os testes foram concluídos");
  }
  
  async function runTest(id: string) {
    // Update status to running
    setCheckResults(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: "running" as CheckStatus } : item
      )
    );
    
    // Find the test item
    const testItem = checkResults.find(item => item.id === id);
    if (!testItem) return;
    
    try {
      // Run the test
      const success = await testItem.testFn();
      
      // Update status based on result
      setCheckResults(prev => 
        prev.map(item => 
          item.id === id ? { 
            ...item, 
            status: success ? "success" : "error" as CheckStatus,
            details: success ? "Teste concluído com sucesso" : "Falha no teste"
          } : item
        )
      );
    } catch (error: any) {
      // Update status to error with details
      setCheckResults(prev => 
        prev.map(item => 
          item.id === id ? { 
            ...item, 
            status: "error" as CheckStatus,
            details: `Erro: ${error.message || "Desconhecido"}`
          } : item
        )
      );
    }
  }
  
  // Test functions
  async function testAuth() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }
  
  async function testPermissions() {
    try {
      // Test if super admin function works
      const { data: superAdminResult, error: superAdminError } = await supabase.rpc('is_super_admin');
      if (superAdminError) throw superAdminError;
      
      // Test if company admin function works
      const { data: companyAdminResult, error: companyAdminError } = await supabase.rpc('is_company_admin');
      if (companyAdminError) throw companyAdminError;
      
      return true;
    } catch (error) {
      console.error("Erro no teste de permissões:", error);
      return false;
    }
  }
  
  async function testWhatsApp() {
    try {
      const { data, error } = await supabase.from('whatsapp_numbers').select('id').limit(1);
      if (error) throw error;
      return data.length > 0;
    } catch {
      return false;
    }
  }
  
  async function testKanban() {
    try {
      const { data, error } = await supabase.from('kanban_stages').select('id').limit(1);
      if (error) throw error;
      return data.length > 0;
    } catch {
      return false;
    }
  }
  
  async function testDatabase() {
    try {
      // Simple health check query
      const { data, error } = await supabase.from('companies').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
  
  async function testUserManagement() {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      return data.length > 0;
    } catch {
      return false;
    }
  }
  
  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getStatusBadge = (status: CheckStatus) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Sucesso</Badge>;
      case "error":
        return <Badge variant="destructive">Falha</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Executando...</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (!isSuperAdmin) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Checklist do Sistema</CardTitle>
          <CardDescription>Você não tem permissão para acessar esta funcionalidade</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de Homologação do Sistema</CardTitle>
        <CardDescription>
          Utilize este painel para verificar a integridade dos principais componentes do sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible>
          {checkResults.map((check) => (
            <AccordionItem key={check.id} value={check.id}>
              <div className="flex items-center justify-between">
                <AccordionTrigger className="flex-1">
                  <div className="flex items-center">
                    <div className="mr-2">{getStatusIcon(check.status)}</div>
                    <span>{check.name}</span>
                  </div>
                </AccordionTrigger>
                
                <div className="flex items-center gap-2 mr-4">
                  {getStatusBadge(check.status)}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      runTest(check.id);
                    }}
                    disabled={check.status === "running" || isRunningAll}
                  >
                    {check.status === "running" ? "Executando..." : "Testar"}
                  </Button>
                </div>
              </div>
              
              <AccordionContent>
                <div className="pt-2 pb-4">
                  <p className="text-sm text-muted-foreground mb-2">{check.description}</p>
                  
                  {check.details && (
                    <div className={`mt-2 p-2 text-sm rounded-md ${
                      check.status === "success" ? "bg-green-50 text-green-800" : 
                      check.status === "error" ? "bg-red-50 text-red-800" : 
                      "bg-gray-50 text-gray-800"
                    }`}>
                      {check.details}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Status: {
            checkResults.every(item => item.status === "success") ? (
              <span className="text-green-600 font-medium">Sistema pronto para produção</span>
            ) : checkResults.some(item => item.status === "error") ? (
              <span className="text-red-600 font-medium">Há problemas a serem corrigidos</span>
            ) : (
              <span className="text-gray-600 font-medium">Teste incompleto</span>
            )
          }
        </div>
        
        <Button 
          onClick={runAllTests} 
          disabled={isRunningAll}
          className="bg-ticlin hover:bg-ticlin/90 text-black"
        >
          {isRunningAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executando testes...
            </>
          ) : (
            "Testar todos os componentes"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
