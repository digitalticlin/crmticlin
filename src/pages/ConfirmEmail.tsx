
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ConfirmEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Na realidade, o processo de verificação do token é automático
        // pelo Supabase quando o usuário clica no link enviado por e-mail.
        // Aqui, apenas verificamos se há um token e se o usuário está autenticado.
        
        // Como o token é passado via URL, podemos verificar se ele existe
        if (!token) {
          setStatus("error");
          setMessage("Token de confirmação não encontrado. Por favor, solicite um novo e-mail de confirmação.");
          return;
        }
        
        // Verificar se o usuário já está autenticado
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Se o usuário já está autenticado, a confirmação foi bem-sucedida
          setStatus("success");
          setMessage("Seu e-mail foi confirmado com sucesso!");
        } else {
          // O Supabase deve ter direcionado o usuário para esta página,
          // mas o processo de confirmação não foi concluído por algum motivo
          setStatus("error");
          setMessage("Não foi possível verificar seu e-mail. O link pode ter expirado ou ser inválido.");
        }
      } catch (error) {
        console.error("Erro na verificação do token:", error);
        setStatus("error");
        setMessage("Ocorreu um erro ao confirmar seu e-mail. Por favor, tente novamente.");
      }
    };

    verifyToken();
  }, [token]);

  const handleResendEmail = async () => {
    try {
      // Para reenviar o email, precisaríamos do email do usuário
      // Por simplicidade, redirecionamos para a página de recuperação de senha
      // onde o usuário pode informar o email novamente
      setMessage("Redirecionando para recuperação de senha...");
      
      setTimeout(() => {
        window.location.href = "/forgot-password";
      }, 2000);
    } catch (error) {
      console.error("Erro ao reenviar email:", error);
      setStatus("error");
      setMessage("Erro ao reenviar e-mail de confirmação. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ticlin/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-ticlin/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-ticlin animate-spin" />
              </div>
              <h1 className="text-2xl font-bold">Verificando...</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Estamos verificando seu e-mail. Por favor, aguarde.
              </p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="mx-auto bg-green-50 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold">E-mail confirmado!</h1>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <Link to="/">
                <Button className="w-full">
                  Ir para o login
                </Button>
              </Link>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="mx-auto bg-red-50 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold">Erro na confirmação</h1>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleResendEmail}>
                  Reenviar e-mail de confirmação
                </Button>
                <Link to="/">
                  <Button variant="link" className="w-full">
                    Voltar para login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
