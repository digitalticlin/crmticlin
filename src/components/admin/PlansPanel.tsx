
import { useState } from "react";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, EditIcon, Trash2Icon } from "lucide-react";
import { plansData } from "@/data/plansData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlansPanel() {
  const [plans, setPlans] = useState(plansData);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("plans");
  
  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#d3d800] hover:bg-[#b8bc00]">
            <Plus className="h-4 w-4 mr-1" /> Novo Plano
          </Button>
        </div>
        
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        R$ {plan.price}/mês
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditPlan(plan)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500">
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Números WhatsApp</span>
                      <span className="font-medium">{plan.limits.whatsappNumbers}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Membros de equipe</span>
                      <span className="font-medium">{plan.limits.teamMembers}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Agentes de IA</span>
                      <span className="font-medium">{plan.limits.aiAgents}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Recursos incluídos</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <span className="text-[#d3d800] mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Assinaturas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as assinaturas ativas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conteúdo para gerenciamento de assinaturas será implementado aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Visualize os pagamentos recebidos e status financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conteúdo para histórico de pagamentos será implementado aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Plan Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Plano</DialogTitle>
            <DialogDescription>
              Crie um novo plano para oferecer aos clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">Formulário de criação de plano será implementado aqui.</p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#d3d800] hover:bg-[#b8bc00]">Salvar Plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualize os detalhes do plano {selectedPlan?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">Formulário de edição de plano será implementado aqui.</p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#d3d800] hover:bg-[#b8bc00]">Atualizar Plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
