
import React from 'react';
import { Button } from '@/components/ui/button';
import { AIAgent } from '@/types/aiAgent';

interface EnhancedPromptConfigurationProps {
  agent?: AIAgent | null;
  promptData: any;
  onPromptDataChange: (field: string, value: any, exampleField?: string, exampleValue?: any, isInternalLoad?: boolean) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  focusObjectives?: boolean;
}

export const EnhancedPromptConfiguration = ({
  agent,
  promptData,
  onPromptDataChange,
  onSave,
  onCancel,
  focusObjectives = false
}: EnhancedPromptConfigurationProps) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Configure as configurações avançadas do seu agente de IA
        </p>
        
        {focusObjectives ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Fluxo de Conversação</h3>
            <p className="text-sm text-blue-700">
              Esta seção está em desenvolvimento. Em breve você poderá configurar o fluxo completo de conversação do seu agente.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Configuração do Prompt</h3>
            <p className="text-sm text-gray-700">
              Esta seção está em desenvolvimento. Em breve você poderá configurar o comportamento detalhado do seu agente.
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-center mt-6">
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};
