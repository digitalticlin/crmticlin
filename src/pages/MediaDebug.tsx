import React, { useState } from 'react';
import { ModernPageHeader } from '@/components/layout/ModernPageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaDebugPanel } from '@/components/debug/MediaDebugPanel';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useActiveWhatsAppInstance } from '@/hooks/whatsapp/useActiveWhatsAppInstance';
import { Contact } from '@/types/chat';

export default function MediaDebug() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { activeInstance } = useActiveWhatsAppInstance();
  const { contacts, isLoading: isLoadingContacts } = useWhatsAppContacts(activeInstance?.id);

  return (
    <div className="container mx-auto px-4 py-6">
      <ModernPageHeader
        title="Debug de Mídias do WhatsApp"
        description="Ferramenta para diagnosticar problemas com exibição de mídias no chat"
        icon="🔍"
      />

      <div className="space-y-6">
        {/* Seletor de Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Contato para Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Select 
                onValueChange={(value) => {
                  const contact = contacts.find(c => c.id === value);
                  setSelectedContact(contact || null);
                }}
                disabled={isLoadingContacts}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={
                    isLoadingContacts ? "Carregando contatos..." : "Selecione um contato"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} ({contact.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedContact && (
                <div className="text-sm text-muted-foreground">
                  Contato selecionado: <strong>{selectedContact.name}</strong>
                </div>
              )}
            </div>
            
            {!activeInstance && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                ⚠️ Nenhuma instância do WhatsApp ativa encontrada. 
                Configure uma instância primeiro.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Instância */}
        {activeInstance && (
          <Card>
            <CardHeader>
              <CardTitle>Instância Ativa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>ID:</strong> {activeInstance.id}</div>
                <div><strong>Nome:</strong> {activeInstance.name}</div>
                <div><strong>Status:</strong> {activeInstance.status}</div>
                <div><strong>Número:</strong> {activeInstance.phone_number}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Painel de Debug de Mídias */}
        <MediaDebugPanel 
          selectedContact={selectedContact} 
          activeInstance={activeInstance} 
        />

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como usar este debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>🟢 OK:</strong> A mensagem tem mídia corretamente configurada com URL funcionando
            </div>
            <div>
              <strong>🟡 CACHE_ONLY:</strong> A mensagem tem dados no cache mas sem URL direta
            </div>
            <div>
              <strong>🔴 MISSING:</strong> A mensagem deveria ter mídia mas está faltando dados
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <strong>💡 Dica:</strong> Se você ver muitas mensagens CACHE_ONLY, isso indica que 
              o problema foi corrigido no frontend, mas pode ser necessário corrigir o webhook 
              para futuras mensagens.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 