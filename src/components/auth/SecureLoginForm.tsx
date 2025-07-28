
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";

// Esquema de validação mais rigoroso
const secureLoginSchema = z.object({
  email: z.string()
    .email("E-mail inválido")
    .min(5, "E-mail muito curto")
    .max(100, "E-mail muito longo"),
  password: z.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .max(128, "Senha muito longa"),
});

type SecureLoginFormValues = z.infer<typeof secureLoginSchema>;

const SecureLoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const { signIn } = useAuth();
  
  const form = useForm<SecureLoginFormValues>({
    resolver: zodResolver(secureLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SecureLoginFormValues) => {
    // Limite de tentativas para prevenir ataques de força bruta
    if (attemptCount >= 5) {
      form.setError("root", { message: "Muitas tentativas. Tente novamente em alguns minutos." });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('[SecureLoginForm] 🔐 Tentativa de login seguro:', values.email);
      
      // Sanitizar dados
      const sanitizedEmail = values.email.trim().toLowerCase();
      const sanitizedPassword = values.password.trim();
      
      await signIn(sanitizedEmail, sanitizedPassword);
      
      // Reset contador em caso de sucesso
      setAttemptCount(0);
      
    } catch (error: any) {
      console.error('[SecureLoginForm] ❌ Erro de login:', error);
      
      // Incrementar contador de tentativas
      setAttemptCount(prev => prev + 1);
      
      // Mensagens de erro genéricas para segurança
      if (error.message.includes('Email not confirmed')) {
        form.setError("root", { message: "Por favor, confirme seu email antes de fazer login." });
      } else if (error.message.includes('Invalid login credentials')) {
        form.setError("root", { message: "Credenciais inválidas. Verifique email e senha." });
      } else {
        form.setError("root", { message: "Erro no login. Tente novamente." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card-scale w-full rounded-3xl bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl p-8 space-y-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/35">
      <div className="space-y-6 text-center animate-scale-in">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <img
              src="/lovable-uploads/68c955d6-5aab-40d3-9018-c372a8f3faf6.png"
              alt="Ticlin CRM"
              className="h-16 transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ticlin-400 to-ticlin-600 opacity-10 rounded-lg blur-lg"></div>
          </div>
        </div>
        
        <p className="text-lg text-gray-700 font-medium">
          Bem-vindo de volta
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-gray-800 font-medium">Email</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                    <Input
                      className="pl-11 h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                      placeholder="exemplo@email.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-gray-800 font-medium">Senha</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200 underline-offset-4 hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                    <Input
                      className="pl-11 pr-12 h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          
          {form.formState.errors.root && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {form.formState.errors.root.message}
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-gradient-to-r from-ticlin-500 to-ticlin-600 hover:from-ticlin-600 hover:to-ticlin-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
            disabled={isLoading || attemptCount >= 5}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Entrando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Entrar
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>
      </Form>
      
      <div className="text-center text-sm text-gray-700">
        Não tem uma conta?{" "}
        <Link to="/register" className="text-gray-800 font-medium hover:text-ticlin-600 transition-colors duration-200 underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
};

export default SecureLoginForm;
