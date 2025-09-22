# 🚀 FLUXO DE ONBOARDING PROPOSTO - CRM TICLIN

## 📊 ANÁLISE DO FLUXO ATUAL

### Situação Atual:
1. Usuário se registra → Vai direto para Dashboard
2. Não há diferenciação entre plano gratuito e pago no registro
3. Planos só são mostrados após login

### Problemas Identificados:
- Usuário não escolhe plano antes de criar conta
- Pode criar frustração (criar conta → descobrir preços)
- Não há incentivo para escolher plano pago imediatamente

## 🎯 FLUXO IDEAL PROPOSTO

### CENÁRIO 1: USUÁRIO VINDO DA LANDING PAGE (NOVO)

#### A) Usuário quer TRIAL GRATUITO:

```
Landing Page → Botão "Começar Grátis"
    ↓
/register?plan=free_200
    ↓
Formulário de Registro (com badge "Teste Grátis - 200 msgs")
    ↓
Criar conta
    ↓
[SE EMAIL NÃO PRECISA CONFIRMAÇÃO]
    → Ativa trial automaticamente
    → Redireciona para /dashboard
    → Toast: "Bem-vindo! Seu trial de 30 dias foi ativado!"

[SE EMAIL PRECISA CONFIRMAÇÃO]
    → /confirm-email
    → Após confirmar → Ativa trial → /dashboard
```

#### B) Usuário quer PLANO PAGO:

```
Landing Page → Escolhe plano (Pro ou Ultra)
    ↓
/register?plan=pro_5k (ou ultra_15k)
    ↓
Formulário de Registro (com badge do plano escolhido)
    ↓
Criar conta
    ↓
[SE EMAIL NÃO PRECISA CONFIRMAÇÃO]
    → /checkout?plan=pro_5k
    → Checkout Mercado Pago
    → Após pagamento → /dashboard

[SE EMAIL PRECISA CONFIRMAÇÃO]
    → /confirm-email
    → Após confirmar → /checkout?plan=pro_5k
    → Após pagamento → /dashboard
```

### CENÁRIO 2: USUÁRIO JÁ LOGADO FAZENDO UPGRADE

```
Dashboard → Banner "Limite atingido" ou "Fazer upgrade"
    ↓
/plans
    ↓
Escolhe novo plano
    ↓
Checkout Mercado Pago
    ↓
Webhook processa pagamento
    ↓
Plano ativado → Reload Dashboard
```

## 💻 IMPLEMENTAÇÃO PROPOSTA

### 1. MODIFICAR REGISTERFORM

```typescript
// src/components/auth/RegisterForm.tsx
import { useSearchParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";

export default function RegisterForm() {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan');

  const getPlanInfo = (planId: string | null) => {
    switch(planId) {
      case 'free_200':
        return { name: 'Teste Grátis', badge: 'success', messages: '200 mensagens por 30 dias' };
      case 'pro_5k':
        return { name: 'Plano Pro', badge: 'purple', messages: '5.000 mensagens/mês' };
      case 'ultra_15k':
        return { name: 'Plano Ultra', badge: 'gold', messages: '15.000 mensagens/mês' };
      default:
        return null;
    }
  };

  const planInfo = getPlanInfo(planFromUrl);

  async function onSubmit(data: RegisterFormValues) {
    // ... código existente ...

    // Adicionar plano escolhido aos metadados
    const userData = {
      full_name: data.fullName,
      username: data.username,
      document_id: data.documentId,
      whatsapp: data.whatsapp,
      role: "admin",
      selected_plan: planFromUrl // NOVO: guardar plano escolhido
    };

    await signUp(data.email, data.password, userData);
  }

  return (
    <div className="auth-card-scale">
      {/* Mostrar badge do plano se vier da landing */}
      {planInfo && (
        <div className="mb-4 text-center">
          <Badge variant={planInfo.badge} className="text-sm px-4 py-2">
            {planInfo.name} - {planInfo.messages}
          </Badge>
        </div>
      )}

      {/* ... resto do formulário ... */}
    </div>
  );
}
```

### 2. MODIFICAR AUTHCONTEXT

```typescript
// src/contexts/AuthContext.tsx

const signUp = async (email: string, password: string, userData?: any) => {
  try {
    // ... código existente de signup ...

    if (data.user && !data.session) {
      // Email confirmation required
      toast.success('Conta criada! Verifique seu email para confirmar.');

      // Salvar plano escolhido no localStorage para após confirmação
      if (userData?.selected_plan) {
        localStorage.setItem('pending_plan', userData.selected_plan);
      }

      navigate('/confirm-email', { replace: true });

    } else if (data.session) {
      // User logged in automatically
      const selectedPlan = userData?.selected_plan;

      if (selectedPlan === 'free_200') {
        // Ativar trial automaticamente
        await activateFreeTrial(data.user.id);
        toast.success('Conta criada! Trial de 30 dias ativado!');
        navigate('/dashboard', { replace: true });

      } else if (selectedPlan && selectedPlan !== 'free_200') {
        // Redirecionar para checkout
        toast.success('Conta criada! Redirecionando para pagamento...');
        navigate(`/checkout?plan=${selectedPlan}`, { replace: true });

      } else {
        // Sem plano selecionado - vai direto pro dashboard
        toast.success('Conta criada com sucesso!');
        navigate('/dashboard', { replace: true });
      }
    }
  } catch (error) {
    // ... tratamento de erro ...
  }
};
```

### 3. CRIAR PÁGINA DE CHECKOUT

