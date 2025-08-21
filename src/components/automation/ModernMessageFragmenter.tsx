
import { useState, useEffect } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, MessageSquare, Scissors } from "lucide-react";
import { toast } from "sonner";

interface MessageFragment {
  id: string;
  text: string;
  order: number;
}

interface ModernMessageFragmenterProps {
  initialMessage: string;
  onFragmentsChange: (fragments: MessageFragment[]) => void;
}

export function ModernMessageFragmenter({ initialMessage, onFragmentsChange }: ModernMessageFragmenterProps) {
  const [fragments, setFragments] = useState<MessageFragment[]>([
    { id: '1', text: initialMessage, order: 1 }
  ]);

  useEffect(() => {
    onFragmentsChange(fragments);
  }, [fragments, onFragmentsChange]);

  const addFragment = () => {
    if (fragments.length >= 5) {
      toast.error('Máximo de 5 fragmentos permitido');
      return;
    }

    const newFragment: MessageFragment = {
      id: Date.now().toString(),
      text: '',
      order: fragments.length + 1
    };

    setFragments([...fragments, newFragment]);
  };

  const removeFragment = (id: string) => {
    if (fragments.length <= 1) {
      toast.error('Pelo menos 1 fragmento é obrigatório');
      return;
    }

    const updated = fragments
      .filter(f => f.id !== id)
      .map((f, index) => ({ ...f, order: index + 1 }));
    
    setFragments(updated);
  };

  const updateFragment = (id: string, text: string) => {
    setFragments(fragments.map(f => 
      f.id === id ? { ...f, text } : f
    ));
  };

  const getTotalCharacters = () => {
    return fragments.reduce((total, f) => total + f.text.length, 0);
  };

  return (
    <ModernCard>
      <ModernCardHeader>
        <div className="flex items-center justify-between">
          <ModernCardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Fragmentar Mensagem
          </ModernCardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              {fragments.length} fragmento(s)
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-600">
              {getTotalCharacters()} caracteres
            </Badge>
          </div>
        </div>
      </ModernCardHeader>

      <ModernCardContent className="space-y-6">
        <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                Por que fragmentar mensagens?
              </p>
              <p className="text-xs text-blue-700">
                Mensagens longas podem ser bloqueadas pelo WhatsApp. Fragmente sua mensagem 
                em até 5 partes para melhorar a entrega e parecer mais natural.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {fragments.map((fragment, index) => (
            <div key={fragment.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                    Fragmento {fragment.order}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {fragment.text.length}/1000 caracteres
                  </span>
                </div>
                
                {fragments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFragment(fragment.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
                <Textarea
                  value={fragment.text}
                  onChange={(e) => updateFragment(fragment.id, e.target.value)}
                  placeholder={`Digite o texto do fragmento ${fragment.order}...`}
                  className="border-0 bg-transparent resize-none min-h-[100px] focus:ring-0"
                  maxLength={1000}
                />
              </div>

              {fragment.text.length > 800 && (
                <div className="text-xs text-amber-600 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded px-2 py-1">
                  ⚠️ Mensagem muito longa. Considere dividir em mais fragmentos.
                </div>
              )}
            </div>
          ))}
        </div>

        {fragments.length < 5 && (
          <Button
            variant="outline"
            onClick={addFragment}
            className="w-full bg-white/20 border-white/30 hover:bg-white/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Fragmento ({fragments.length}/5)
          </Button>
        )}

        {fragments.length > 1 && (
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  Ordem de envio
                </p>
                <p className="text-xs text-green-700">
                  Os fragmentos serão enviados na ordem numerada, com intervalos de 3-5 segundos entre cada um.
                </p>
              </div>
            </div>
          </div>
        )}
      </ModernCardContent>
    </ModernCard>
  );
}
