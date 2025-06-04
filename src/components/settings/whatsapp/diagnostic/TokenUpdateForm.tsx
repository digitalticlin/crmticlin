
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, RefreshCw, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TokenUpdateForm = () => {
  const [newToken, setNewToken] = useState('');
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);

  const updateToken = async () => {
    if (!newToken.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    setIsUpdatingToken(true);
    
    try {
      console.log('[VPS Token Diagnostic] 🔄 Atualizando token VPS...');
      
      // Update VPS_API_TOKEN secret
      const { error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { 
          test: 'update_token',
          newToken: newToken.trim()
        }
      });

      if (error) throw error;

      toast.success('Token atualizado com sucesso! Execute o diagnóstico novamente.');
      setNewToken('');
      
    } catch (error: any) {
      console.error('[VPS Token Diagnostic] ❌ Erro ao atualizar token:', error);
      toast.error(`Erro ao atualizar token: ${error.message}`);
    } finally {
      setIsUpdatingToken(false);
    }
  };

  return (
    <div className="border-t pt-6">
      <h3 className="font-medium mb-4 flex items-center gap-2">
        <Key className="h-4 w-4" />
        Atualizar Token VPS
      </h3>
      
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Se o diagnóstico indicar problemas de autenticação, insira o token correto da VPS aqui.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="newToken">Novo Token VPS</Label>
          <Input
            id="newToken"
            type="password"
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            placeholder="Cole o token da VPS aqui..."
            className="font-mono"
          />
        </div>
        
        <Button 
          onClick={updateToken}
          disabled={isUpdatingToken || !newToken.trim()}
          variant="outline"
          className="w-full"
        >
          {isUpdatingToken ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Token
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