```typescript
// src/pages/Checkout.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { messagePlans } from '@/modules/billing/data/messagePlans';
import { MercadoPagoService } from '@/modules/billing/services/mercadopagoService';
import { Loader2 } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const planId = searchParams.get('plan');

  const plan = messagePlans.find(p => p.id === planId);

  useEffect(() => {
    if (!plan || plan.id === 'free_200') {
      // Plano inválido ou gratuito - volta pro dashboard
      navigate('/dashboard');
      return;
    }

    // Iniciar checkout automaticamente
    initiateCheckout();
  }, [plan]);

  const initiateCheckout = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const checkoutUrl = await MercadoPagoService.createCheckoutSession(plan);

      if (checkoutUrl && checkoutUrl !== 'TRIAL_ACTIVATED') {
        // Redirecionar para Mercado Pago
        window.location.href = checkoutUrl;
      } else {
        // Erro - volta pro dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-ticlin-500" />
        <h2 className="text-2xl font-bold">Preparando seu pagamento...</h2>
        <p className="text-gray-600">
          Você será redirecionado para o Mercado Pago
        </p>
        {plan && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="font-semibold">{plan.name}</p>
            <p className="text-2xl font-bold">R$ {plan.price}/mês</p>
            <p className="text-sm text-gray-600">
              {plan.message_limit.toLocaleString()} mensagens
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. ADICIONAR ROTAS

```typescript
// src/App.tsx
const Checkout = lazy(() => import('./pages/Checkout'));

// Adicionar rota de checkout (protegida)
<Route
  path="/checkout"
  element={
    <RequireAuth>
      <Suspense fallback={<PageLoader />}>
        <Checkout />
      </Suspense>
    </RequireAuth>
  }
/>
```

### 5. PÁGINA DE CONFIRMAÇÃO DE EMAIL

```typescript
// src/pages/ConfirmEmail.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ConfirmEmail() {
  const navigate = useNavigate();

  // Verificar se veio da confirmação
  useEffect(() => {
    // Se o usuário já está logado (veio do link de confirmação)
    const checkConfirmation = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Usuário confirmou email
        const pendingPlan = localStorage.getItem('pending_plan');

        if (pendingPlan === 'free_200') {
          // Ativar trial
          await activateFreeTrial(user.id);
          localStorage.removeItem('pending_plan');
          navigate('/dashboard');

        } else if (pendingPlan && pendingPlan !== 'free_200') {
          // Ir para checkout
          localStorage.removeItem('pending_plan');
          navigate(`/checkout?plan=${pendingPlan}`);

        } else {
          // Sem plano pendente
          navigate('/dashboard');
        }
      }
    };

    checkConfirmation();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold">Confirme seu Email</h1>
        <p>Enviamos um link de confirmação para seu email.</p>
        <p className="text-sm text-gray-600">
          Clique no link para ativar sua conta e continuar.
        </p>
      </div>
    </div>
  );
}
```

### 6. FUNÇÃO HELPER PARA ATIVAR TRIAL

```typescript
// src/services/billing.ts
export async function activateFreeTrial(userId: string) {
  const { data, error } = await supabase.functions.invoke(
    'mercadopago-checkout-plans',
    {
      body: {
        plan_type: 'free_200',
        plan_name: 'Trial Gratuito',
        price_amount: 0,
        message_limit: 200
      }
    }
  );

  if (error) {
    console.error('Erro ao ativar trial:', error);
    return false;
  }

  return true;
}
```

## 🎨 BENEFÍCIOS DO NOVO FLUXO

### Para o Usuário:
✅ Transparência total sobre planos antes de criar conta
✅ Processo fluído: registro → pagamento → uso imediato
✅ Trial gratuito ativado automaticamente
✅ Sem surpresas após criar a conta

### Para o Negócio:
✅ Maior conversão para planos pagos
✅ Usuários já escolhem plano na landing page
✅ Reduz abandono pós-registro
✅ Métricas claras de conversão por plano

## 📱 LANDING PAGE - BOTÕES CTA

```html
<!-- Plano Gratuito -->
<a href="/register?plan=free_200" class="btn-primary">
  Começar Grátis
</a>

<!-- Plano Pro -->
<a href="/register?plan=pro_5k" class="btn-premium">
  Escolher Plano Pro
</a>

<!-- Plano Ultra -->
<a href="/register?plan=ultra_15k" class="btn-ultra">
  Escolher Plano Ultra
</a>
```

## 🔄 FLUXO DE RETORNO DO MERCADO PAGO

Após pagamento no Mercado Pago:

```
SUCCESS → /plans?success=true
  → Toast: "Pagamento aprovado! Plano ativado!"
  → Redirect: /dashboard

PENDING → /plans?pending=true
  → Toast: "Pagamento em processamento..."
  → Mostra instruções

FAILURE → /plans?failure=true
  → Toast: "Pagamento não aprovado"
  → Mostra opções de retry
```

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Modificar RegisterForm para aceitar query param `plan`
- [ ] Atualizar AuthContext com lógica de redirecionamento
- [ ] Criar página de Checkout
- [ ] Adicionar rota /checkout
- [ ] Atualizar página ConfirmEmail
- [ ] Criar helper activateFreeTrial
- [ ] Testar fluxo completo para cada plano
- [ ] Atualizar landing page com links corretos

## 🚀 PRÓXIMOS PASSOS

1. **Implementar tracking de conversão**
   - Adicionar eventos analytics em cada etapa
   - Medir taxa de conversão por plano

2. **A/B Testing**
   - Testar diferentes CTAs
   - Otimizar copy dos planos

3. **Onboarding Tutorial**
   - Após primeiro login, mostrar tour guiado
   - Personalizar por tipo de plano