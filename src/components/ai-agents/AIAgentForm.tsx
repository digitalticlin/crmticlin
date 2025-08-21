import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AIAgent } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EnhancedPromptConfiguration } from './EnhancedPromptConfiguration';
import { useWhatsAppInstanceStore } from '@/hooks/whatsapp/whatsappInstanceStore';

interface AIAgentFormProps {
  onSuccess?: () => void;
}

export const AIAgentForm = ({ onSuccess }: AIAgentFormProps) => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<AIAgent['type']>('customer_service');
  const [status, setStatus] = useState<AIAgent['status']>('inactive');
  const [funnelId, setFunnelId] = useState<string | null>(null);
  const [whatsappNumberId, setWhatsappNumberId] = useState<string | null>(null);
  const [globalNotifyPhone, setGlobalNotifyPhone] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { instances } = useWhatsAppInstanceStore();

  const fetchAgents = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('created_by_user_id', user.id);

      if (error) throw error;

      // Fix: Map the data to match AIAgent type
      const mappedAgents = (data || []).map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type || 'customer_service',
        status: agent.status || 'inactive',
        messages_count: agent.messages_count || 0,
        created_by_user_id: agent.created_by_user_id,
        funnel_id: agent.funnel_id,
        whatsapp_number_id: agent.whatsapp_number_id,
        global_notify_phone: agent.global_notify_phone,
        created_at: agent.created_at,
        updated_at: agent.updated_at
      })) as AIAgent[];

      setAgents(mappedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Erro ao carregar agentes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado.",
        });
        return;
      }

      const newAgent: Omit<AIAgent, 'id' | 'messages_count' | 'created_at' | 'updated_at'> = {
        name,
        type,
        status,
        created_by_user_id: user.id,
        funnel_id: funnelId,
        whatsapp_number_id: whatsappNumberId,
        global_notify_phone,
      };

      const { data, error } = await supabase
        .from('ai_agents')
        .insert([
          {
            ...newAgent,
            id: uuidv4(),
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      fetchAgents();
      toast.success('Agente criado com sucesso!');
      onSuccess?.();
      setName('');
      setType('customer_service');
      setStatus('inactive');
      setFunnelId(null);
      setWhatsappNumberId(null);
      setGlobalNotifyPhone(null);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [user?.id]);

  return (
    <div className="container mx-auto py-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Nome do Agente</FormLabel>
          <FormControl>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <FormDescription>
            Dê um nome para este agente.
          </FormDescription>
          <FormMessage />
        </div>

        <div>
          <FormLabel>Tipo de Agente</FormLabel>
          <Select value={type} onValueChange={(value) => setType(value as AIAgent['type'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer_service">Atendimento ao Cliente</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="support">Suporte Técnico</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Selecione o tipo de agente.
          </FormDescription>
          <FormMessage />
        </div>

        <div>
          <FormLabel>Status do Agente</FormLabel>
          <Select value={status} onValueChange={(value) => setStatus(value as AIAgent['status'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Selecione o status do agente.
          </FormDescription>
          <FormMessage />
        </div>

        <div>
          <FormLabel>WhatsApp Instance</FormLabel>
          <Select value={whatsappNumberId || ''} onValueChange={(value) => setWhatsappNumberId(value === '' ? null : value)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione a instância" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhuma</SelectItem>
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.instance_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Selecione a instância do WhatsApp para este agente.
          </FormDescription>
          <FormMessage />
        </div>

        <div>
          <FormLabel>Telefone para Notificações Globais</FormLabel>
          <FormControl>
            <Input
              type="tel"
              value={globalNotifyPhone || ''}
              onChange={(e) => setGlobalNotifyPhone(e.target.value === '' ? null : e.target.value)}
              placeholder="Número de telefone"
            />
          </FormControl>
          <FormDescription>
            Número de telefone para receber notificações importantes.
          </FormDescription>
          <FormMessage />
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Criando...' : 'Criar Agente'}
        </Button>
      </form>

      <Table>
        <TableCaption>Lista de Agentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="font-medium">{agent.name}</TableCell>
              <TableCell>{agent.type}</TableCell>
              <TableCell>{agent.status}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Configurar Prompt</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Configurar Prompt</DialogTitle>
                      <DialogDescription>
                        Configure o prompt para o agente {agent.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <EnhancedPromptConfiguration agentId={agent.id} />
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
