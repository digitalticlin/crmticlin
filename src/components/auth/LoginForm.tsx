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

const formSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      console.error("Erro de login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl p-8 space-y-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/35">
      {/* Logo Section */}
      <div className="space-y-4 text-center animate-scale-in">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <img
              src="/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png"
              alt="Ticlin CRM"
              className="h-14 transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ticlin-400 to-ticlin-600 opacity-10 rounded-lg blur-lg"></div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-white/80 font-medium">
          Entre com suas credenciais para continuar
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-white/90 font-medium">Email</FormLabel>
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
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-white/90 font-medium">Senha</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-white/70 hover:text-white transition-colors duration-200 underline-offset-4 hover:underline"
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
                      <span className="sr-only">
                        {showPassword ? "Esconder senha" : "Mostrar senha"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-gradient-to-r from-ticlin-500 to-ticlin-600 hover:from-ticlin-600 hover:to-ticlin-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
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
      
      <div className="text-center text-sm text-white/80">
        Não tem uma conta?{" "}
        <Link to="/register" className="text-white font-medium hover:text-ticlin-400 transition-colors duration-200 underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
