import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Bug, User, Database, Zap } from "lucide-react";

export const FunnelDiagnostic = () => {
  const { user, session } = useAuth();
  const { funnels, selectedFunnel, loading } = useFunnelManagement();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setDebugInfo({
      timestamp: new Date().toISOString(),
      authContext: {
        hasUser: !!user,
        userId: user?.id || 'null',
        email: user?.email || 'null',
        hasSession: !!session
      },
      funnelData: {
        loading,
        funnelsCount: funnels?.length || 0,
        selectedFunnel: selectedFunnel?.name || 'null'
      }
    });
  }, [user, session, loading, funnels, selectedFunnel]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const testSupabaseConnection = async () => {
    console.log('🧪 Iniciando teste direto do Supabase...');
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Teste 1: Verificar usuário atual
      const { data: currentUser, error: authError } = await supabase.auth.getUser();
      console.log('Usuário atual:', currentUser, 'Erro:', authError);
      
      if (currentUser.user) {
        // Teste 2: Buscar funis
        const { data: funnelsData, error: funnelsError } = await supabase
          .from('funnels')
          .select('*');
        
        console.log('Funis encontrados:', funnelsData, 'Erro:', funnelsError);
        
        alert(`✅ Teste concluído!\nUsuário: ${currentUser.user.email}\nFunis: ${funnelsData?.length || 0}`);
      } else {
        alert('❌ Usuário não autenticado no Supabase');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      alert('❌ Erro no teste: ' + error);
    }
  };

  const testReactContext = () => {
    try {
      console.log('Teste de contexto iniciado');
      alert('Contexto React funcionando normalmente!');
    } catch (error) {
      console.error('Erro no teste de contexto:', error);
      alert('Erro no contexto: ' + error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔧 Diagnóstico do Funil de Vendas</h2>
          <p className="text-gray-600 mt-1">Análise completa do sistema de funil de vendas</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* STATUS DE AUTENTICAÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Status de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${user ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`font-medium ${user ? 'text-green-800' : 'text-red-800'}`}>
              {user ? '✅ Usuário Autenticado' : '❌ Usuário NÃO Autenticado'}
            </p>
            {user && (
              <div className="mt-2 text-sm text-green-700">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Sessão:</strong> {session ? 'Ativa' : 'Inativa'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* STATUS DOS FUNIS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            Dados do Funil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${
            loading ? 'bg-yellow-50 border-yellow-200' : 
            funnels?.length ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {loading && (
              <div className="flex items-center text-yellow-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                <span className="font-medium">⏳ Carregando funis...</span>
              </div>
            )}
            
            {!loading && funnels?.length && (
              <div className="text-green-800">
                <p className="font-medium">✅ Funis Carregados com Sucesso</p>
                <div className="mt-2 text-sm">
                  <p><strong>Total de funis:</strong> {funnels.length}</p>
                  <p><strong>Funil selecionado:</strong> {selectedFunnel?.name || 'Nenhum'}</p>
                </div>
              </div>
            )}
            
            {!loading && (!funnels || funnels.length === 0) && (
              <div className="text-red-800">
                <p className="font-medium">❌ Nenhum Funil Encontrado</p>
                <p className="text-sm mt-1">
                  {user ? 'O usuário está autenticado mas não há funis no banco.' : 'Usuário não autenticado - impossível carregar funis.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TESTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teste de Contexto React */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-blue-500" />
              Teste de Contexto React
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Teste se o contexto React está funcionando corretamente
            </p>
            <Button 
              onClick={testReactContext}
              className="w-full gap-2"
              variant="outline"
            >
              <Bug className="h-4 w-4" />
              Testar Contexto
            </Button>
          </CardContent>
        </Card>

        {/* Teste de Conexão Supabase */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Teste Direto Supabase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Teste direto da conexão com o banco Supabase
            </p>
            <Button 
              onClick={testSupabaseConnection}
              className="w-full gap-2"
              variant="outline"
            >
              <Zap className="h-4 w-4" />
              Testar Supabase
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* DEBUG DETALHADO */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Info Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="cursor-pointer">
              <summary className="font-medium text-gray-700 hover:text-gray-900 mb-3">
                Click para expandir debug completo
              </summary>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60 mt-3">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 