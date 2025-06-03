
import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

// Import schema
import { registerSchema, RegisterFormValues } from "./register/registerSchema";

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
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
    
    // Generate username from whatever is typed, but only up to the @ symbol if present
    const usernameValue = email.includes("@") ? email.split("@")[0] : email;
    setValue("username", usernameValue);
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
    <div className="w-full bg-white rounded-lg border shadow-sm p-6">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Criar nova conta
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Preencha os campos abaixo para criar sua conta
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Nome completo
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Seu nome completo"
            className="mt-1"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu.email@exemplo.com"
            className="mt-1"
            {...register("email", {
              onChange: handleEmailChange
            })}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Nome de usuário
          </Label>
          <Input
            id="username"
            className="mt-1"
            {...register("username")}
          />
          <p className="text-xs text-gray-500 mt-1">
            Gerado automaticamente com base no email
          </p>
          {errors.username && (
            <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="documentId" className="text-sm font-medium text-gray-700">
              CPF/CNPJ
            </Label>
            <Input
              id="documentId"
              placeholder="Seu CPF ou CNPJ"
              className="mt-1"
              {...register("documentId")}
            />
            {errors.documentId && (
              <p className="text-sm text-red-600 mt-1">{errors.documentId.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
              WhatsApp
            </Label>
            <Input
              id="whatsapp"
              placeholder="(00) 00000-0000"
              className="mt-1"
              {...register("whatsapp")}
            />
            {errors.whatsapp && (
              <p className="text-sm text-red-600 mt-1">{errors.whatsapp.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Senha
          </Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="******"
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirmar senha
          </Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="******"
              {...register("confirmPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Processando..." : "Criar conta"}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>
      
      <div className="text-center text-sm text-gray-600 mt-4">
        Já tem uma conta?{" "}
        <Link to="/" className="text-blue-600 hover:text-blue-500 font-medium">
          Entrar
        </Link>
      </div>
    </div>
  );
}
