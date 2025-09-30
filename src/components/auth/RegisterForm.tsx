
import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle, Crown, Star, Zap } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Import schema
import { registerSchema, RegisterFormValues } from "./register/registerSchema";

// Import component parts
import { FullNameField } from "./register/FullNameField";
import { EmailField } from "./register/EmailField";
import { ContactInfoFields } from "./register/ContactInfoFields";
import { PasswordFields } from "./register/PasswordFields";
import { PlanSelector } from "./register/PlanSelector";

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();

  const planFromUrl = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState(planFromUrl || 'free_200');

  const getPlanInfo = (planId: string | null) => {
    switch(planId) {
      case 'free_200':
        return {
          name: 'Teste Grátis',
          badge: 'bg-gradient-to-r from-green-500 to-green-600',
          icon: Zap,
          messages: '200 mensagens por 30 dias',
          color: 'text-green-700'
        };
      case 'pro_5k':
        return {
          name: 'Plano Pro',
          badge: 'bg-gradient-to-r from-purple-500 to-purple-600',
          icon: Star,
          messages: '5.000 mensagens/mês',
          color: 'text-purple-700'
        };
      case 'ultra_15k':
        return {
          name: 'Plano Ultra',
          badge: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          icon: Crown,
          messages: '15.000 mensagens/mês',
          color: 'text-yellow-700'
        };
      default:
        return null;
    }
  };

  const planInfo = getPlanInfo(planFromUrl);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      documentId: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Função para gerar nome de usuário a partir do email
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    form.setValue("email", email);
  };

  async function onSubmit(data: RegisterFormValues) {
    if (isLoading) return;

    setIsLoading(true);
    console.log('[RegisterForm] Iniciando registro para:', data.email);

    try {
      const userData = {
        full_name: data.fullName,
        document_id: data.documentId,
        whatsapp: data.whatsapp,
        role: "admin",
        selected_plan: selectedPlan
      };

      console.log('[RegisterForm] Dados do usuário:', userData);

      const result = await signUp(data.email, data.password, userData);

      if (result.requiresPayment && result.userId && result.plan) {
        console.log('[RegisterForm] Plano pago detectado, criando checkout...');

        const { supabase } = await import('@/integrations/supabase/client');

        // Aguardar um pouco para trigger executar (edge function fará retry)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ✅ Chamar Stripe checkout
        const { data: checkoutData, error } = await supabase.functions.invoke('stripe-checkout-plans', {
          body: {
            plan_id: result.plan,
            user_id: result.userId,
            context: 'register'
          }
        });

        if (error) {
          console.error('[RegisterForm] Erro ao criar checkout:', error);
          toast.error('Erro ao processar pagamento. Tente novamente.');
          return;
        }

        if (checkoutData?.url) {
          console.log('[RegisterForm] Redirecionando para Stripe...');
          window.location.href = checkoutData.url;
        } else {
          console.error('[RegisterForm] Checkout criado mas sem URL');
          toast.error('Erro ao criar checkout. Tente novamente.');
        }
      } else {
        form.reset();
        console.log('[RegisterForm] Registro concluído com sucesso');
      }

    } catch (error: any) {
      console.error('[RegisterForm] Erro no registro:', error);

      form.setError("root", {
        message: "Erro ao criar conta. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-card-scale w-full rounded-3xl bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl p-8 space-y-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/35">
      {/* Header Section */}
      <div className="space-y-4 text-center animate-scale-in">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Criar nova conta
        </h1>
        <p className="text-sm text-gray-700 font-medium">
          Escolha seu plano e crie sua conta
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FullNameField form={form} />
          <EmailField form={form} onEmailChange={handleEmailChange} />
          <ContactInfoFields form={form} />
          <PasswordFields form={form} />

          {/* Divisor visual */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/50 px-4 py-1 text-gray-600 rounded-full">
                Escolha seu plano
              </span>
            </div>
          </div>

          {/* Seletor de Planos - ABAIXO DO FORMULÁRIO */}
          <PlanSelector
            selectedPlan={selectedPlan}
            onPlanSelect={setSelectedPlan}
          />
          
          {/* Mostrar erro geral se existir */}
          {form.formState.errors.root && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {form.formState.errors.root.message}
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-gradient-to-r from-ticlin-500 to-ticlin-600 hover:from-ticlin-600 hover:to-ticlin-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Criando conta...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Criar conta
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>
      </Form>
      
      <div className="text-center text-sm text-gray-700">
        Já tem uma conta?{" "}
        <Link to="/" className="text-gray-800 font-medium hover:text-ticlin-600 transition-colors duration-200 underline-offset-4 hover:underline">
          Entrar
        </Link>
      </div>
    </div>
  );
}
