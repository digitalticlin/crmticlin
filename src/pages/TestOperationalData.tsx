import React from 'react';
import { useDataFilters } from '@/hooks/useDataFilters';
import { useLeadsDatabaseWithFilters } from '@/hooks/salesFunnel/useLeadsDatabaseWithFilters';
import { useSalesFunnelWithFilters } from '@/hooks/salesFunnel/useSalesFunnelWithFilters';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Target, Database, CheckCircle, XCircle, Clock } from 'lucide-react';

/**
 * 🧪 PÁGINA DE TESTE PARA VERIFICAR FILTROS OPERACIONAIS
 * - Mostra dados que o usuário operacional tem acesso
 * - Compara com sistema atual vs sistema com filtros
 * - Debug completo para validação
 */
const TestOperationalData: React.FC = () => {
  const { user } = useAuth();
  const { 
    role, 
    funnelsFilter, 
    leadsFilter, 
    whatsappFilter, 
    loading: filtersLoading 
  } = useDataFilters();

  // 🧪 Teste: Hook com filtros
  const {
    funnels: filteredFunnels,
    selectedFunnel: filteredSelectedFunnel,
    leads: filteredLeads,
    loading: filteredLoading,
    hasPermission: filteredPermission
  } = useSalesFunnelWithFilters();

  // 🎯 Status geral
  const isOperational = role === 'operational';
  const hasData = filteredFunnels?.length > 0;
  const hasLeads = filteredLeads?.length > 0;

  if (filtersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-700">Carregando filtros de dados...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teste de Dados Operacionais</h1>
              <p className="text-gray-600">Validação de filtros e permissões por role</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={isOperational ? "default" : "secondary"}
              className="px-4 py-2 text-sm"
            >
              {role === 'admin' ? '👑 ADMIN' : isOperational ? '🎯 OPERACIONAL' : '❓ INDEFINIDO'}
            </Badge>
          </div>
        </div>

        {/* Informações do Usuário */}
        <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Informações da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">ID do Usuário</p>
              <p className="text-sm text-gray-900 font-mono">{user?.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-sm text-gray-900">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role Detectada</p>
              <p className="text-sm text-gray-900 font-semibold">{role || 'Carregando...'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Permissões</p>
              <div className="flex items-center gap-2">
                {filteredPermission ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">
                  {filteredPermission ? 'Configuradas' : 'Pendentes'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros Aplicados */}
        <Card className="border-purple-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Filtros Aplicados ({role})
            </CardTitle>
            <CardDescription>
              Filtros automáticos baseados no seu nível de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Filtro de Funis */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">🎯 Filtro de Funis</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs text-gray-700">
                    {JSON.stringify(funnelsFilter, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Filtro de Leads */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">👤 Filtro de Leads</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs text-gray-700">
                    {JSON.stringify(leadsFilter, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Filtro WhatsApp */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">📱 Filtro WhatsApp</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs text-gray-700">
                    {JSON.stringify(whatsappFilter, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados dos Testes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Funis Acessíveis */}
          <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Funis Acessíveis
              </CardTitle>
              <CardDescription>
                Funis que você tem permissão para visualizar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Carregando funis...</span>
                </div>
              ) : hasData ? (
                <div className="space-y-3">
                  {filteredFunnels.map((funnel) => (
                    <div 
                      key={funnel.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{funnel.name}</p>
                        <p className="text-xs text-gray-600">ID: {funnel.id}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {funnel.id === filteredSelectedFunnel?.id ? 'Selecionado' : 'Disponível'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum funil acessível encontrado</p>
                  <p className="text-xs mt-1">
                    {isOperational ? 'Verifique se há funis atribuídos na tabela user_funnels' : 'Crie funis ou verifique permissões'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads Acessíveis */}
          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Leads Acessíveis
              </CardTitle>
              <CardDescription>
                Leads que você tem permissão para visualizar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Carregando leads...</span>
                </div>
              ) : hasLeads ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filteredLeads.slice(0, 5).map((lead) => (
                    <div 
                      key={lead.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        <p className="text-xs text-gray-600">
                          {lead.phone} • Owner: {lead.owner_id}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {lead.unread_count || 0} msgs
                      </Badge>
                    </div>
                  ))}
                  {filteredLeads.length > 5 && (
                    <p className="text-center text-sm text-gray-500 pt-2 border-t">
                      ... e mais {filteredLeads.length - 5} leads
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum lead acessível encontrado</p>
                  <p className="text-xs mt-1">
                    {isOperational ? 'Verifique se há leads atribuídos (owner_id)' : 'Crie leads ou verifique permissões'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status dos Testes */}
        <Card className="border-indigo-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>✅ Resumo dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  role ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {role ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <p className="font-medium">Role Detection</p>
                <p className="text-xs text-gray-600">{role ? 'Funcionando' : 'Falhou'}</p>
              </div>

              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  filteredPermission ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {filteredPermission ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <p className="font-medium">Permissions</p>
                <p className="text-xs text-gray-600">{filteredPermission ? 'Configuradas' : 'Pendentes'}</p>
              </div>

              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  hasData ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {hasData ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <p className="font-medium">Funnels Access</p>
                <p className="text-xs text-gray-600">{hasData ? `${filteredFunnels.length} found` : 'No access'}</p>
              </div>

              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  hasLeads ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {hasLeads ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <p className="font-medium">Leads Access</p>
                <p className="text-xs text-gray-600">{hasLeads ? `${filteredLeads.length} found` : 'No access'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="border-gray-200 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>📋 Instruções de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">🔍 Como Testar:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Acesse como usuário <strong>operacional</strong></li>
                  <li>Verifique se a role está sendo detectada corretamente</li>
                  <li>Confirme se os filtros estão configurados</li>
                  <li>Valide se apenas dados atribuídos aparecem</li>
                  <li>Compare com o sistema original</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📊 Dados Esperados (Operacional):</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>Funis:</strong> Apenas os listados na tabela user_funnels</li>
                  <li><strong>Leads:</strong> Apenas os com owner_id = seu user_id</li>
                  <li><strong>WhatsApp:</strong> Apenas instâncias da tabela user_whatsapp_numbers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default TestOperationalData;