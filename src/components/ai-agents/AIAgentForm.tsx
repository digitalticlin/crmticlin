
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent } from "@/types/aiAgent";

export interface AIAgentFormProps {
  agent?: AIAgent;
  onSave: (savedAgent: AIAgent) => void;
  onCancel: () => void;
  onFormChange: (hasChanges: boolean) => void;
}

export function AIAgentForm({ agent, onSave, onCancel, onFormChange }: AIAgentFormProps) {
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    type: agent?.type || "customer_service",
    status: agent?.status || "active",
    funnel_id: agent?.funnel_id || "",
    whatsapp_number_id: agent?.whatsapp_number_id || "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [availableFunnels, setAvailableFunnels] = useState<any[]>([]);
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);

  useEffect(() => {
    onFormChange(hasChanges);
  }, [hasChanges, onFormChange]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const savedAgent: AIAgent = {
      id: agent?.id || crypto.randomUUID(),
      name: formData.name,
      funnel_id: formData.funnel_id,
      whatsapp_number_id: formData.whatsapp_number_id,
      type: formData.type,
      status: formData.status,
      messages_count: agent?.messages_count || 0,
      created_by_user_id: agent?.created_by_user_id || "user-1",
      created_at: agent?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(savedAgent);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Agente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Agente</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Ex: Atendente Virtual"
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer_service">Atendimento ao Cliente</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="testing">Em Teste</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
