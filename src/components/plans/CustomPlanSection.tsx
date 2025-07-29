
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Sparkles, Phone, Mail, ArrowRight, Zap } from 'lucide-react';

export const CustomPlanSection = () => {
  const handleContact = () => {
    // Abrir WhatsApp para contato
    window.open('https://wa.me/5511999999999?text=Olá! Quero um plano personalizado acima de 15k mensagens', '_blank');
  };

  const handleCustomizeAI = () => {
    // Abrir WhatsApp para personalização da IA
    window.open('https://wa.me/5511999999999?text=Olá! Quero personalizar minha IA com mais funções', '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Plano Personalizado */}
      <Card className="glass-card border-2 border-gradient-to-r from-indigo-500/30 to-purple-500/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Plano Personalizado
                </CardTitle>
                <p className="text-muted-foreground">Para empresas com necessidades específicas</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1">
              +15K MENSAGENS
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">📈 Volume Empresarial</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  <span>Acima de 15.000 mensagens/mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  <span>Agentes IA ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  <span>Usuários e números ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  <span>Suporte prioritário 24/7</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">🎯 Benefícios Exclusivos</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Preços especiais por volume</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Gerente de conta dedicado</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Integrações customizadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>SLA garantido</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 rounded-xl border border-indigo-200/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                💰 Economia de até 40%
              </div>
              <p className="text-sm text-muted-foreground">
                Planos customizados com preços especiais para alto volume
              </p>
            </div>
          </div>

          <Button 
            onClick={handleContact}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            💬 Solicitar Proposta Personalizada
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Personalizar IA */}
      <Card className="glass-card border-2 border-gradient-to-r from-orange-500/30 to-red-500/30 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                🤖 Personalizar sua IA
              </CardTitle>
              <p className="text-muted-foreground">Desenvolva funcionalidades exclusivas para seu negócio</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-orange-50/50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200/30">
              <div className="font-semibold mb-2">🎯 Automações Avançadas</div>
              <p className="text-muted-foreground">Fluxos personalizados e integrações específicas</p>
            </div>
            
            <div className="bg-red-50/50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200/30">
              <div className="font-semibold mb-2">📊 Relatórios Customizados</div>
              <p className="text-muted-foreground">Dashboards e métricas sob medida</p>
            </div>
            
            <div className="bg-yellow-50/50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200/30">
              <div className="font-semibold mb-2">🔧 Integrações Especiais</div>
              <p className="text-muted-foreground">APIs e sistemas externos</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-xl border border-orange-200/30">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">
                🚀 Transforme sua operação com IA personalizada
              </div>
              <p className="text-sm text-muted-foreground">
                Nossos especialistas desenvolvem soluções únicas para maximizar seus resultados
              </p>
            </div>
          </div>

          <Button 
            onClick={handleCustomizeAI}
            className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            ✨ Personalizar Minha IA Agora
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
