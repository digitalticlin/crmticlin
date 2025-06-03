
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
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
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      await resetPassword(values.email);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Erro ao solicitar recuperação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200 relative overflow-hidden">
      {/* Gradiente radial como segunda camada */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                       radial-gradient(circle at 80% 20%, #17191c 0%, transparent 60%),
                       radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%)`
        }}
      ></div>
      
      {/* Elementos flutuantes ajustados */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-30"></div>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
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
        
        <div className="w-full rounded-3xl relative overflow-hidden bg-gradient-to-b from-ticlin-400 to-transparent shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-lg border border-white/20 rounded-3xl"></div>
          
          {/* Content */}
          <div className="relative z-10 p-8 space-y-8">
            <div className="space-y-4 text-center animate-scale-in">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Recuperar Senha
              </h1>
              <p className="text-sm text-white/90 font-medium">
                {isSubmitted 
                  ? "Verifique seu e-mail para instruções de recuperação de senha" 
                  : "Informe seu e-mail para redefinir sua senha"}
              </p>
            </div>

            {!isSubmitted ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-white font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                            <Input
                              className="pl-11 h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                              placeholder="seu.email@exemplo.com"
                              type="email"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-200" />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full bg-white text-ticlin-600 hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-ticlin-600/30 border-t-ticlin-600 rounded-full animate-spin"></div>
                        Enviando...
                      </div>
                    ) : (
                      "Enviar Instruções"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="bg-green-50/80 backdrop-blur-sm p-6 rounded-2xl text-center border border-green-200/50">
                <p className="text-sm text-green-800 font-medium">
                  Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. 
                  Verifique sua caixa de entrada e pasta de spam.
                </p>
              </div>
            )}
            
            <div className="text-center text-sm">
              <Link to="/" className="inline-flex items-center text-white/90 hover:text-white font-medium transition-colors duration-200 underline-offset-4 hover:underline">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Voltar para login
              </Link>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-700 mt-8 font-medium">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
