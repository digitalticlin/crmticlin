import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import ChartCard from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Pencil } from "lucide-react";

export default function AIAgents2() {
  const navigate = useNavigate();

  // MOCK DATA - SEM CONEXÃO COM BANCO DE DADOS
  // Esta página é apenas para construir a nova interface
  const mockAgents = [] as any[];

  const handleCreateAgent = () => {
    navigate('/ai-agents-2/create');
  };

  // Botão Editar também vai para /create (mesmo fluxo do criar)
  const handleEditAgent = () => {
    navigate('/ai-agents-2/create');
  };

  const createAgentAction = (
    <Button className="bg-ticlin hover:bg-ticlin/90 text-black font-semibold" onClick={handleCreateAgent}>
      <Sparkles className="h-4 w-4 mr-2" />
      Criar Novo Agente
    </Button>
  );

  return (
    <div className="w-full">
      <PageHeader
        title="Agentes IA (Nova Versão - Em Construção)"
        description="Nova experiência de criação de agentes com Wizard intuitivo"
        action={createAgentAction}
      />

      <ChartCard
        title="Agentes Ativos"
        description="Lista de agentes (mock - sem conexão com banco)"
      >
        <div className="mt-4 overflow-hidden">
          {/* Estado vazio com CTA */}
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🚀 Nova Experiência de Criação
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Estamos construindo uma forma totalmente nova de criar agentes de IA.<br/>
              Clique abaixo para experimentar o novo wizard em 4 etapas!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleCreateAgent}
                className="bg-ticlin hover:bg-ticlin/90 text-black font-bold text-lg px-8 h-14 shadow-xl"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Testar Novo Wizard
              </Button>
              <Button
                onClick={handleEditAgent}
                variant="outline"
                className="border-2 border-ticlin text-ticlin hover:bg-ticlin/10 font-bold text-lg px-8 h-14"
              >
                <Pencil className="h-5 w-5 mr-2" />
                Simular Edição
              </Button>
            </div>

            {/* Informações sobre o novo wizard */}
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="text-3xl mb-2">1️⃣</div>
                  <h4 className="font-bold text-gray-900 mb-1">Básico</h4>
                  <p className="text-xs text-gray-600">30 segundos</p>
                </div>
                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <div className="text-3xl mb-2">2️⃣</div>
                  <h4 className="font-bold text-gray-900 mb-1">Personalidade</h4>
                  <p className="text-xs text-gray-600">1 minuto</p>
                </div>
                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                  <div className="text-3xl mb-2">3️⃣</div>
                  <h4 className="font-bold text-gray-900 mb-1">Conhecimento</h4>
                  <p className="text-xs text-gray-600">2-3 minutos</p>
                </div>
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="text-3xl mb-2">4️⃣</div>
                  <h4 className="font-bold text-gray-900 mb-1">Fluxo</h4>
                  <p className="text-xs text-gray-600">5-10 minutos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Aviso de desenvolvimento */}
      <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
        <p className="text-sm text-yellow-800 text-center">
          <strong>⚠️ Modo de Desenvolvimento:</strong> Esta página não está conectada ao banco de dados.
          Os agentes criados aqui são apenas para teste da nova interface.
        </p>
      </div>
    </div>
  );
}
