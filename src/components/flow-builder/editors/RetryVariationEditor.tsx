import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';

interface RetryVariationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    maxRetries?: number;
    variations?: string[];
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    maxRetries: number;
    variations: string[];
  }) => void;
}

export function RetryVariationEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: RetryVariationEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Repetir com Variação');
  const [description, setDescription] = useState(initialData?.description || '');
  const [maxRetries, setMaxRetries] = useState<number>(initialData?.maxRetries || 3);
  const [variations, setVariations] = useState<string[]>(
    initialData?.variations || ['', '']
  );

  const handleAddVariation = () => {
    setVariations([...variations, '']);
  };

  const handleRemoveVariation = (index: number) => {
    if (variations.length > 2) {
      setVariations(variations.filter((_, i) => i !== index));
    }
  };

  const handleVariationChange = (index: number, value: string) => {
    const newVariations = [...variations];
    newVariations[index] = value;
    setVariations(newVariations);
  };

  const handleSave = () => {
    const messages: MessageText[] = variations
      .filter(v => v.trim())
      .map(content => ({
        type: 'text',
        content,
        delay: 0
      }));

    onSave({
      label,
      description,
      messages,
      maxRetries,
      variations: variations.filter(v => v.trim())
    });

    onClose();
  };

  const isValid = () => {
    return variations.filter(v => v.trim()).length >= 2;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-amber-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Repetir com Variação
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Tente novamente com mensagens diferentes quando não funcionar
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Nome do passo */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <Label htmlFor="label" className="text-base font-semibold text-gray-700">
              📝 Como você quer chamar este passo?
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Tentar novamente solicitar documento, Reperguntar de outra forma..."
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Nome interno para você se organizar
            </p>
          </div>

          {/* Descrição da etapa */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <Label htmlFor="description" className="text-base font-semibold text-gray-700">
              📋 O que deve acontecer nesta etapa?
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nesta etapa você irá tentar novamente solicitar algo ao cliente usando mensagens com variações para soar mais natural."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre retry */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              Como funciona a repetição com variação?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Use quando o cliente não responde ou não envia o que foi pedido</p>
              <p>• A cada tentativa, a IA usa uma mensagem diferente da lista</p>
              <p>• Evita soar robótico ao repetir exatamente a mesma coisa</p>
              <p>• Após atingir o limite, segue para um caminho alternativo</p>
            </div>
          </div>

          {/* Limite de tentativas */}
          <div className="space-y-3 bg-amber-50 p-5 rounded-xl border-2 border-amber-200">
            <Label htmlFor="maxRetries" className="text-base font-semibold text-gray-800">
              🔢 Quantas vezes tentar?
            </Label>
            <Select value={maxRetries.toString()} onValueChange={(value) => setMaxRetries(Number(value))}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o número de tentativas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 tentativas</SelectItem>
                <SelectItem value="3">3 tentativas</SelectItem>
                <SelectItem value="4">4 tentativas</SelectItem>
                <SelectItem value="5">5 tentativas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-amber-600">
              Após {maxRetries} tentativas sem sucesso, seguirá para outro caminho
            </p>
          </div>

          {/* Variações de mensagem */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  Mensagens com variação
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Crie diferentes formas de pedir a mesma coisa
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariation}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar variação
              </Button>
            </div>

            <div className="space-y-3 mt-4">
              {variations.map((variation, idx) => (
                <div key={idx} className="p-5 border-2 rounded-xl bg-gradient-to-br from-amber-50 to-white space-y-3 hover:border-amber-400 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700 bg-amber-100 px-3 py-1 rounded-full">
                      Tentativa {idx + 1}
                    </span>
                    {variations.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariation(idx)}
                        className="h-8 px-3 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Mensagem {idx + 1}:
                    </Label>
                    <Textarea
                      value={variation}
                      onChange={(e) => handleVariationChange(idx, e.target.value)}
                      placeholder={`Ex: ${
                        idx === 0 ? 'Você pode me enviar o documento?' :
                        idx === 1 ? 'Ainda preciso daquele documento para prosseguir.' :
                        idx === 2 ? 'Consegue me enviar o documento que pedi?' :
                        'Outra forma de pedir o documento...'
                      }`}
                      rows={3}
                      className="resize-none text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      💡 Use tom e palavras diferentes, mas o mesmo objetivo
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-3 bg-amber-50 p-3 rounded-lg">
              ⚠️ Crie pelo menos 2 variações. A IA usará uma diferente a cada tentativa.
            </p>
          </div>

          {/* Exemplo prático */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Exemplo prático
            </Label>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">Tentativa 1:</p>
                <p className="text-xs italic text-gray-600">"Você pode me enviar seu RG?"</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">Tentativa 2:</p>
                <p className="text-xs italic text-gray-600">"Ainda preciso de uma foto do seu RG para continuar."</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">Tentativa 3:</p>
                <p className="text-xs italic text-gray-600">"Consegue tirar uma foto do seu RG e me enviar?"</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="font-semibold text-red-700 mb-1">Após 3 tentativas:</p>
                <p className="text-xs text-gray-600">→ Desiste e segue para outro caminho (ex: transferir para humano)</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {variations.some(v => v.trim()) && (
            <div className="space-y-3 bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-300">
              <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Como o cliente vai ver
              </Label>
              <div className="space-y-3">
                {variations
                  .filter(v => v.trim())
                  .map((variation, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
                      <p className="text-xs text-amber-700 font-semibold mb-2">Tentativa {idx + 1}:</p>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                          <span className="text-white text-xl">🔄</span>
                        </div>
                        <div className="flex-1 bg-amber-50 p-3 rounded-2xl rounded-tl-none">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{variation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                A IA usará uma mensagem diferente a cada tentativa (máximo de {maxRetries})
              </p>
            </div>
          )}

          {/* JSON Preview */}
          <details className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2">
              <span>🔧</span>
              <span>Ver estrutura técnica (JSON)</span>
            </summary>
            <pre className="mt-3 p-4 bg-white rounded-lg overflow-auto text-xs border border-gray-200 shadow-inner">
              {JSON.stringify(
                {
                  tipo: 'retry_variation',
                  descricao: description,
                  max_tentativas: maxRetries,
                  mensagens: variations.filter(v => v.trim()),
                  decisoes: [
                    {
                      condicao: 'sucesso',
                      proximoPasso: 'PRÓXIMO_A'
                    },
                    {
                      condicao: 'limite_atingido',
                      proximoPasso: 'PRÓXIMO_B'
                    }
                  ]
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>

        <DialogFooter className="border-t pt-4 gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ❌ Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid()}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Variações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
