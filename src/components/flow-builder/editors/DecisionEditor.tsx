import { useState } from 'react';
import { Decision } from '@/types/flowBuilder';
import { FallbackConfig } from '@/types/flowStructure';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { GitBranch, Edit3, Check, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { FallbackSection } from './FallbackSection';

interface DecisionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    decisions: Decision[];
    description?: string;
    fallback?: FallbackConfig;
  };
  onSave: (data: {
    label: string;
    decisions: Decision[];
    description: string;
    fallback?: FallbackConfig;
  }) => void;
}

interface ConditionOption {
  id: string;
  condition: string;
}

export function DecisionEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: DecisionEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Decisão (SE/ENTÃO)');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [conditions, setConditions] = useState<ConditionOption[]>(
    initialData?.decisions.map(d => ({
      id: d.id || Date.now().toString(),
      condition: d.condition
    })) || [
      { id: '1', condition: '' },
      { id: '2', condition: '' }
    ]
  );

  // Fallback states
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackAction, setFallbackAction] = useState<'reformular' | 'transferir_humano' | 'pular_para' | 'nao_fazer_nada'>(
    initialData?.fallback?.se_nao_entender?.acao || 'nao_fazer_nada'
  );
  const [fallbackAttempts, setFallbackAttempts] = useState(
    initialData?.fallback?.se_nao_entender?.tentativas_maximas || 2
  );
  const [fallbackMessage, setFallbackMessage] = useState(
    initialData?.fallback?.se_nao_entender?.mensagem_alternativa || ''
  );
  const [fallbackFailAction, setFallbackFailAction] = useState<'transferir_humano' | 'seguir_fluxo'>(
    initialData?.fallback?.se_nao_entender?.se_falhar?.acao || 'transferir_humano'
  );
  const [fallbackFailMessage, setFallbackFailMessage] = useState(
    initialData?.fallback?.se_nao_entender?.se_falhar?.mensagem || ''
  );

  const handleAddCondition = () => {
    setConditions([...conditions, { id: Date.now().toString(), condition: '' }]);
  };

  const handleRemoveCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: string, value: string) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, condition: value } : c));
  };

  const handleSave = () => {
    setIsEditingLabel(false);

    const decisions: Decision[] = conditions
      .filter(c => c.condition.trim())
      .map((c, idx) => ({
        id: c.id,
        type: 'condition' as const,
        condition: c.condition,
        targetStepId: '',
        priority: idx,
        outputHandle: `output-${idx}`
      }));

    // Construct fallback config
    const fallback: FallbackConfig | undefined = fallbackAction !== 'nao_fazer_nada' ? {
      se_nao_entender: {
        acao: fallbackAction,
        tentativas_maximas: fallbackAttempts,
        mensagem_alternativa: fallbackAction === 'reformular' ? fallbackMessage : undefined,
        se_falhar: fallbackAction === 'reformular' ? {
          acao: fallbackFailAction,
          mensagem: fallbackFailMessage
        } : undefined
      }
    } : undefined;

    onSave({
      label,
      description,
      decisions,
      fallback
    });

    onClose();
  };

  const isValid = () => {
    return conditions.some(c => c.condition.trim().length > 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <GitBranch className="h-6 w-6 text-white" />
              </div>

              {isEditingLabel ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="text-xl font-bold bg-white/30 border-white/40"
                    autoFocus
                    onBlur={() => setIsEditingLabel(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingLabel(false);
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{label}</h2>
                  <button
                    onClick={() => setIsEditingLabel(true)}
                    className="p-1.5 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2 ml-[60px]">
              Criar decisões condicionais
            </p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                O que deve acontecer nesta etapa?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Verificar interesse do lead e direcionar ao fluxo adequado"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Condições */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Condições</Label>
                <Button
                  type="button"
                  onClick={handleAddCondition}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {conditions.map((condition, index) => (
                <div key={condition.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-gray-700">
                      SE:
                    </Label>
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={condition.condition}
                        onChange={(e) => updateCondition(condition.id, e.target.value)}
                        placeholder='Ex: lead tem interesse alto'
                        className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 text-sm"
                      />
                      {conditions.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveCondition(condition.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Output badge */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-3 ml-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-amber-700 text-sm">SAÍDA {index + 1}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <p className="text-xs text-gray-600">Conecte no canvas ao próximo bloco</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fallback Section */}
            <FallbackSection
              showFallback={showFallback}
              onToggle={() => setShowFallback(!showFallback)}
              fallbackAction={fallbackAction}
              onActionChange={setFallbackAction}
              fallbackAttempts={fallbackAttempts}
              onAttemptsChange={setFallbackAttempts}
              fallbackMessage={fallbackMessage}
              onMessageChange={setFallbackMessage}
              fallbackFailAction={fallbackFailAction}
              onFailActionChange={setFallbackFailAction}
              fallbackFailMessage={fallbackFailMessage}
              onFailMessageChange={setFallbackFailMessage}
              questionPlaceholder="Não consegui identificar sua resposta. Pode reformular?"
            />

            <div className="flex justify-end gap-3 pt-6 border-t border-white/40">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/30 hover:bg-white/40 border border-white/40 rounded-full text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                
                className="px-6 py-2.5 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-full text-sm font-medium shadow-lg shadow-amber-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
