
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ticlin/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-ticlin/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-4 flex justify-center">
          <img
            src="/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png"
            alt="Ticlin CRM"
            className="h-12"
          />
        </div>
        
        <div className="w-full rounded-lg border bg-card shadow-sm p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Recuperar Senha
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSubmitted 
                ? "Verifique seu e-mail para instruções de recuperação de senha" 
                : "Informe seu e-mail para redefinir sua senha"}
            </p>
          </div>

          {!isSubmitted ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-8"
                            placeholder="seu.email@exemplo.com"
                            type="email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Instruções"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <p className="text-sm text-green-700 dark:text-green-300">
                Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. 
                Verifique sua caixa de entrada e pasta de spam.
              </p>
            </div>
          )}
          
          <div className="text-center text-sm">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar para login
            </Link>
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
