import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadDetailsSidebarProps {
  lead: any;
  onClose: () => void;
  onUpdate?: () => void;
}

interface DealHistoryItem {
  id: string;
  type: 'win' | 'loss' | 'negotiation' | 'proposal';
  value: number;
  date: string;
  stage: string;
  notes?: string;
}

const LeadDetailsSidebar = ({ lead, onClose, onUpdate }) => {
  const [editedLead, setEditedLead] = useState({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    notes: lead.notes,
  });

  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', lead.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lead atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar lead');
      console.error('Error updating lead:', error);
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      toast.success('Lead excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir lead');
      console.error('Error deleting lead:', error);
    }
  });

  const handleSave = () => {
    updateLeadMutation.mutate({
      name: editedLead.name,
      phone: editedLead.phone,
      email: editedLead.email,
      notes: editedLead.notes,
    });
  };

  const dealHistoryItems: DealHistoryItem[] = [
    {
      id: '1',
      type: 'win', // Fix: use 'win' instead of 'won'
      value: 1500,
      date: '2024-01-15',
      stage: 'Fechamento',
      notes: 'Venda concluída com sucesso'
    },
    {
      id: '2',
      type: 'negotiation',
      value: 800,
      date: '2024-02-01',
      stage: 'Proposta Enviada',
      notes: 'Aguardando feedback do cliente'
    },
    {
      id: '3',
      type: 'proposal',
      value: 1200,
      date: '2024-02-10',
      stage: 'Qualificação',
      notes: 'Cliente interessado, agendada reunião'
    },
    {
      id: '4',
      type: 'loss', // Fix: use 'loss' instead of 'lost'
      value: 500,
      date: '2024-03-01',
      stage: 'Contato Inicial',
      notes: 'Cliente optou por outra solução'
    },
  ];

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Lead</CardTitle>
          <CardDescription>
            Informações sobre o lead selecionado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={editedLead.name}
              onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={editedLead.phone}
              onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={editedLead.email || ''}
              onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="notes">Anotações</Label>
            <Textarea
              id="notes"
              value={editedLead.notes || ''}
              onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateLeadMutation.isLoading}>
              {updateLeadMutation.isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Negociações</CardTitle>
          <CardDescription>
            Últimas negociações com este lead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {dealHistoryItems.map((item) => (
            <div key={item.id} className="border rounded-md p-2">
              <div className="font-semibold">Negociação {item.type}</div>
              <div className="text-sm">Valor: R$ {item.value}</div>
              <div className="text-sm">Data: {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}</div>
              <div className="text-sm">Etapa: {item.stage}</div>
              {item.notes && <div className="text-sm">Notas: {item.notes}</div>}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button
          variant="destructive"
          onClick={() => deleteLeadMutation.mutate()}
          disabled={deleteLeadMutation.isLoading}
        >
          {deleteLeadMutation.isLoading ? 'Excluindo...' : 'Excluir Lead'}
        </Button>
      </div>
    </div>
  );
};

export default LeadDetailsSidebar;
