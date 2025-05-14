
import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";

// Import schema
import { registerSchema, RegisterFormValues } from "./register/registerSchema";

// Import component parts
import { FullNameField } from "./register/FullNameField";
import { EmailField } from "./register/EmailField";
import { UsernameField } from "./register/UsernameField";
import { ContactInfoFields } from "./register/ContactInfoFields";
import { PasswordFields } from "./register/PasswordFields";
import { SubmitButton } from "./register/SubmitButton";

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
    <div className="w-full rounded-lg border bg-card shadow-sm p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Criar nova conta
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para criar sua conta
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FullNameField form={form} />
          <EmailField form={form} onEmailChange={handleEmailChange} />
          <UsernameField form={form} />
          <ContactInfoFields form={form} />
          <PasswordFields form={form} />
          <SubmitButton isLoading={isLoading} />
        </form>
      </Form>
      
      <div className="text-center text-sm">
        Já tem uma conta?{" "}
        <Link to="/" className="underline font-medium">
          Entrar
        </Link>
      </div>
    </div>
  );
}
