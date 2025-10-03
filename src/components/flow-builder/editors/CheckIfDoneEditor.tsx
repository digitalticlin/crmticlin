import { useState } from 'react';
import { Decision } from '@/types/flowBuilder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckSquare, Edit3, Check, ArrowRight } from 'lucide-react';

interface CheckIfDoneEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    decisions: Decision[];
    description?: string;
    checkField?: string;
  };
  onSave: (data: {
    label: string;
    decisions: Decision[];
    description: string;
    checkField: string;
  }) => void;
}

export function CheckIfDoneEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: CheckIfDoneEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Verificar Se Já Fez');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [checkField, setCheckField] = useState(initialData?.checkField || '');

  const handleSave = () => {
    setIsEditingLabel(false);

    const decisions: Decision[] = [
      {
        id: `decision_${Date.now()}_0`,
        type: 'check' as const,
        condition: 'já_fez',
        targetStepId: '',
        priority: 0,
        outputHandle: 'output-0'
      },
      {
        id: `decision_${Date.now()}_1`,
        type: 'check' as const,
        condition: 'ainda_não_fez',
        targetStepId: '',
        priority: 1,
        outputHandle: 'output-1'
      }
    ];

    onSave({
      label,
      description,
      decisions,
      checkField
    });

    onClose();
  };

  const isValid = () => {
    return checkField.trim().length > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30">
                <CheckSquare className="h-6 w-6 text-white" />
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
              Verificar se uma ação já foi realizada
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
                placeholder="Ex: Verificar se o lead já enviou o documento"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkField" className="text-sm font-medium text-gray-700">
                Campo para verificar
              </Label>
              <Input
                id="checkField"
                value={checkField}
                onChange={(e) => setCheckField(e.target.value)}
                placeholder="Ex: tem_rg, enviou_documento, completou_cadastro"
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Verificará se este campo existe e tem valor
              </p>
            </div>

            {/* Outputs */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Saídas possíveis</Label>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-700 text-sm">SAÍDA 1</span>
                      <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-600">SE já fez</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-yellow-700 text-sm">SAÍDA 2</span>
                      <ArrowRight className="h-3.5 w-3.5 text-yellow-500" />
                    </div>
                    <p className="text-xs text-gray-600">SE ainda não fez</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Conecte no canvas ao próximo bloco
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/40">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/30 hover:bg-white/40 border border-white/40 rounded-full text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid()}
                className="px-6 py-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-full text-sm font-medium shadow-lg shadow-teal-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
