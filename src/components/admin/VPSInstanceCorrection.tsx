
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserCheck, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export const VPSInstanceCorrection = () => {
  const [phoneFilter, setPhoneFilter] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const correctInstanceBinding = async () => {
    if (!phoneFilter.trim() || !userEmail.trim()) {
      toast.error('Preencha o telefone e o email do usuário');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Instance Correction] 🔧 Iniciando correção manual:', { phoneFilter, userEmail });

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'bind_instance_to_user',
          phoneFilter: phoneFilter.trim(),
          userEmail: userEmail.trim()
        }
      });

      if (error) {
        console.error('[Instance Correction] ❌ Erro na edge function:', error);
        throw error;
      }

      console.log('[Instance Correction] ✅ Resposta da correção:', data);

      if (data.success) {
        toast.success(`Instância vinculada com sucesso ao usuário ${data.user.name} (${data.user.company})`);
        
        // Limpar campos após sucesso
        setPhoneFilter('');
        setUserEmail('');
      } else {
        toast.error('Falha na correção: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Instance Correction] 💥 Erro inesperado:', error);
      toast.error('Erro ao corrigir vinculação: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Correção Manual de Vinculação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phoneFilter">Filtro de Telefone</Label>
            <Input
              id="phoneFilter"
              placeholder="Ex: 8888 (parte do telefone)"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="userEmail">Email do Usuário</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="usuario@empresa.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            onClick={correctInstanceBinding}
            disabled={isLoading || !phoneFilter.trim() || !userEmail.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-spin" />
                Corrigindo...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Corrigir Vinculação
              </>
            )}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Exemplo de uso:</strong></p>
            <p>• Telefone: "8888" → busca instâncias com telefone contendo 8888</p>
            <p>• Email: "usuario@empresa.com" → vincula à empresa deste usuário</p>
            <p>• A instância será renomeada automaticamente baseada no username</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
