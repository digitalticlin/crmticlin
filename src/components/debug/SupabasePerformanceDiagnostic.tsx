import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectionInfo {
  connection_id: number;
  ssl: boolean;
  database: string;
  connected_role: string;
  application_name: string;
  ip: string;
  query: string;
  query_start: string;
  state: string;
  backend_start: string;
}

interface DatabaseStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  longestQuery: number;
  avgQueryTime: number;
  totalLeads: number;
  totalMessages: number;
}

export const SupabasePerformanceDiagnostic: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionInfo[]>([]);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);

  // 🚀 ANÁLISE COMPLETA DE CONEXÕES E PERFORMANCE
  const analyzeSupabasePerformance = useCallback(async () => {
    setIsAnalyzing(true);
    const startTime = Date.now();

    try {
      console.log('[Supabase Diagnostic] 🔍 Iniciando análise completa de performance...');

      // 1. ANÁLISE DE CONEXÕES ATIVAS
      const connectionsQuery = `
        SELECT 
          pg_stat_activity.pid as connection_id,
          COALESCE(pg_stat_ssl.ssl, false) as ssl,
          datname as database,
          usename as connected_role,
          COALESCE(application_name, 'unknown') as application_name,
          COALESCE(client_addr::text, 'local') as ip,
          COALESCE(query, 'idle') as query,
          COALESCE(query_start::text, 'never') as query_start,
          COALESCE(state, 'unknown') as state,
          backend_start::text as backend_start
        FROM pg_stat_activity 
        LEFT JOIN pg_stat_ssl ON pg_stat_ssl.pid = pg_stat_activity.pid
        WHERE state IS NOT NULL
        ORDER BY backend_start DESC;
      `;

      const { data: connections, error: connError } = await supabase.rpc('exec_sql', {
        query: connectionsQuery
      });

      if (connError) {
        // Fallback: usar query simplificada se RPC falhar
        console.log('[Supabase Diagnostic] ⚠️ Fallback para query básica de conexões');
        const { data: basicConnections } = await supabase
          .from('pg_stat_activity')
          .select('*')
          .limit(50);
        
        setConnectionStats(basicConnections || []);
      } else {
        setConnectionStats(connections || []);
      }

      // 2. ANÁLISE DE ESTATÍSTICAS DO BANCO
      const [
        { count: totalLeads },
        { count: totalMessages },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      // 3. CALCULAR MÉTRICAS DE PERFORMANCE
      const activeConns = connections?.filter((c: any) => c.state === 'active').length || 0;
      const idleConns = connections?.filter((c: any) => c.state === 'idle').length || 0;
      const totalConns = connections?.length || 0;

      const stats: DatabaseStats = {
        totalConnections: totalConns,
        activeConnections: activeConns,
        idleConnections: idleConns,
        longestQuery: 0, // Será calculado se necessário
        avgQueryTime: 0, // Será calculado se necessário  
        totalLeads: totalLeads || 0,
        totalMessages: totalMessages || 0,
      };

      setDatabaseStats(stats);

      // 4. CALCULAR SCORE DE PERFORMANCE (0-100)
      const analysisTime = Date.now() - startTime;
      let score = 100;

      // Penalizar por muitas conexões ativas
      if (activeConns > 20) score -= 20;
      else if (activeConns > 10) score -= 10;

      // Penalizar por muitas conexões idle
      if (idleConns > 50) score -= 15;
      else if (idleConns > 30) score -= 10;

      // Penalizar por tempo de resposta lento
      if (analysisTime > 3000) score -= 25;
      else if (analysisTime > 1500) score -= 15;
      else if (analysisTime > 1000) score -= 10;

      // Bonificar por boa performance
      if (analysisTime < 500) score += 5;
      if (totalConns < 20) score += 5;

      setPerformanceScore(Math.max(0, Math.min(100, score)));

      console.log('[Supabase Diagnostic] ✅ Análise concluída:', {
        totalConnections: totalConns,
        activeConnections: activeConns,
        idleConnections: idleConns,
        analysisTime: `${analysisTime}ms`,
        score,
        totalLeads: totalLeads || 0,
        totalMessages: totalMessages || 0,
      });

      toast.success(`Análise concluída em ${analysisTime}ms - Score: ${score}/100`);

    } catch (error) {
      console.error('[Supabase Diagnostic] ❌ Erro na análise:', error);
      toast.error('Erro na análise de performance');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // 🎨 FUNÇÃO PARA DETERMINAR COR DO SCORE
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 🎨 FUNÇÃO PARA DETERMINAR COR DO BADGE POR ROLE
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'supabase_admin': return 'bg-blue-100 text-blue-800';
      case 'authenticator': return 'bg-green-100 text-green-800';
      case 'postgres': return 'bg-purple-100 text-purple-800';
      case 'supabase_auth_admin': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diagnóstico Supabase</h2>
          <p className="text-gray-600">Análise de performance e conexões em tempo real</p>
        </div>
        <Button 
          onClick={analyzeSupabasePerformance}
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Analisar Performance
            </>
          )}
        </Button>
      </div>

      {/* SCORE DE PERFORMANCE */}
      {performanceScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {performanceScore >= 80 ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              )}
              Score de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </div>
              <div className="text-sm text-gray-600">
                {performanceScore >= 80 && '🚀 Excelente - Backend otimizado'}
                {performanceScore >= 60 && performanceScore < 80 && '⚠️ Bom - Algumas otimizações possíveis'}
                {performanceScore < 60 && '🔥 Atenção - Performance degradada'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ESTATÍSTICAS GERAIS */}
      {databaseStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Conexões</p>
                  <p className="text-2xl font-bold text-gray-900">{databaseStats.totalConnections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conexões Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{databaseStats.activeConnections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conexões Idle</p>
                  <p className="text-2xl font-bold text-gray-900">{databaseStats.idleConnections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{databaseStats.totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LISTA DE CONEXÕES ATIVAS */}
      {connectionStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conexões Ativas Detalhadas</CardTitle>
            <p className="text-sm text-gray-600">
              Mostrando {connectionStats.length} conexões ativas no momento
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {connectionStats.slice(0, 20).map((conn, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge className={getRoleBadgeColor(conn.connected_role)}>
                      {conn.connected_role}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {conn.application_name || 'Unknown App'}
                      </p>
                      <p className="text-xs text-gray-500">
                        IP: {conn.ip} | Estado: {conn.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      ID: {conn.connection_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conn.ssl ? '🔒 SSL' : '🔓 No SSL'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RECOMENDAÇÕES ESPECÍFICAS PARA O USUÁRIO */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Otimização para contatoluizantoniooliveira@gmail.com</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">✅ Implementado</h4>
              <p className="text-blue-800 text-sm">
                Limites especiais aplicados: 500 contatos iniciais + páginas de 200 contatos
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">📊 Impacto na Performance</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Cache estendido para 2 minutos (vs 1 minuto padrão)</li>
                <li>• Carregamento mais agressivo de dados</li>
                <li>• Prioridade na fila de processamento</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900">⚡ Próximas Otimizações</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Implementação de lazy loading para listas muito grandes</li>
                <li>• Compressão de dados em tempo real</li>
                <li>• Índices específicos para queries frequentes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 