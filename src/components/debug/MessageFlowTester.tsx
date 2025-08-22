
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Bot, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useWhatsAppContacts, UseWhatsAppContactsParams } from '@/hooks/whatsapp/useWhatsAppContacts';

interface MessageFlowTesterProps {
  instanceId?: string;
}

interface TestMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'bot';
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export function MessageFlowTester({ instanceId }: MessageFlowTesterProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use proper parameters object for the hook
  const contactsParams: UseWhatsAppContactsParams = {
    instanceId: instanceId || '',
    searchTerm: phoneNumber
  };
  
  const { data: contacts, isLoading: contactsLoading } = useWhatsAppContacts(contactsParams);

  const handleSendTestMessage = async () => {
    if (!phoneNumber || !messageContent) return;

    setIsLoading(true);
    
    const newMessage: TestMessage = {
      id: Date.now().toString(),
      content: messageContent,
      timestamp: new Date(),
      type: 'user',
      status: 'sent'
    };

    setTestMessages(prev => [...prev, newMessage]);

    try {
      // Simulate message sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status
      setTestMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );

      // Simulate bot response
      setTimeout(() => {
        const botResponse: TestMessage = {
          id: (Date.now() + 1).toString(),
          content: `Resposta automática para: ${messageContent}`,
          timestamp: new Date(),
          type: 'bot',
          status: 'delivered'
        };
        setTestMessages(prev => [...prev, botResponse]);
      }, 2000);

    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      setTestMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessageContent('');
    }
  };

  const getStatusIcon = (status: TestMessage['status']) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'read':
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Testador de Fluxo de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Número de Telefone</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5511999999999"
                type="tel"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Instância</label>
              <Input
                value={instanceId || ''}
                disabled
                placeholder="ID da instância WhatsApp"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Mensagem de Teste</label>
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Digite a mensagem para testar o fluxo..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSendTestMessage}
            disabled={!phoneNumber || !messageContent || isLoading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Enviando...' : 'Enviar Mensagem de Teste'}
          </Button>
        </CardContent>
      </Card>

      {testMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {testMessages.map((message, index) => (
                <div key={message.id}>
                  <div className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <div className={`flex items-center gap-2 max-w-[70%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.type === 'bot' && <Bot className="h-4 w-4" />}
                      {message.type === 'user' && <User className="h-4 w-4" />}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {getStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < testMessages.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {contacts && contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contatos Relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                  <Badge variant="outline">
                    {contact.unread_count || 0} não lidas
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
