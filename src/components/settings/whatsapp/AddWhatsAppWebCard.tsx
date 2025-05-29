
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Wifi } from "lucide-react";

interface AddWhatsAppWebCardProps {
  onAdd: (instanceName: string) => Promise<void>;
  isCreating: boolean;
}

export function AddWhatsAppWebCard({ onAdd, isCreating }: AddWhatsAppWebCardProps) {
  const [instanceName, setInstanceName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim()) return;
    
    await onAdd(instanceName.trim());
    setInstanceName("");
  };

  return (
    <Card className="border-dashed border-2 border-green-300 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-600" />
          <CardTitle className="text-lg text-green-700">Novo WhatsApp Web</CardTitle>
        </div>
        <p className="text-sm text-green-600">
          Conecte uma nova instância WhatsApp usando WhatsApp Web
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Ex: atendimento, vendas..."
              required
              disabled={isCreating}
            />
          </div>

          <Button
            type="submit"
            disabled={isCreating || !instanceName.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Criando...' : 'Criar Instância'}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>WhatsApp Web:</strong> Conexão direta com WhatsApp usando seu próprio servidor.
            Mais estável e confiável.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
