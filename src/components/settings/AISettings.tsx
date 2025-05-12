
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AISettings = () => {
  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Configurações de IA</CardTitle>
        <CardDescription>
          Configure e personalize as integrações de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Agentes de IA</h3>
            <p className="text-sm text-muted-foreground">
              Configure os agentes de IA para atendimento automático
            </p>
          </div>
          <Badge variant="outline" className="bg-ticlin/10 text-black">
            3 de 3 disponíveis
          </Badge>
        </div>
        
        <Button variant="outline" className="w-full">
          <Bot className="h-4 w-4 mr-2" />
          Gerenciar Agentes de IA
        </Button>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preferências de Automação</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resposta Automática</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que agentes de IA respondam automaticamente aos clientes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Movimentação Automática de Funil</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que agentes de IA movam cards no funil Kanban
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sugestões de IA</Label>
              <p className="text-sm text-muted-foreground">
                Exibir sugestões de respostas e ações baseadas em IA
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancelar</Button>
          <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettings;
