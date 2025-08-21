import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useWhatsApp } from '@/hooks/whatsapp/useWhatsApp';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';

interface Message {
  text: string;
  fromMe: boolean;
}

const MessageFlowTester = () => {
  const [phone, setPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage } = useWhatsApp();

  useEffect(() => {
    const fetchInstances = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('created_by_user_id', user.id);

        if (error) throw error;

        setInstances(data || []);
      } catch (error) {
        console.error('Error fetching instances:', error);
        toast({
          title: "Erro ao carregar instâncias",
          description: "Ocorreu um erro ao buscar as instâncias do WhatsApp.",
          variant: "destructive",
        });
      }
    };

    fetchInstances();
  }, [user?.id, toast]);

  const handleSendMessage = async () => {
    if (!phone || !messageText || !selectedInstanceId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessage(selectedInstanceId, phone, messageText);

      setMessages([...messages, { text: messageText, fromMe: true }]);
      setMessageText('');

      toast({
        title: "Mensagem enviada!",
        description: `Mensagem enviada para ${phone} via ${selectedInstanceId}.`,
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Ocorreu um erro ao enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const { 
    contacts, 
    isLoading: contactsLoading 
  } = useWhatsAppContacts({ 
    instanceId: selectedInstanceId || '' 
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testador de Fluxo de Mensagens</CardTitle>
        <CardDescription>
          Envie mensagens de teste para um número específico usando uma instância do WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Select onValueChange={(value) => setSelectedInstanceId(value)}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecionar Instância" />
            </SelectTrigger>
            <SelectContent>
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.instance_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="tel"
            placeholder="Número de Telefone (com DDD)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Input
          type="text"
          placeholder="Mensagem"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <Button onClick={handleSendMessage}>Enviar Mensagem</Button>

        <div>
          <h3>Histórico de Mensagens:</h3>
          {messages.map((message, index) => (
            <div key={index} style={{ textAlign: message.fromMe ? 'right' : 'left' }}>
              {message.text}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageFlowTester;
