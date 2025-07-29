
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('[LoginForm] Tentando fazer login com:', data.email);
    
    try {
      await signIn(data.email, data.password);
      console.log('[LoginForm] Login realizado com sucesso');
    } catch (error: any) {
      console.error('[LoginForm] Erro no login:', error);
      form.setError("root", { 
        message: "Erro ao fazer login. Verifique suas credenciais." 
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
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-gray-700 font-medium">
          Faça login para acessar sua conta
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-800">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-600 text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-800">
                  Senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300 pr-12"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-white/20 text-gray-600 hover:text-gray-800 transition-all duration-200"
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
                <FormMessage className="text-red-600 text-sm" />
              </FormItem>
            )}
          />

          {/* Mostrar erro geral se existir */}
          {form.formState.errors.root && (
            <div className="text-red-600 text-sm text-center bg-red-50/30 backdrop-blur-sm p-3 rounded-lg border border-red-200/30">
              {form.formState.errors.root.message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-gradient-to-r from-ticlin-500 to-ticlin-600 hover:from-ticlin-600 hover:to-ticlin-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
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

      <div className="text-center space-y-4">
        <div className="text-sm text-gray-700">
          Não tem uma conta?{" "}
          <Link to="/register" className="text-gray-800 font-medium hover:text-ticlin-600 transition-colors duration-200 underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </div>
        
        <div className="text-sm text-gray-700">
          Esqueceu sua senha?{" "}
          <Link to="/forgot-password" className="text-gray-800 font-medium hover:text-ticlin-600 transition-colors duration-200 underline-offset-4 hover:underline">
            Recuperar senha
          </Link>
        </div>
      </div>
    </div>
  );
}
