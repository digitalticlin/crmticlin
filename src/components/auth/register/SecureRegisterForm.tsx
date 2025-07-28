import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

// Esquema de validação mais rigoroso
const secureRegisterSchema = z.object({
  fullName: z.string()
    .min(3, "Nome completo deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  email: z.string()
    .email("Email inválido")
    .min(5, "Email muito curto")
    .max(100, "Email muito longo"),
  username: z.string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
    .max(50, "Nome de usuário muito longo")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário deve conter apenas letras, números e underscore"),
  documentId: z.string()
    .min(11, "CPF/CNPJ deve ter pelo menos 11 caracteres")
    .max(18, "CPF/CNPJ muito longo")
    .regex(/^[0-9./-]+$/, "CPF/CNPJ deve conter apenas números e separadores"),
  whatsapp: z.string()
    .min(10, "WhatsApp deve ter pelo menos 10 dígitos")
    .max(15, "WhatsApp muito longo")
    .regex(/^[0-9+()-\s]+$/, "WhatsApp deve conter apenas números e separadores"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           "Senha deve ter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial"),
  confirmPassword: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SecureRegisterFormValues = z.infer<typeof secureRegisterSchema>;

export default function SecureRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  
  const form = useForm<SecureRegisterFormValues>({
    resolver: zodResolver(secureRegisterSchema),
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
  
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    form.setValue("email", email);
    
    // Gerar username de forma segura
    const usernameValue = email.includes("@") ? email.split("@")[0] : email;
    const sanitizedUsername = usernameValue.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    form.setValue("username", sanitizedUsername);
  };

  async function onSubmit(data: SecureRegisterFormValues) {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('[SecureRegisterForm] 🔐 Iniciando registro seguro para:', data.email);
    
    try {
      // Sanitizar dados antes de enviar
      const sanitizedData = {
        full_name: data.fullName.trim(),
        username: data.username.trim().toLowerCase(),
        document_id: data.documentId.replace(/[^0-9]/g, ''),
        whatsapp: data.whatsapp.replace(/[^0-9]/g, ''),
        role: "operational" as const // ✅ PAPEL PADRÃO SEGURO
      };
      
      console.log('[SecureRegisterForm] 📋 Dados sanitizados:', { 
        ...sanitizedData, 
        role: sanitizedData.role 
      });
      
      await signUp(data.email.trim().toLowerCase(), data.password, sanitizedData);
      
      form.reset();
      console.log('[SecureRegisterForm] ✅ Registro seguro concluído');
      
    } catch (error: any) {
      console.error('[SecureRegisterForm] ❌ Erro no registro:', error);
      
      // Mensagens de erro mais seguras (não exposição de informações)
      if (error.message.includes('User already registered')) {
        toast.error("Este email já está registrado. Tente fazer login.");
      } else if (error.message.includes('Password')) {
        toast.error("Erro na senha. Verifique os requisitos.");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
      
      form.setError("root", { 
        message: "Erro ao criar conta. Verifique os dados e tente novamente." 
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-card-scale w-full rounded-3xl bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl p-8 space-y-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/35">
      <div className="space-y-4 text-center animate-scale-in">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Criar nova conta
        </h1>
        <p className="text-sm text-gray-700 font-medium">
          Preencha os campos abaixo para criar sua conta de forma segura
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="space-y-3">
            <label
              htmlFor="fullName"
              className="text-gray-800 font-medium block"
            >
              Nome Completo
            </label>
            <input
              type="text"
              id="fullName"
              className="w-full h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300 pl-4"
              placeholder="Nome Completo"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="email"
              className="text-gray-800 font-medium block"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300 pl-4"
              placeholder="exemplo@email.com"
              {...form.register("email")}
              onChange={handleEmailChange}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="username"
              className="text-gray-800 font-medium block"
            >
              Nome de Usuário
            </label>
            <input
              type="text"
              id="username"
              className="w-full h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300 pl-4"
              placeholder="Nome de Usuário"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="documentId"
              className="text-gray-800 font-medium block"
            >
              CPF/CNPJ
            </label>
            <input
              type="text"
              id="documentId"
              className="w-full h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300 pl-4"
              placeholder="CPF/CNPJ"
              {...form.register("documentId")}
            />
            {form.formState.errors.documentId && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.documentId.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="whatsapp"
              className="text-gray-800 font-medium block"
            >
              WhatsApp
            </label>
            <input
              type="text"
              id="whatsapp"
              className="w-full h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300 pl-4"
              placeholder="WhatsApp"
              {...form.register("whatsapp")}
            />
            {form.formState.errors.whatsapp && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.whatsapp.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="password"
              className="text-gray-800 font-medium block"
            >
              Senha
            </label>
            <input
              type="password"
              id="password"
              className="w-full h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300 pl-4"
              placeholder="Senha"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="confirmPassword"
              className="text-gray-800 font-medium block"
            >
              Confirmar Senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300 pl-4"
              placeholder="Confirmar Senha"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          
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
