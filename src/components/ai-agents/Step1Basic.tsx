import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bot, Target, Workflow, MessageCircle, ChevronDown, Check } from "lucide-react";
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
    instance_phone: string | null;
  };
  onChange: (field: string, value: any) => void;
}

export const Step1Basic = ({ data, onChange }: Step1BasicProps) => {
  const [funnels, setFunnels] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto space-y-4 relative z-20">
      {/* Card 1: Objetivo - PRIMEIRO (Reordenado) */}
      <div>
        {/* Título único simplificado */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            Qual o objetivo principal desse funcionário?
          </h2>
        </div>

        {/* Cards reduzidos para 70% da largura */}
        <div className="max-w-[70%] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          {objectives.map((obj) => (
            <button
              key={obj.value.name}
              onClick={() => onChange('objective', obj.value)}
              className={cn(
                "relative overflow-hidden p-4 rounded-2xl border-2 transition-all duration-300 text-center group",
                "hover:shadow-xl hover:scale-105",
                data.objective?.name === obj.value.name
                  ? `bg-gradient-to-br ${obj.gradient} border-transparent shadow-xl scale-105`
                  : 'bg-white/40 backdrop-blur-sm border-white/50 hover:bg-white/60'
              )}
            >
              <div className="text-4xl mb-2 transition-transform duration-300 group-hover:scale-110">
                {obj.icon}
              </div>
              <h3 className={cn(
                "font-bold text-base mb-1 transition-colors",
                data.objective?.name === obj.value.name ? 'text-white' : 'text-gray-900'
              )}>
                {obj.title}
              </h3>
              <p className={cn(
                "text-xs transition-colors",
                data.objective?.name === obj.value.name ? 'text-white/90' : 'text-gray-600'
              )}>
                {obj.preview}
              </p>

              {/* Efeito visual */}
              {data.objective?.name === obj.value.name && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -translate-y-8 translate-x-8" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: Nome do Agente - SEGUNDO (Reordenado) */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <Label htmlFor="name" className="text-lg font-bold text-gray-900">
                Qual o nome desse funcionário?
              </Label>
              <p className="text-sm text-gray-600">Escolha um nome descritivo para identificá-lo</p>
            </div>
          </div>

          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Ex: Atendente Virtual João"
            className="h-12 text-base bg-white/60 border-2 border-white/50 focus:border-yellow-500 rounded-xl transition-all"
            required
          />

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full translate-y-12 -translate-x-12" />
        </CardContent>
      </Card>

      {/* Card 3: Funil - Estilo KPI Dashboard */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Workflow className="h-6 w-6 text-white" />
            </div>
            <div>
              <Label className="text-lg font-bold text-gray-900">
                Escolha o funil para ele atender
              </Label>
              <p className="text-sm text-gray-600">Conecte a um funil de vendas (opcional)</p>
            </div>
          </div>

          <Select
            value={data.funnel_id || undefined}
            onValueChange={(value) => onChange('funnel_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger className={cn(
              "h-12 w-full bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-xl px-4 text-base font-medium",
              "hover:bg-white/80 hover:border-purple-400 transition-all duration-200",
              "focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500",
              "data-[placeholder]:text-gray-500",
              isLoading && 'opacity-50 cursor-not-allowed'
            )}>
              <SelectValue placeholder="Selecione um funil (opcional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2 border-white/50 bg-white/95 backdrop-blur-lg shadow-2xl">
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
            <p className="text-sm text-gray-500 mt-3">
              Nenhum funil encontrado. Crie um funil primeiro.
            </p>
          )}

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 rounded-full translate-y-12 -translate-x-12" />
        </CardContent>
      </Card>

      {/* Card 4: WhatsApp - Estilo KPI Dashboard */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <Label className="text-lg font-bold text-gray-900">
                Escolha o número que vai responder
              </Label>
              <p className="text-sm text-gray-600">Selecione a instância do WhatsApp (opcional)</p>
            </div>
          </div>

          <Select
            value={data.instance_phone || undefined}
            onValueChange={(value) => onChange('instance_phone', value)}
            disabled={isLoading}
          >
            <SelectTrigger className={cn(
              "h-12 w-full bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-xl px-4 text-base font-medium",
              "hover:bg-white/80 hover:border-green-400 transition-all duration-200",
              "focus:ring-2 focus:ring-green-500/30 focus:border-green-500",
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
            <SelectContent className="rounded-xl border-2 border-white/50 bg-white/95 backdrop-blur-lg shadow-2xl">
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
            <p className="text-sm text-gray-500 mt-3">
              Nenhum número encontrado. Configure uma instância primeiro.
            </p>
          )}

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-600/10 rounded-full translate-y-12 -translate-x-12" />
        </CardContent>
      </Card>
    </div>
  );
};
