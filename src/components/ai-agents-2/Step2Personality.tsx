import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, ShieldX, X, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step2PersonalityProps {
  data: {
    communication_style: string;
    agent_profile: string;
    signature: string;
    prohibitions: string[];
  };
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Personality = ({ data, onChange, onNext, onBack }: Step2PersonalityProps) => {
  const [newProhibition, setNewProhibition] = useState("");

  const communicationStyles = [
    {
      value: 'formal',
      icon: '👔',
      title: 'FORMAL',
      subtitle: 'Sério e profissional',
      preview: 'Prezado(a) cliente, como posso auxiliá-lo(a) hoje?',
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      value: 'normal',
      icon: '💼',
      title: 'NORMAL',
      subtitle: 'Profissional e acessível',
      preview: 'Olá! Como posso ajudar você hoje?',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      value: 'casual',
      icon: '😄',
      title: 'DESCONTRAÍDO',
      subtitle: 'Amigável e próximo',
      preview: 'E aí! Tudo certo? Como posso te ajudar? 😊',
      gradient: 'from-yellow-400 to-orange-500'
    },
  ];

  const handleAddProhibition = () => {
    if (newProhibition.trim()) {
      onChange('prohibitions', [...data.prohibitions, newProhibition.trim()]);
      setNewProhibition("");
    }
  };

  const handleRemoveProhibition = (index: number) => {
    const updated = data.prohibitions.filter((_, i) => i !== index);
    onChange('prohibitions', updated);
  };

  const handleNext = () => {
    if (!data.communication_style) {
      alert('Por favor, selecione um estilo de conversa');
      return;
    }
    if (!data.agent_profile.trim()) {
      alert('Por favor, descreva o perfil do agente');
      return;
    }
    onNext();
  };

  const selectedStyle = communicationStyles.find(s => s.value === data.communication_style);

  return (
    <div className="max-w-4xl mx-auto space-y-4 relative z-20">
      {/* Card 1: Estilo de Comunicação - REDUZIDO PARA 70% */}
      <div>
        {/* Título único simplificado */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            Defina o estilo de comunicação
          </h2>
        </div>

        {/* Cards reduzidos para 70% da largura */}
        <div className="max-w-[70%] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          {communicationStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => onChange('communication_style', style.value)}
              className={cn(
                "relative overflow-hidden p-4 rounded-2xl border-2 transition-all duration-300 text-center group",
                "hover:shadow-xl hover:scale-105",
                data.communication_style === style.value
                  ? `bg-gradient-to-br ${style.gradient} border-transparent shadow-xl scale-105`
                  : 'bg-white/40 backdrop-blur-sm border-white/50 hover:bg-white/60'
              )}
            >
              <div className="text-4xl mb-2 transition-transform duration-300 group-hover:scale-110">
                {style.icon}
              </div>
              <h3 className={cn(
                "font-bold text-base mb-1 transition-colors",
                data.communication_style === style.value ? 'text-white' : 'text-gray-900'
              )}>
                {style.title}
              </h3>
              <p className={cn(
                "text-xs mb-2 transition-colors",
                data.communication_style === style.value ? 'text-white/90' : 'text-gray-600'
              )}>
                {style.subtitle}
              </p>
              <div className={cn(
                "text-[10px] italic p-2 rounded-lg transition-colors",
                data.communication_style === style.value ? 'bg-white/20 text-white' : 'bg-white/60 text-gray-500'
              )}>
                "{style.preview}"
              </div>

              {/* Efeito visual */}
              {data.communication_style === style.value && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -translate-y-8 translate-x-8" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: Perfil do Agente - Estilo KPI */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <Label className="text-lg font-bold text-gray-900">
                Como ele deve se comportar?
              </Label>
              <p className="text-sm text-gray-600">Descreva a personalidade e jeito de ser</p>
            </div>
          </div>

          <Textarea
            value={data.agent_profile}
            onChange={(e) => onChange('agent_profile', e.target.value)}
            placeholder="Ex: Deve ser educado, paciente e sempre ajudar o cliente. Faz perguntas para entender melhor antes de responder. Nunca é grosseiro."
            className="min-h-[120px] text-base bg-white/60 border-2 border-white/50 focus:border-purple-500 rounded-xl transition-all"
            required
          />

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 rounded-full translate-y-12 -translate-x-12" />
        </CardContent>
      </Card>

      {/* Card 3: Proibições - Estilo KPI (REORDENADO) */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600">
              <ShieldX className="h-6 w-6 text-white" />
            </div>
            <div>
              <Label className="text-lg font-bold text-gray-900">
                O que ele NÃO pode fazer?
              </Label>
              <p className="text-sm text-gray-600">Adicione regras de proibição</p>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <Input
              value={newProhibition}
              onChange={(e) => setNewProhibition(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddProhibition()}
              placeholder="Ex: Nunca dar descontos sem autorização"
              className="h-12 text-base bg-white/60 border-2 border-white/50 focus:border-red-500 rounded-xl transition-all"
            />
            <Button
              onClick={handleAddProhibition}
              className="h-12 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all"
            >
              Adicionar
            </Button>
          </div>

          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {data.prohibitions.map((prohibition, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl transition-all hover:bg-red-100"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">❌</span>
                  <span className="text-sm font-medium text-gray-800">{prohibition}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveProhibition(index)}
                  className="h-8 w-8 p-0 hover:bg-red-200 rounded-lg"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
            {data.prohibitions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma proibição configurada. Clique em "Adicionar" para criar regras.
              </p>
            )}
          </div>

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-600/10 rounded-full translate-y-12 -translate-x-12" />
        </CardContent>
      </Card>

      {/* Card 4: Assinatura - EM BREVE (MOVIDO PARA ÚLTIMO E REDUZIDO 50%) */}
      <div className="max-w-[50%] mx-auto">
        <Card className={cn(
          "relative overflow-hidden transition-all duration-300",
          "rounded-2xl bg-white/25 backdrop-blur-lg border border-white/30 shadow-xl opacity-70"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-500">
                <Pen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                  Assinatura de mensagens
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    EM BREVE
                  </span>
                </Label>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-center">
              🚀 Funcionalidade em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Navegação com Setas */}
      <div className="flex justify-between items-center pt-6 border-t border-white/30">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-8 h-14 bg-white/60 border-2 border-white/50 hover:bg-white/80 rounded-xl font-semibold transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          className="px-10 h-14 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          Próximo: Conhecimento
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
};
