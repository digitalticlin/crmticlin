import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Workflow, MessageCircle, ChevronDown, Check, Pen, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Step1BasicProps {
  data: {
    name: string;
    objective: { name: string; description: string };
    funnel_id: string | null;
    communication_style: { name: string; description: string };
    instance_phone: string | null;
    message_signature_enabled: boolean;
  };
  onChange: (field: string, value: any) => void;
}

export const Step1Basic = ({ data, onChange }: Step1BasicProps) => {
  const [funnels, setFunnels] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nameExpanded, setNameExpanded] = useState(false);
  const [funnelExpanded, setFunnelExpanded] = useState(false);
  const [whatsappExpanded, setWhatsappExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Erro ao obter usuário:', userError);
          return;
        }

        const [funnelsResult, whatsappResult] = await Promise.all([
          supabase
            .from('funnels')
            .select('id, name')
            .eq('created_by_user_id', user.id)
            .order('name'),
          supabase
            .from('whatsapp_instances')
            .select('id, phone, instance_name, profile_name')
            .eq('created_by_user_id', user.id)
            .order('phone')
        ]);

        if (funnelsResult.data) setFunnels(funnelsResult.data);
        if (whatsappResult.data) setWhatsappInstances(whatsappResult.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const objectives = [
    {
      value: {
        name: 'Vendas',
        description: 'Seu objetivo é vender. Conduza a conversa para entender a necessidade do cliente, apresente soluções adequadas, contorne objeções de forma persuasiva e trabalhe ativamente para fechar a venda. Seja proativo em oferecer produtos/serviços e criar senso de urgência quando apropriado.'
      },
      icon: '💰',
      title: 'Vendas',
      preview: 'Converter leads em vendas',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      value: {
        name: 'Suporte',
        description: 'Seu objetivo é ajudar e resolver problemas. Seja paciente, empático e focado em solucionar dúvidas ou questões técnicas. Ouça atentamente o problema, faça perguntas para entender melhor a situação e forneça soluções claras e práticas. A satisfação do cliente é prioridade.'
      },
      icon: '🎧',
      title: 'Suporte',
      preview: 'Atender e ajudar clientes',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      value: {
        name: 'Qualificação',
        description: 'Seu objetivo é identificar se o lead tem potencial de compra. Faça perguntas estratégicas para entender: necessidade real, orçamento disponível, autoridade para decidir e timing de compra. Colete informações importantes e classifique o lead antes de encaminhá-lo para o time de vendas.'
      },
      icon: '✅',
      title: 'Qualificação',
      preview: 'Qualificar leads para o time',
      gradient: 'from-blue-500 to-blue-600'
    },
  ];

  const communicationStyles = [
    {
      value: {
        name: 'Formal',
        description: 'Use linguagem formal e respeitosa. Trate o cliente com "Senhor(a)" ou "Você" de forma educada. Evite gírias, abreviações ou emojis. Seja objetivo, claro e mantenha tom profissional em todas as interações. Use vocabulário técnico quando necessário e sempre demonstre seriedade.'
      },
      icon: '👔',
      title: 'FORMAL',
      subtitle: 'Sério e profissional',
      preview: 'Prezado(a) cliente, como posso auxiliá-lo(a) hoje?',
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      value: {
        name: 'Normal',
        description: 'Use linguagem natural e acessível. Seja cordial sem ser formal demais. Pode usar "você" de forma amigável. Evite gírias excessivas, mas pode usar termos cotidianos. Seja claro, direto e mantenha equilíbrio entre profissionalismo e proximidade. Emojis ocasionais são aceitáveis.'
      },
      icon: '💼',
      title: 'NORMAL',
      subtitle: 'Profissional e acessível',
      preview: 'Olá! Como posso ajudar você hoje?',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      value: {
        name: 'Descontraído',
        description: 'Seja amigável e próximo como um amigo. Use linguagem casual, gírias leves e emojis para transmitir emoção. Trate o cliente de forma pessoal e descontraída. Faça a conversa fluir naturalmente, com bom humor quando apropriado. Evite ser excessivamente informal a ponto de perder credibilidade.'
      },
      icon: '😄',
      title: 'DESCONTRAÍDO',
      subtitle: 'Amigável e próximo',
      preview: 'E aí! Tudo certo? Como posso te ajudar? 😊',
      gradient: 'from-yellow-400 to-orange-500'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-20">
      {/* Seção Objetivo - MINIMALISTA */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-600">Selecione o objetivo deste Funcionário</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {objectives.map((obj) => (
            <button
              key={obj.value.name}
              onClick={() => onChange('objective', obj.value)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 backdrop-blur-sm",
                data.objective?.name === obj.value.name
                  ? 'border-2 border-ticlin bg-ticlin/10 shadow-md'
                  : 'border border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/40'
              )}
            >
              <span className="text-xl">{obj.icon}</span>
              <div className="flex-1 text-left">
                <p className={cn(
                  "font-semibold text-sm",
                  data.objective?.name === obj.value.name ? 'text-gray-900' : 'text-gray-700'
                )}>
                  {obj.title}
                </p>
                <p className="text-xs text-gray-500">
                  {obj.preview}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card: Nome do Agente */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setNameExpanded(!nameExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900 cursor-pointer">
                  Qual o nome desse funcionário?
                </Label>
                <p className="text-xs text-gray-600">
                  {data.name ? data.name : 'Escolha um nome descritivo para identificá-lo'}
                </p>
              </div>
            </div>
            {nameExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {nameExpanded && (
            <div className="mt-4">
              <Input
                id="name"
                value={data.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Ex: Atendente Virtual João"
                className="h-12 text-base bg-white/40 border border-white/40 focus:border-yellow-500 focus:bg-white/50 rounded-xl transition-all"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card: Funil */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setFunnelExpanded(!funnelExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Workflow className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900 cursor-pointer">
                  Escolha o funil para ele atender (Opcional)
                </Label>
                <p className="text-xs text-gray-600">
                  {data.funnel_id && data.funnel_id !== 'none'
                    ? funnels.find(f => f.id === data.funnel_id)?.name || 'Funil selecionado'
                    : 'Conecte a um funil de vendas'}
                </p>
              </div>
            </div>
            {funnelExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {funnelExpanded && (
            <div className="mt-4">
              <Select
            value={data.funnel_id || undefined}
            onValueChange={(value) => onChange('funnel_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger className={cn(
              "h-12 w-full bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-4 text-base font-medium",
              "hover:bg-white/50 hover:border-purple-400 transition-all duration-200",
              "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
              "data-[placeholder]:text-gray-500",
              isLoading && 'opacity-50 cursor-not-allowed'
            )}>
              <SelectValue placeholder="Selecione um funil (opcional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-white/40 bg-white/95 backdrop-blur-lg shadow-xl">
              <SelectItem
                value="none"
                className="rounded-lg hover:bg-purple-50 focus:bg-purple-100 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2 text-gray-600">
                  Nenhum funil
                </span>
              </SelectItem>
              {funnels.map((funnel) => (
                <SelectItem
                  key={funnel.id}
                  value={funnel.id}
                  className="rounded-lg hover:bg-purple-50 focus:bg-purple-100 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    🎯 {funnel.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
              </Select>

              {funnels.length === 0 && !isLoading && (
                <p className="text-xs text-gray-500 mt-3">
                  Nenhum funil encontrado. Crie um funil primeiro.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção Estilo de Comunicação - MINIMALISTA */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-600">Estilo de comunicação</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {communicationStyles.map((style) => (
            <button
              key={style.value.name}
              onClick={() => onChange('communication_style', style.value)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 backdrop-blur-sm",
                data.communication_style?.name === style.value.name
                  ? 'border-2 border-ticlin bg-ticlin/10 shadow-md'
                  : 'border border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/40'
              )}
            >
              <span className="text-xl">{style.icon}</span>
              <div className="flex-1 text-left">
                <p className={cn(
                  "font-semibold text-sm",
                  data.communication_style?.name === style.value.name ? 'text-gray-900' : 'text-gray-700'
                )}>
                  {style.title}
                </p>
                <p className="text-xs text-gray-500">
                  {style.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card: WhatsApp */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setWhatsappExpanded(!whatsappExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900 cursor-pointer">
                  Escolha o número que vai responder (Opcional)
                </Label>
                <p className="text-xs text-gray-600">
                  {data.instance_phone && data.instance_phone !== 'none'
                    ? formatPhone(data.instance_phone)
                    : 'Selecione a instância do WhatsApp'}
                </p>
              </div>
            </div>
            {whatsappExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {whatsappExpanded && (
            <div className="mt-4">
              <Select
            value={data.instance_phone || undefined}
            onValueChange={(value) => onChange('instance_phone', value)}
            disabled={isLoading}
          >
            <SelectTrigger className={cn(
              "h-12 w-full bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-4 text-base font-medium",
              "hover:bg-white/50 hover:border-green-400 transition-all duration-200",
              "focus:ring-2 focus:ring-green-500/20 focus:border-green-500",
              "data-[placeholder]:text-gray-500",
              isLoading && 'opacity-50 cursor-not-allowed'
            )}>
              {data.instance_phone ? (
                <span className="flex items-center gap-2">
                  📞 {formatPhone(data.instance_phone)}
                </span>
              ) : (
                <span className="text-gray-500">Selecione um número (opcional)</span>
              )}
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-white/40 bg-white/95 backdrop-blur-lg shadow-xl">
              <SelectItem
                value="none"
                className="rounded-lg hover:bg-green-50 focus:bg-green-100 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2 text-gray-600">
                  Nenhum número
                </span>
              </SelectItem>
              {whatsappInstances.map((instance) => (
                <SelectItem
                  key={instance.id}
                  value={instance.phone}
                  className="rounded-lg hover:bg-green-50 focus:bg-green-100 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    📞 {formatPhone(instance.phone) || instance.instance_name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
              </Select>

              {whatsappInstances.length === 0 && !isLoading && (
                <p className="text-xs text-gray-500 mt-3">
                  Nenhum número encontrado. Configure uma instância primeiro.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card: Assinatura de Mensagens */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
                <Pen className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900">
                  Assinatura de mensagens
                </Label>
                <p className="text-xs text-gray-600">
                  Adiciona "Agente diz:" antes de cada mensagem
                </p>
              </div>
            </div>
            <Switch
              checked={data.message_signature_enabled || false}
              onCheckedChange={(value) => onChange('message_signature_enabled', value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
