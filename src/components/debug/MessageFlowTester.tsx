
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { toast } from 'sonner';

export function MessageFlowTester() {
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Mensagem de teste');
  const [isLoading, setIsLoading] = useState(false);
  
  const { getActiveInstance } = useWhatsAppDatabase();
  const activeInstance = getActiveInstance();
  
  const contactsHook = useWhatsAppContacts({
    activeInstanceId: activeInstance?.id || null
  });

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite um número de telefone');
      return;
    }
    
    if (!activeInstance) {
      toast.error('Nenhuma instância WhatsApp ativa');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular inserção de mensagem de teste
      const testContact = {
        id: 'test-' + Date.now(),
        name: 'Teste',
        phone: testPhone,
        lastMessage: testMessage,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 1
      };
      
      contactsHook.addNewContact(testContact);
      toast.success('Teste de fluxo executado com sucesso!');
      
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro ao executar teste');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Teste de Fluxo de Mensagens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Ex: 5562999999999"
          />
        </div>
        
        <div>
          <Label htmlFor="message">Mensagem</Label>
          <Input
            id="message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Mensagem de teste"
          />
        </div>
        
        <Button 
          onClick={handleTest}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testando...' : 'Executar Teste'}
        </Button>
        
        <div className="text-sm text-gray-600">
          <p>Instância ativa: {activeInstance?.instance_name || 'Nenhuma'}</p>
          <p>Contatos carregados: {contactsHook.contacts.length}</p>
        </div>
      </CardContent>
    </Card>
  );
}
