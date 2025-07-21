
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Database, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ConversionStats {
  totalFound: number;
  processed: number;
  failed: number;
  alreadyExpired: number;
  offset: number;
  hasMore: boolean;
}

export const MediaConversionManager: React.FC = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [progress, setProgress] = useState(0);
  const [batchSize] = useState(50);

  const startConversion = async () => {
    setIsConverting(true);
    setStats(null);
    setProgress(0);
    
    try {
      let offset = 0;
      let totalProcessed = 0;
      let totalFailed = 0;
      let totalExpired = 0;
      let hasMore = true;

      while (hasMore && isConverting) {
        console.log(`🔄 Processando lote: offset=${offset}, batchSize=${batchSize}`);
        
        const { data: result, error } = await supabase.functions.invoke('convert_existing_media', {
          body: { batchSize, offset }
        });

        if (error) {
          throw new Error(`Erro na conversão: ${error.message}`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Erro desconhecido na conversão');
        }

        // Atualizar estatísticas
        totalProcessed += result.processed;
        totalFailed += result.failed;
        totalExpired += result.alreadyExpired;
        hasMore = result.hasMore;
        offset = result.nextOffset;

        const currentStats: ConversionStats = {
          totalFound: result.totalFound,
          processed: totalProcessed,
          failed: totalFailed,
          alreadyExpired: totalExpired,
          offset: offset,
          hasMore: hasMore
        };

        setStats(currentStats);
        
        // Calcular progresso (estimativa baseada no lote atual)
        if (result.totalFound > 0) {
          const batchProgress = ((result.processed + result.failed + result.alreadyExpired) / result.totalFound) * 100;
          setProgress(Math.min(batchProgress, 100));
        }

        // Log do progresso
        console.log(`📊 Lote processado: ${result.processed} sucesso, ${result.failed} falhas, ${result.alreadyExpired} expiradas`);
        
        // Pequena pausa entre lotes para não sobrecarregar
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast.success(`Conversão concluída! ${totalProcessed} mídias processadas.`);
      
    } catch (error) {
      console.error('❌ Erro na conversão:', error);
      toast.error(`Erro na conversão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsConverting(false);
      setProgress(100);
    }
  };

  const resetStats = () => {
    setStats(null);
    setProgress(0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Conversão de Mídias Existentes
        </CardTitle>
        <CardDescription>
          Converte URLs temporárias de mídia do WhatsApp para Base64 permanente
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex gap-3">
          <Button
            onClick={startConversion}
            disabled={isConverting}
            className="flex items-center gap-2"
          >
            {isConverting ? (
              <>
                <Pause className="w-4 h-4" />
                Convertendo...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Iniciar Conversão
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetStats}
            disabled={isConverting}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Resetar
          </Button>
        </div>

        {/* Progresso */}
        {isConverting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do lote atual</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Processadas</span>
              </div>
              <div className="text-2xl font-bold text-green-800">{stats.processed}</div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Falharam</span>
              </div>
              <div className="text-2xl font-bold text-red-800">{stats.failed}</div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Expiradas</span>
              </div>
              <div className="text-2xl font-bold text-yellow-800">{stats.alreadyExpired}</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Offset</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{stats.offset}</div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={isConverting ? "default" : stats ? "secondary" : "outline"}>
            {isConverting ? "Convertendo" : stats ? "Concluído" : "Aguardando"}
          </Badge>
          
          {stats?.hasMore && (
            <Badge variant="outline" className="text-yellow-600">
              Mais dados disponíveis
            </Badge>
          )}
        </div>

        {/* Informações */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Este processo converte URLs temporárias do WhatsApp para Base64 permanente</p>
          <p>• Mídias processadas ficam disponíveis permanentemente</p>
          <p>• URLs já expiradas são marcadas como indisponíveis</p>
          <p>• O processo é seguro e não afeta mensagens existentes</p>
        </div>
      </CardContent>
    </Card>
  );
};
