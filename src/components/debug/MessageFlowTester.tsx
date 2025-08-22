
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, User, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export const MessageFlowTester = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste do sistema.');
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendTest = async () => {
    if (!phoneNumber || !testMessage || !selectedInstanceId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Mock test sending since we don't have the actual API
      toast.success('Mensagem de teste enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      toast.error('Erro ao enviar mensagem de teste');
    }
  };

  const loadContacts = async () => {
    if (!selectedInstanceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock contacts loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContacts([
        { name: 'Contato 1', phone: '5511999999999' },
        { name: 'Contato 2', phone: '5511888888888' }
      ]);
    } catch (err) {
      setError('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedInstanceId) {
      loadContacts();
    }
  }, [selectedInstanceId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Testador de Fluxo de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Instância WhatsApp</label>
            <Input
              placeholder="ID da instância"
              value={selectedInstanceId}
              onChange={(e) => setSelectedInstanceId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Número de Telefone</label>
            <Input
              placeholder="5511999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mensagem de Teste</label>
            <Input
              placeholder="Digite sua mensagem..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSendTest}
            className="w-full"
            disabled={!phoneNumber || !testMessage || !selectedInstanceId}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Teste
          </Button>
        </CardContent>
      </Card>

      {selectedInstanceId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contatos da Instância
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Carregando contatos...</span>
              </div>
            )}

            {error && (
              <div className="text-red-500 p-4">
                Erro ao carregar contatos: {error}
              </div>
            )}

            {contacts && contacts.length > 0 && (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {contacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{contact.name || contact.phone}</span>
                    <Badge variant="outline">{contact.phone}</Badge>
                  </div>
                ))}
              </div>
            )}

            {contacts && contacts.length === 0 && !loading && (
              <div className="text-center text-muted-foreground p-4">
                Nenhum contato encontrado
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
