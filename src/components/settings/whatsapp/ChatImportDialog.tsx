
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, 
  Settings, 
  Users, 
  MessageSquare, 
  Database,
  Info,
  Zap
} from "lucide-react";
import { useChatImport } from "@/hooks/whatsapp/useChatImport";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface ChatImportDialogProps {
  instance: WhatsAppWebInstance;
  trigger?: React.ReactNode;
}

export const ChatImportDialog = ({ instance, trigger }: ChatImportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [importType, setImportType] = useState<'contacts' | 'messages' | 'both'>('both');
  const [batchSize, setBatchSize] = useState([30]);
  
  const { isImporting, importData } = useChatImport();

  const handleImport = async () => {
    const result = await importData(instance.id, importType, batchSize[0]);
    if (result?.success) {
      setIsOpen(false);
    }
  };

  const getBatchDescription = (size: number) => {
    if (size <= 20) return "Lento e Seguro";
    if (size <= 40) return "Balanceado";
    return "Rápido (pode sobrecarregar)";
  };

  const getEstimatedTime = (type: string, size: number) => {
    const baseTime = type === 'both' ? 5 : type === 'messages' ? 3 : 2;
    const multiplier = size <= 20 ? 1.5 : size <= 40 ? 1 : 0.7;
    return Math.round(baseTime * multiplier);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar Importação
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Configurar Importação
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros para importar dados do WhatsApp da instância "{instance.instance_name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Importação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Dados</Label>
            <RadioGroup value={importType} onValueChange={(value: any) => setImportType(value)}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4" />
                    Contatos + Mensagens (Completo)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contacts" id="contacts" />
                  <Label htmlFor="contacts" className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Apenas Contatos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="messages" id="messages" />
                  <Label htmlFor="messages" className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Apenas Mensagens
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Tamanho do Lote */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Velocidade da Importação</Label>
            <div className="space-y-3">
              <Slider
                value={batchSize}
                onValueChange={setBatchSize}
                max={60}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Lento</span>
                <span className="font-medium">
                  {batchSize[0]} itens/lote - {getBatchDescription(batchSize[0])}
                </span>
                <span>Rápido</span>
              </div>
            </div>
          </div>

          {/* Previsão */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Tempo Estimado: ~{getEstimatedTime(importType, batchSize[0])} minutos
                  </p>
                  <p className="text-xs text-blue-700">
                    {importType === 'both' && "Importará contatos primeiro, depois mensagens"}
                    {importType === 'contacts' && "Verificará duplicatas antes de importar"}
                    {importType === 'messages' && "Criará contatos automaticamente se necessário"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dica de Performance */}
          <Card className="bg-amber-50/50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">
                    Dica de Performance
                  </p>
                  <p className="text-xs text-amber-700">
                    Para primeiras importações, use velocidade "Balanceado". 
                    Para sincronizações rápidas, pode usar "Rápido".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isImporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? 'Importando...' : 'Iniciar Importação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
