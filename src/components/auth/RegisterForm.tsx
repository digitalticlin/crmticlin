
import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Import schema
import { registerSchema, RegisterFormValues } from "./register/registerSchema";

// Import component parts
import { FullNameField } from "./register/FullNameField";
import { EmailField } from "./register/EmailField";
import { UsernameField } from "./register/UsernameField";
import { ContactInfoFields } from "./register/ContactInfoFields";
import { PasswordFields } from "./register/PasswordFields";

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
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
    
    // Generate username from whatever is typed, but only up to the @ symbol if present
    const usernameValue = email.includes("@") ? email.split("@")[0] : email;
    form.setValue("username", usernameValue);
  };

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    
    try {
      // Preparar os dados do usuário para o Supabase com role definido como admin
      const userData = {
        full_name: data.fullName,
        username: data.username,
        document_id: data.documentId,
        whatsapp: data.whatsapp,
        role: "admin" // Definindo explicitamente o papel como admin
      };
      
      // Registrar o usuário usando o AuthContext
      await signUp(data.email, data.password, userData);
      // Redirecionamento é feito pelo AuthContext após o registro
    } catch (error) {
      // Erros são tratados no AuthContext
      console.error("Erro de registro:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full rounded-3xl relative overflow-hidden bg-gradient-to-b from-ticlin-400 to-transparent shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-lg border border-white/20 rounded-3xl"></div>
      
      {/* Content */}
      <div className="relative z-10 p-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-4 text-center animate-scale-in">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Criar nova conta
          </h1>
          <p className="text-sm text-white/90 font-medium">
            Preencha os campos abaixo para criar sua conta
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FullNameField form={form} />
            <EmailField form={form} onEmailChange={handleEmailChange} />
            <UsernameField form={form} />
            <ContactInfoFields form={form} />
            <PasswordFields form={form} />
            
            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-white text-ticlin-600 hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-ticlin-600/30 border-t-ticlin-600 rounded-full animate-spin"></div>
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
        
        <div className="text-center text-sm text-white/90">
          Já tem uma conta?{" "}
          <Link to="/" className="text-white font-medium hover:text-white/80 transition-colors duration-200 underline-offset-4 hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
