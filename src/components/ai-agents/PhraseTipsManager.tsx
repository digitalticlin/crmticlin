import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PQExample } from "@/types/aiAgent";
import { Plus, X, MessageCircle, Lightbulb } from "lucide-react";

interface PhraseTipsManagerProps {
  examples: PQExample[];
  onChange: (examples: PQExample[]) => void;
  title?: string;
}

export const PhraseTipsManager = ({ 
  examples, 
  onChange, 
  title = "Frases e Contextos"
}: PhraseTipsManagerProps) => {
  const [newExample, setNewExample] = useState<{ question: string; answer: string }>({
    question: "",
    answer: ""
  });

  const addExample = () => {
    if (newExample.question.trim() && newExample.answer.trim()) {
      const example: PQExample = {
        id: `phrase_${Date.now()}`,
        question: newExample.question.trim(),
        answer: newExample.answer.trim()
      };
      
      onChange([...examples, example]);
      setNewExample({ question: "", answer: "" });
    }
  };

  const removeExample = (id: string) => {
    onChange(examples.filter(ex => ex.id !== id));
  };

  const updateExample = (id: string, field: 'question' | 'answer', value: string) => {
    onChange(examples.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  return (
    <div className="space-y-4">
      {/* Adicionar nova frase */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
            <Plus className="h-4 w-4 text-yellow-500" />
            Adicionar Nova Frase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              💬 Frase Sugerida
            </label>
            <Input
              value={newExample.question}
              onChange={(e) => setNewExample(prev => ({ ...prev, question: e.target.value }))}
              placeholder='Ex: "Vamos encontrar a melhor solução para você"'
              className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              📋 Quando/Como Usar
            </label>
            <Textarea
              value={newExample.answer}
              onChange={(e) => setNewExample(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Ex: Use quando o cliente demonstrar dúvida ou resistência, para mostrar que você está focado em ajudá-lo e não apenas em vender."
              className="min-h-20 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
              rows={3}
            />
          </div>
          <Button 
            onClick={addExample}
            disabled={!newExample.question.trim() || !newExample.answer.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-glass transition-all duration-200 text-sm"
          >
            <Plus className="h-3 w-3 mr-2" />
            Adicionar Frase
          </Button>
        </CardContent>
      </Card>

      {/* Lista de frases */}
      {examples.length > 0 && (
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Frases Configuradas ({examples.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {examples.map((example, index) => (
              <div 
                key={example.id}
                className="p-3 bg-white/40 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/60 transition-all duration-200 shadow-glass"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-xs font-medium text-gray-600">Frase {index + 1}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExample(example.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-lg p-1 h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      Frase:
                    </label>
                    <Input
                      value={example.question}
                      onChange={(e) => updateExample(example.id, 'question', e.target.value)}
                      className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm font-medium text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Contexto de Uso:
                    </label>
                    <Textarea
                      value={example.answer}
                      onChange={(e) => updateExample(example.id, 'answer', e.target.value)}
                      className="min-h-16 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {examples.length === 0 && (
        <div className="text-center py-6 text-gray-600">
          <Lightbulb className="h-10 w-10 mx-auto mb-2 text-yellow-500" />
          <p className="font-medium text-sm">Nenhuma frase configurada ainda.</p>
          <p className="text-xs">Adicione frases estratégicas com contexto de uso para treinar melhor o agente.</p>
        </div>
      )}
    </div>
  );
};