import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CreditCard,
  RefreshCw,
  Shield,
  Clock,
  Users,
  HelpCircle
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ElementType;
}

const faqData: FAQItem[] = [
  {
    id: 'how-it-works',
    question: 'Como funciona o sistema de mensagens IA?',
    answer: 'Cada vez que você usa nossos agentes de IA para responder mensagens no WhatsApp, conta como 1 mensagem IA. Mensagens manuais (escritas por você) não contam no limite. O limite é renovado mensalmente.',
    icon: MessageCircle
  },
  {
    id: 'payment-methods',
    question: 'Quais formas de pagamento aceitas?',
    answer: 'Aceitamos cartão de crédito, PIX e boleto bancário através do Mercado Pago. Os pagamentos são processados de forma segura e você recebe confirmação instantânea.',
    icon: CreditCard
  },
  {
    id: 'cancel-anytime',
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim! Não há fidelidade. Você pode cancelar ou alterar seu plano a qualquer momento. Se cancelar, continuará tendo acesso até o final do período já pago.',
    icon: RefreshCw
  },
  {
    id: 'data-security',
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente. Usamos criptografia de ponta a ponta, servidores no Brasil e seguimos a LGPD. Seus dados nunca são compartilhados com terceiros.',
    icon: Shield
  },
  {
    id: 'trial-limits',
    question: 'O que acontece quando o trial acaba?',
    answer: 'Quando seu trial de 30 dias termina, você mantém todos os dados e configurações, mas perde acesso às funcionalidades até escolher um plano pago.',
    icon: Clock
  },
  {
    id: 'team-members',
    question: 'Como funcionam os membros operacionais?',
    answer: 'No plano Pro você pode ter até 2 membros operacionais. No Ultra, membros ilimitados. Cada membro tem seu próprio login e permissões configuráveis.',
    icon: Users
  }
];

export const PlansFAQ = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div id="plans-faq" className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          Dúvidas Frequentes
        </h2>
        <p className="text-muted-foreground">
          Tudo que você precisa saber antes de escolher seu plano
        </p>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {faqData.map((item) => {
          const isExpanded = expandedId === item.id;
          const Icon = item.icon;

          return (
            <Card
              key={item.id}
              className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/40"
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleFAQ(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold text-left">
                      {item.question}
                    </CardTitle>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-muted-foreground leading-relaxed pl-11">
                    {item.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Contato adicional */}
      <Card className="rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Ainda tem dúvidas?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Nossa equipe está pronta para te ajudar via WhatsApp
          </p>
          <Button
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
            onClick={() => {
              // Abrir WhatsApp para suporte
              window.open('https://wa.me/5535988887777?text=Olá! Tenho dúvidas sobre os planos do CRM Ticlin', '_blank');
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Falar no WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};