import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Image, 
  Video, 
  Volume2, 
  FileText, 
  RefreshCw, 
  Search,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface MediaAnalysis {
  totalMediaMessages: number;
  withMediaUrl: number;
  withoutMediaUrl: number;
  cached: number;
  lost: number;
  byType: Record<string, {
    total: number;
    withUrl: number;
    cached: number;
    lost: number;
  }>;
}

interface RecoveryResult {
  processed: number;
  recovered: number;
  errors: number;
  successRate: number;
}

export const MediaRecoveryPanel: React.FC = () => {
  const [analysis, setAnalysis] = useState<MediaAnalysis | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [recoveryLimit, setRecoveryLimit] = useState(50);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      console.log('🔍 Analisando mídias perdidas...');
      
      const { data, error } = await supabase.functions.invoke('media_recovery_service', {
        body: {
          action: 'analyze',
          days: selectedDays
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro na análise');
      }

      setAnalysis(data.analysis);
      toast.success('Análise concluída!');
      
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      toast.error(`Erro na análise: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecover = async () => {
    setIsRecovering(true);
    setRecoveryResult(null);
    
    try {
      console.log('🔄 Iniciando recuperação de mídias...');
      
      const { data, error } = await supabase.functions.invoke('media_recovery_service', {
        body: {
          action: 'recover_all',
          days: selectedDays,
          limit: recoveryLimit
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro na recuperação');
      }

      setRecoveryResult(data.result);
      
      if (data.result.recovered > 0) {
        toast.success(`${data.result.recovered} mídias recuperadas com sucesso!`);
      } else {
        toast.info('Nenhuma mídia foi recuperada');
      }
      
    } catch (error) {
      console.error('❌ Erro na recuperação:', error);
      toast.error(`Erro na recuperação: ${error.message}`);
    } finally {
      setIsRecovering(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-green-600" />;
      case 'video': return <Video className="h-5 w-5 text-purple-600" />;
      case 'audio': return <Volume2 className="h-5 w-5 text-blue-600" />;
      case 'document': return <FileText className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (cached: number, total: number) => {
    const percentage = total > 0 ? (cached / total) * 100 : 0;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recuperação de Mídias WhatsApp
          </CardTitle>
          <CardDescription>
            Analise e recupere mídias perdidas que não foram processadas corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controles */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Período:</label>
              <select 
                value={selectedDays} 
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={1}>1 dia</option>
                <option value={3}>3 dias</option>
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Limite:</label>
              <select 
                value={recoveryLimit} 
                onChange={(e) => setRecoveryLimit(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={10}>10 mídias</option>
                <option value={25}>25 mídias</option>
                <option value={50}>50 mídias</option>
                <option value={100}>100 mídias</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || isRecovering}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analisar
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleRecover}
              disabled={!analysis || isAnalyzing || isRecovering}
              className="flex items-center gap-2"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Recuperando...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Recuperar Mídias
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Análise */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Análise de Mídias
            </CardTitle>
            <CardDescription>
              Últimos {selectedDays} dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalMediaMessages}</div>
                <div className="text-sm text-blue-600">Total de mídias</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analysis.cached}</div>
                <div className="text-sm text-green-600">Com cache</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analysis.lost}</div>
                <div className="text-sm text-red-600">Perdidas</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{analysis.withoutMediaUrl}</div>
                <div className="text-sm text-gray-600">Sem URL</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Por tipo de mídia:</h4>
              {Object.entries(analysis.byType).map(([type, stats]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getMediaIcon(type)}
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Total: {stats.total}</span>
                    <span className={getStatusColor(stats.cached, stats.withUrl)}>
                      Cache: {stats.cached}/{stats.withUrl}
                    </span>
                    {stats.lost > 0 && (
                      <Badge variant="destructive">{stats.lost} perdidas</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Recuperação */}
      {recoveryResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultado da Recuperação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{recoveryResult.processed}</div>
                <div className="text-sm text-blue-600">Processadas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{recoveryResult.recovered}</div>
                <div className="text-sm text-green-600">Recuperadas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{recoveryResult.errors}</div>
                <div className="text-sm text-red-600">Erros</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{recoveryResult.successRate}%</div>
                <div className="text-sm text-purple-600">Taxa de sucesso</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{recoveryResult.recovered}/{recoveryResult.processed}</span>
              </div>
              <Progress 
                value={recoveryResult.processed > 0 ? (recoveryResult.recovered / recoveryResult.processed) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 