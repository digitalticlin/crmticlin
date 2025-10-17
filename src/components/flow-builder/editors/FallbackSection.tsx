import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface FallbackSectionProps {
  showFallback: boolean;
  onToggle: () => void;
  fallbackAction: 'reformular' | 'transferir_humano' | 'pular_para' | 'nao_fazer_nada';
  onActionChange: (action: 'reformular' | 'transferir_humano' | 'pular_para' | 'nao_fazer_nada') => void;
  fallbackAttempts: number;
  onAttemptsChange: (attempts: number) => void;
  fallbackMessage: string;
  onMessageChange: (message: string) => void;
  fallbackFailAction: 'transferir_humano' | 'seguir_fluxo';
  onFailActionChange: (action: 'transferir_humano' | 'seguir_fluxo') => void;
  fallbackFailMessage: string;
  onFailMessageChange: (message: string) => void;
  questionPlaceholder?: string;
}

export function FallbackSection({
  showFallback,
  onToggle,
  fallbackAction,
  onActionChange,
  fallbackAttempts,
  onAttemptsChange,
  fallbackMessage,
  onMessageChange,
  fallbackFailAction,
  onFailActionChange,
  fallbackFailMessage,
  onFailMessageChange,
  questionPlaceholder = "Deixa eu explicar melhor: você tem um consórcio ativo agora ou já cancelou?"
}: FallbackSectionProps) {
  return (
    <div className="border-t pt-6 mt-6 border-white/40">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center justify-between h-12 px-4 bg-orange-50/50 hover:bg-orange-100/50 border border-orange-200/50 rounded-xl transition-all"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-orange-700">
          <AlertCircle className="h-4 w-4" />
          E se o cliente não entender ou responder outra coisa?
        </span>
        <ChevronDown className={`h-4 w-4 text-orange-600 transition-transform ${showFallback ? 'rotate-180' : ''}`} />
      </Button>

      {showFallback && (
        <div className="mt-4 space-y-4 bg-orange-50/30 p-5 rounded-xl border border-orange-200/50">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">O que fazer?</Label>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-white/50 border border-white/60 rounded-lg cursor-pointer hover:bg-white/70 transition-all">
                <input
                  type="radio"
                  name="fallbackAction"
                  value="nao_fazer_nada"
                  checked={fallbackAction === 'nao_fazer_nada'}
                  onChange={(e) => onActionChange(e.target.value as any)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Não fazer nada</div>
                  <div className="text-xs text-gray-600">Seguir normalmente mesmo sem entender</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-white/50 border border-white/60 rounded-lg cursor-pointer hover:bg-white/70 transition-all">
                <input
                  type="radio"
                  name="fallbackAction"
                  value="reformular"
                  checked={fallbackAction === 'reformular'}
                  onChange={(e) => onActionChange(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">✅ Tentar perguntar de outro jeito (Recomendado)</div>
                  <div className="text-xs text-gray-600">Reformular a pergunta se o cliente não entender</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-white/50 border border-white/60 rounded-lg cursor-pointer hover:bg-white/70 transition-all">
                <input
                  type="radio"
                  name="fallbackAction"
                  value="transferir_humano"
                  checked={fallbackAction === 'transferir_humano'}
                  onChange={(e) => onActionChange(e.target.value as any)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Transferir para atendente humano</div>
                  <div className="text-xs text-gray-600">Conectar imediatamente com um atendente</div>
                </div>
              </label>
            </div>
          </div>

          {/* Configurações para "reformular" */}
          {fallbackAction === 'reformular' && (
            <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Como perguntar de forma diferente?</Label>
                <Textarea
                  value={fallbackMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder={questionPlaceholder}
                  rows={3}
                  className="resize-none text-sm bg-white/70 border-white/60 focus:border-blue-500 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Quantas vezes tentar?</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={fallbackAttempts}
                  onChange={(e) => onAttemptsChange(parseInt(e.target.value) || 2)}
                  className="w-24 h-9 text-sm bg-white/70 border-white/60 focus:border-blue-500 rounded-lg"
                />
                <p className="text-xs text-gray-600">Recomendado: 2 vezes</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Se mesmo assim não funcionar, o que fazer?</Label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 bg-white/70 border border-white/60 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                    <input
                      type="radio"
                      name="fallbackFailAction"
                      value="transferir_humano"
                      checked={fallbackFailAction === 'transferir_humano'}
                      onChange={(e) => onFailActionChange(e.target.value as any)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Transferir para atendente humano</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white/70 border border-white/60 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                    <input
                      type="radio"
                      name="fallbackFailAction"
                      value="seguir_fluxo"
                      checked={fallbackFailAction === 'seguir_fluxo'}
                      onChange={(e) => onFailActionChange(e.target.value as any)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Seguir para próximo passo mesmo assim</div>
                    </div>
                  </label>
                </div>
              </div>

              {fallbackFailAction === 'transferir_humano' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Mensagem ao transferir</Label>
                  <Textarea
                    value={fallbackFailMessage}
                    onChange={(e) => onFailMessageChange(e.target.value)}
                    placeholder="Vou te conectar com um especialista que vai te ajudar melhor 😊"
                    rows={2}
                    className="resize-none text-sm bg-white/70 border-white/60 focus:border-blue-500 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
