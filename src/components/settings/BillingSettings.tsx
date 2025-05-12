
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BillingSettings = () => {
  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Faturamento e Assinatura</CardTitle>
        <CardDescription>
          Gerencie sua assinatura, método de pagamento e faturamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Plano Atual</Label>
          <div className="p-4 rounded-lg bg-white/10 dark:bg-black/10 flex justify-between items-center">
            <div>
              <h3 className="font-medium">Plano Pro</h3>
              <p className="text-sm text-muted-foreground">
                Faturamento mensal - Próximo pagamento em 15/06/2024
              </p>
            </div>
            <Badge className="bg-ticlin text-black">R$199/mês</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" className="text-xs h-8">
              Alterar Plano
            </Button>
            <Button variant="outline" className="text-xs h-8">
              Cancelar Assinatura
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <div className="p-4 rounded-lg bg-white/10 dark:bg-black/10 flex justify-between items-center">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 mr-4" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expira em 06/2025</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Histórico de Faturas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Valor</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-sm">15/05/2024</td>
                  <td className="py-2 text-sm">Assinatura Ticlin Pro - Mensal</td>
                  <td className="py-2 text-sm">R$199,00</td>
                  <td className="py-2 text-sm">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                      Pago
                    </Badge>
                  </td>
                  <td className="py-2 text-sm text-right">
                    <Button variant="ghost" size="sm" className="h-7">
                      Baixar
                    </Button>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-sm">15/04/2024</td>
                  <td className="py-2 text-sm">Assinatura Ticlin Pro - Mensal</td>
                  <td className="py-2 text-sm">R$199,00</td>
                  <td className="py-2 text-sm">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                      Pago
                    </Badge>
                  </td>
                  <td className="py-2 text-sm text-right">
                    <Button variant="ghost" size="sm" className="h-7">
                      Baixar
                    </Button>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-sm">15/03/2024</td>
                  <td className="py-2 text-sm">Assinatura Ticlin Pro - Mensal</td>
                  <td className="py-2 text-sm">R$199,00</td>
                  <td className="py-2 text-sm">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                      Pago
                    </Badge>
                  </td>
                  <td className="py-2 text-sm text-right">
                    <Button variant="ghost" size="sm" className="h-7">
                      Baixar
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingSettings;
