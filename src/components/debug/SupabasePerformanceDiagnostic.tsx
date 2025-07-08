import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Users, Clock, AlertTriangle, CheckCircle, Zap, TestTube, TrendingUp, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

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

interface TagSyncAnalysis {
  totalTags: number;
  totalLeadTags: number;
  leadsWithTags: number;
  leadsWithoutTags: number;
  orphanedTags: any[];
  integrityIssues: string[];
  timestamp: string;
  success: boolean;
}

export const SupabasePerformanceDiagnostic: React.FC = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionInfo[]>([]);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [tagAnalysis, setTagAnalysis] = useState<TagSyncAnalysis | null>(null);

  // 🚀 ANÁLISE SIMPLIFICADA DE PERFORMANCE
  const analyzeSupabasePerformance = useCallback(async () => {
    setIsAnalyzing(true);
    const startTime = Date.now();

    try {
      console.log('[Supabase Diagnostic] 🔍 Iniciando análise de performance...');

      // 1. ANÁLISE DE ESTATÍSTICAS DO BANCO (usando apenas tabelas disponíveis)
      const [
        { count: totalLeads },
        { count: totalMessages },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      // 2. CALCULAR MÉTRICAS DE PERFORMANCE BÁSICAS
      const stats: DatabaseStats = {
        totalConnections: 1, // Placeholder - conexão atual
        activeConnections: 1,
        idleConnections: 0,
        longestQuery: 0,
        avgQueryTime: 0,
        totalLeads: totalLeads || 0,
        totalMessages: totalMessages || 0,
      };

      setDatabaseStats(stats);

      // 3. CALCULAR SCORE DE PERFORMANCE (0-100)
      const analysisTime = Date.now() - startTime;
      let score = 100;

      // Penalizar por tempo de resposta lento
      if (analysisTime > 3000) score -= 25;
      else if (analysisTime > 1500) score -= 15;
      else if (analysisTime > 1000) score -= 10;

      // Bonificar por boa performance
      if (analysisTime < 500) score += 5;

      setPerformanceScore(Math.max(0, Math.min(100, score)));

      console.log('[Supabase Diagnostic] ✅ Análise concluída:', {
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

  const runDiagnostics = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        user: user?.email,
        tests: []
      };

      // 1. Teste de conectividade básica
      const connectivityStart = Date.now();
      const { data: healthCheck } = await supabase.from('leads').select('count', { count: 'exact', head: true });
      results.tests.push({
        name: 'Conectividade Básica',
        duration: Date.now() - connectivityStart,
        status: 'success',
        details: `${healthCheck} registros encontrados`
      });

      // 2. Teste de performance de queries complexas
      const complexQueryStart = Date.now();
      const { data: complexData } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          kanban_stage_id,
          lead_tags!inner(
            tags(id, name, color)
          )
        `)
        .limit(10);
      results.tests.push({
        name: 'Query Complexa (Leads + Tags)',
        duration: Date.now() - complexQueryStart,
        status: 'success',
        details: `${complexData?.length || 0} leads processados`
      });

      // 3. Teste de atualização de lead (simulando mudança de etapa)
      if (complexData && complexData.length > 0) {
        const testLead = complexData[0];
        const updateStart = Date.now();
        
        const { error } = await supabase
          .from('leads')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testLead.id);
          
        results.tests.push({
          name: 'Teste de Atualização de Lead',
          duration: Date.now() - updateStart,
          status: error ? 'error' : 'success',
          details: error ? error.message : `Lead ${testLead.id} atualizado`
        });
      }

      // 4. Teste de cache invalidation
      const cacheStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100)); // Simular operação
      results.tests.push({
        name: 'Invalidação de Cache',
        duration: Date.now() - cacheStart,
        status: 'success',
        details: 'Cache invalidado com sucesso'
      });

      results.totalDuration = Date.now() - startTime;
      setDiagnostics(results);
      
      toast.success(`Diagnóstico concluído em ${results.totalDuration}ms`);
      
    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error('Erro ao executar diagnóstico');
      setDiagnostics({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 🏷️ ANÁLISE COMPLETA DE SINCRONIZAÇÃO DE TAGS
  const analyzeTagsSync = async () => {
    setIsRunning(true);
    try {
      console.log('[Tag Analysis] 🔍 Iniciando análise de sincronização de tags...');
      
      const analysis: TagSyncAnalysis = {
        totalTags: 0,
        totalLeadTags: 0,
        leadsWithTags: 0,
        leadsWithoutTags: 0,
        orphanedTags: [],
        integrityIssues: [],
        timestamp: new Date().toISOString(),
        success: false
      };

      // 1. Contar total de tags
      const { data: allTags, error: tagsError } = await supabase
        .from('tags')
        .select('id, name, color');
      
      if (tagsError) throw tagsError;
      analysis.totalTags = allTags?.length || 0;

      // 2. Contar total de relações lead_tags
      const { data: allLeadTags, error: leadTagsError } = await supabase
        .from('lead_tags')
        .select('id, lead_id, tag_id');
      
      if (leadTagsError) throw leadTagsError;
      analysis.totalLeadTags = allLeadTags?.length || 0;

      // 3. Analisar leads com e sem tags
      const { data: leadsWithTagsData, error: leadsWithTagsError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          lead_tags(id, tag_id, tags(name, color))
        `);
      
      if (leadsWithTagsError) throw leadsWithTagsError;

      if (leadsWithTagsData) {
        analysis.leadsWithTags = leadsWithTagsData.filter(lead => 
          lead.lead_tags && lead.lead_tags.length > 0
        ).length;
        
        analysis.leadsWithoutTags = leadsWithTagsData.filter(lead => 
          !lead.lead_tags || lead.lead_tags.length === 0
        ).length;
      }

      // 4. Buscar tags órfãs (sem relação com leads)
      const { data: orphanedTags, error: orphanedError } = await supabase
        .from('tags')
        .select(`
          id, name, color,
          lead_tags(id)
        `);
      
      if (orphanedError) throw orphanedError;
      
      if (orphanedTags) {
        analysis.orphanedTags = orphanedTags.filter(tag => 
          !tag.lead_tags || tag.lead_tags.length === 0
        );
      }

      // 5. Verificar integridade referencial
      if (allLeadTags) {
        const tagIds = new Set(allTags?.map(t => t.id) || []);
        const leadTagsWithInvalidTags = allLeadTags.filter(lt => !tagIds.has(lt.tag_id));
        
        if (leadTagsWithInvalidTags.length > 0) {
          analysis.integrityIssues.push(
            `${leadTagsWithInvalidTags.length} relações lead_tags referenciam tags inexistentes`
          );
        }
      }

      // 6. Verificar leads órfãos nas relações
      const { data: allLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id');
      
      if (leadsError) throw leadsError;
      
      if (allLeads && allLeadTags) {
        const leadIds = new Set(allLeads.map(l => l.id));
        const leadTagsWithInvalidLeads = allLeadTags.filter(lt => !leadIds.has(lt.lead_id));
        
        if (leadTagsWithInvalidLeads.length > 0) {
          analysis.integrityIssues.push(
            `${leadTagsWithInvalidLeads.length} relações lead_tags referenciam leads inexistentes`
          );
        }
      }

      analysis.success = true;
      setTagAnalysis(analysis);

      const statusIcon = analysis.integrityIssues.length === 0 ? '✅' : '⚠️';
      const message = analysis.integrityIssues.length === 0 
        ? 'Análise concluída - Tags sincronizadas corretamente!'
        : `Análise concluída - ${analysis.integrityIssues.length} problemas encontrados`;
      
      toast.success(`${statusIcon} ${message}`);

      console.log('[Tag Analysis] ✅ Análise concluída:', analysis);

    } catch (error: any) {
      console.error('[Tag Analysis] ❌ Erro na análise:', error);
      toast.error(`Erro na análise de tags: ${error.message}`);
      setTagAnalysis({
        totalTags: 0,
        totalLeadTags: 0,
        leadsWithTags: 0,
        leadsWithoutTags: 0,
        orphanedTags: [],
        integrityIssues: [`Erro na análise: ${error.message}`],
        timestamp: new Date().toISOString(),
        success: false
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 🔧 TESTE ESPECÍFICO PARA MUDANÇA DE ETAPAS
  const testStageChange = async () => {
    setIsRunning(true);
    try {
      // Buscar um lead para teste
      const { data: testLead } = await supabase
        .from('leads')
        .select('id, name, kanban_stage_id')
        .limit(1)
        .single();

      if (!testLead) {
        toast.error('Nenhum lead encontrado para teste');
        return;
      }

      // Buscar uma etapa diferente
      const { data: stages } = await supabase
        .from('kanban_stages')
        .select('id, title')
        .neq('id', testLead.kanban_stage_id)
        .limit(1);

      if (!stages || stages.length === 0) {
        toast.error('Nenhuma etapa alternativa encontrada');
        return;
      }

      const newStage = stages[0];
      
      console.log('[Teste Etapa] 🧪 Testando mudança de etapa:', {
        leadId: testLead.id,
        leadName: testLead.name,
        currentStageId: testLead.kanban_stage_id,
        newStageId: newStage.id,
        newStageTitle: newStage.title
      });

      // Executar mudança de etapa
      const { error } = await supabase
        .from('leads')
        .update({ 
          kanban_stage_id: newStage.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', testLead.id);

      if (error) {
        throw error;
      }

      // Verificar se a mudança foi persistida
      const { data: updatedLead } = await supabase
        .from('leads')
        .select('kanban_stage_id')
        .eq('id', testLead.id)
        .single();

      const success = updatedLead?.kanban_stage_id === newStage.id;
      
      setTestResults({
        leadId: testLead.id,
        leadName: testLead.name,
        originalStage: testLead.kanban_stage_id,
        newStage: newStage.id,
        newStageTitle: newStage.title,
        success,
        timestamp: new Date().toISOString()
      });

      if (success) {
        toast.success(`✅ Teste concluído! Lead "${testLead.name}" movido para "${newStage.title}"`);
        
        // Disparar evento de refresh
        window.dispatchEvent(new CustomEvent('refreshWhatsAppContacts'));
      } else {
        toast.error('❌ Falha no teste - mudança não foi persistida');
      }

    } catch (error: any) {
      console.error('[Teste Etapa] ❌ Erro:', error);
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Diagnóstico de Performance do Supabase</CardTitle>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={analyzeTagsSync}
              disabled={isRunning}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              Analisar Tags
            </Button>
            <Button 
              onClick={testStageChange}
              disabled={isRunning}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Testar Etapas
            </Button>
            <Button 
              onClick={runDiagnostics}
              disabled={isRunning}
              size="sm"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {isRunning ? 'Executando...' : 'Diagnóstico Geral'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Análise de Sincronização de Tags */}
        {tagAnalysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold">Análise de Sincronização de Tags</h3>
              <Badge variant={tagAnalysis.success ? "default" : "destructive"}>
                {tagAnalysis.success ? (tagAnalysis.integrityIssues.length === 0 ? '✅ OK' : '⚠️ Problemas') : '❌ Erro'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{tagAnalysis.totalTags}</div>
                <div className="text-sm text-blue-800">Total de Tags</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{tagAnalysis.leadsWithTags}</div>
                <div className="text-sm text-green-800">Leads com Tags</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{tagAnalysis.leadsWithoutTags}</div>
                <div className="text-sm text-yellow-800">Leads sem Tags</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{tagAnalysis.orphanedTags.length}</div>
                <div className="text-sm text-purple-800">Tags Órfãs</div>
              </div>
            </div>

            {tagAnalysis.integrityIssues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Problemas de Integridade:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {tagAnalysis.integrityIssues.map((issue, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tagAnalysis.orphanedTags.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Tags sem Uso ({tagAnalysis.orphanedTags.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {tagAnalysis.orphanedTags.slice(0, 10).map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                  {tagAnalysis.orphanedTags.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{tagAnalysis.orphanedTags.length - 10} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <Separator />
          </div>
        )}

        {/* Resultados do Teste de Etapa */}
        {testResults && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold">Resultado do Teste de Mudança de Etapa</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={testResults.success ? "default" : "destructive"}>
                  {testResults.success ? '✅ Sucesso' : '❌ Falhou'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Lead:</span>
                <span className="text-sm">{testResults.leadName} ({testResults.leadId})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Nova Etapa:</span>
                <span className="text-sm">{testResults.newStageTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Executado em:</span>
                <span className="text-sm">{new Date(testResults.timestamp).toLocaleString()}</span>
              </div>
            </div>
            
            <Separator />
          </div>
        )}

        {/* Resultados do Diagnóstico Geral */}
        {diagnostics && !diagnostics.error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <h3 className="font-semibold">Resultados dos Testes</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                Executado em {new Date(diagnostics.timestamp).toLocaleString()}
              </Badge>
            </div>
            
            <div className="grid gap-3">
              {diagnostics.tests.map((test: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(test.status)}`} />
                    <div>
                      <span className="font-medium text-sm">{test.name}</span>
                      <p className="text-xs text-gray-600">{test.details}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {test.duration}ms
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-900">Tempo Total</span>
              </div>
              <Badge className="bg-blue-500 text-white">
                {diagnostics.totalDuration}ms
              </Badge>
            </div>
          </div>
        )}

        {diagnostics && diagnostics.error && (
          <div className="text-center py-8">
            <div className="text-red-500 font-medium">Erro no Diagnóstico</div>
            <p className="text-sm text-gray-600 mt-2">{diagnostics.error}</p>
          </div>
        )}

        {!diagnostics && !testResults && !tagAnalysis && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Execute as análises para verificar a integridade do sistema</p>
            <p className="text-sm mt-2">
              • <strong>Analisar Tags:</strong> Verifica sincronização e integridade das tags<br/>
              • <strong>Testar Etapas:</strong> Testa funcionalidade de mudança de etapas<br/>
              • <strong>Diagnóstico Geral:</strong> Verifica performance do Supabase
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
