import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ImportProgress as ImportProgressType } from '@/types/spreadsheet';

interface ImportProgressProps {
  progress: ImportProgressType;
}

export const ImportProgress = ({ progress }: ImportProgressProps) => {
  const getStageIcon = (stage: ImportProgressType['stage']) => {
    switch (stage) {
      case 'parsing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'validating':
        return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-green-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />;
    }
  };

  const getStageColor = (stage: ImportProgressType['stage']) => {
    switch (stage) {
      case 'parsing':
        return 'text-blue-600';
      case 'validating':
        return 'text-yellow-600';
      case 'processing':
        return 'text-green-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStageName = (stage: ImportProgressType['stage']) => {
    switch (stage) {
      case 'parsing':
        return 'Lendo arquivo';
      case 'validating':
        return 'Validando dados';
      case 'processing':
        return 'Importando clientes';
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
      default:
        return 'Processando';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {getStageIcon(progress.stage)}
          <h3 className={`text-lg font-semibold ${getStageColor(progress.stage)}`}>
            {getStageName(progress.stage)}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-6">{progress.message}</p>
        
        <div className="space-y-2">
          <Progress 
            value={progress.progress} 
            className="w-full h-3"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{Math.round(progress.progress)}% concluído</span>
            {progress.currentRow && progress.totalRows && (
              <span>
                {progress.currentRow} de {progress.totalRows} registros
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stage Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-8">
          {[
            { key: 'parsing', label: 'Leitura' },
            { key: 'validating', label: 'Validação' },
            { key: 'processing', label: 'Importação' },
            { key: 'completed', label: 'Finalização' }
          ].map((step, index) => {
            const isActive = progress.stage === step.key;
            const isCompleted = ['parsing', 'validating', 'processing'].includes(step.key) && 
              ['validating', 'processing', 'completed'].includes(progress.stage) && 
              progress.stage !== step.key;
            const isCurrent = progress.stage === step.key;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-100 text-green-800 border-2 border-green-500' 
                    : isCurrent
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`
                  text-xs mt-2 font-medium
                  ${isCompleted 
                    ? 'text-green-700' 
                    : isCurrent
                    ? 'text-blue-700'
                    : 'text-gray-500'
                  }
                `}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {progress.stage === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Erro na importação</h4>
              <p className="text-sm text-red-700 mt-1">{progress.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};