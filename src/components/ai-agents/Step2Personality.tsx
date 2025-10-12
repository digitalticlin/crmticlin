import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, ShieldX, X, Building, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step2PersonalityProps {
  data: {
    agent_function: string;
    company_info: string;
    prohibitions: string[];
  };
  onChange: (field: string, value: any) => void;
}

export const Step2Personality = ({ data, onChange }: Step2PersonalityProps) => {
  const [newProhibition, setNewProhibition] = useState("");
  const [objectiveExpanded, setObjectiveExpanded] = useState(false);
  const [companyExpanded, setCompanyExpanded] = useState(false);
  const [prohibitionsExpanded, setProhibitionsExpanded] = useState(false);

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

  const companyInfoPlaceholder = `Descreva sua empresa para o agente conhecer bem o negócio:

• Nome da empresa:
• CNPJ: (se aplicável)
• Segmento de atuação:
• Principais produtos/serviços:
• Diferenciais competitivos:
• Missão e valores:
• Localização/Área de atuação:

Exemplo:
"Somos a TicLin, uma empresa de tecnologia especializada em automação comercial para pequenas e médias empresas. Atuamos há 5 anos no mercado, oferecendo CRM, automação de WhatsApp e IA conversacional. Nosso diferencial é a simplicidade e suporte dedicado."`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-20">
      {/* Card: Descreva o objetivo */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setObjectiveExpanded(!objectiveExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900 cursor-pointer">
                  Descreva o objetivo desse funcionário
                </Label>
                <p className="text-xs text-gray-600">
                  {data.agent_function ? 'Função definida' : 'Defina a função e responsabilidades'}
                </p>
              </div>
            </div>
            {objectiveExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {objectiveExpanded && (
            <div className="mt-4">
              <Textarea
                value={data.agent_function}
                onChange={(e) => onChange('agent_function', e.target.value)}
                placeholder="Ex: Deve ser educado, paciente e sempre ajudar o cliente. Faz perguntas para entender melhor antes de responder. Nunca é grosseiro."
                className="min-h-[120px] text-base bg-white/40 border border-white/40 focus:border-purple-500 focus:bg-white/50 rounded-xl transition-all kanban-column-scrollbar"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card: Informações da Empresa */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setCompanyExpanded(!companyExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900 cursor-pointer">
                  O que ele precisa saber sobre sua empresa?
                </Label>
                <p className="text-xs text-gray-600">
                  {data.company_info ? 'Informações da empresa definidas' : 'Conte tudo sobre seu negócio'}
                </p>
              </div>
            </div>
            {companyExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {companyExpanded && (
            <div className="mt-4">
              <Textarea
                value={data.company_info}
                onChange={(e) => onChange('company_info', e.target.value)}
                placeholder={companyInfoPlaceholder}
                className="min-h-[180px] text-base bg-white/40 border border-white/40 focus:border-blue-500 focus:bg-white/50 rounded-xl transition-all kanban-column-scrollbar"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card: Proibições */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setProhibitionsExpanded(!prohibitionsExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                <ShieldX className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900 cursor-pointer">
                  O que ele NÃO pode fazer? (Opcional)
                </Label>
                <p className="text-xs text-gray-600">
                  {data.prohibitions.length > 0 ? `${data.prohibitions.length} regras de proibição` : 'Adicione regras de proibição'}
                </p>
              </div>
            </div>
            {prohibitionsExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {prohibitionsExpanded && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newProhibition}
                  onChange={(e) => setNewProhibition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddProhibition()}
                  placeholder="Ex: Nunca dar descontos sem autorização"
                  className="h-12 text-base bg-white/40 border border-white/40 focus:border-red-500 focus:bg-white/50 rounded-xl transition-all"
                />
                <Button
                  onClick={handleAddProhibition}
                  className="h-10 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all"
                >
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto kanban-column-scrollbar">
                {data.prohibitions.map((prohibition, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-white/20 border border-white/30 rounded-lg transition-all hover:bg-white/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">❌</span>
                      <span className="text-sm font-medium text-gray-800">{prohibition}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProhibition(index)}
                      className="h-7 w-7 p-0 hover:bg-white/40 rounded-lg"
                    >
                      <X className="h-3.5 w-3.5 text-gray-700" />
                    </Button>
                  </div>
                ))}
                {data.prohibitions.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Nenhuma proibição configurada. Clique em "Adicionar" para criar regras.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
