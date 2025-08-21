
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface MessageFragment {
  id: string;
  text: string;
  order: number;
}

interface MessageFragmenterProps {
  initialMessage: string;
  onFragmentsChange: (fragments: MessageFragment[]) => void;
}

export const MessageFragmenter: React.FC<MessageFragmenterProps> = ({
  initialMessage,
  onFragmentsChange
}) => {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Fragmentar Mensagem
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {fragments.length} fragmento(s)
            </Badge>
            <Badge variant="outline">
              {getTotalCharacters()} caracteres
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {fragments.map((fragment, index) => (
          <div key={fragment.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Fragmento {fragment.order}
              </span>
              {fragments.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFragment(fragment.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Textarea
              value={fragment.text}
              onChange={(e) => updateFragment(fragment.id, e.target.value)}
              placeholder={`Digite o texto do fragmento ${fragment.order}...`}
              className="min-h-[80px]"
              maxLength={1000}
            />

            <div className="text-xs text-gray-500 text-right">
              {fragment.text.length}/1000 caracteres
            </div>
          </div>
        ))}

        {fragments.length < 5 && (
          <Button
            variant="outline"
            onClick={addFragment}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Fragmento
          </Button>
        )}

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Dica:</strong> Fragmente suas mensagens longas para melhorar a entrega 
            e evitar bloqueios pelo WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
