
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
        
        <div className="w-full rounded-3xl relative overflow-hidden bg-gradient-to-b from-ticlin-400 to-transparent shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] text-center">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-lg border border-white/20 rounded-3xl"></div>
          
          {/* Content */}
          <div className="relative z-10 p-8 space-y-8">
            {status === "loading" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
                <div className="space-y-4 animate-scale-in">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Verificando...
                  </h1>
                  <p className="text-sm text-white/90 font-medium">
                    Estamos verificando seu e-mail. Por favor, aguarde.
                  </p>
                </div>
              </>
            )}
            
            {status === "success" && (
              <>
                <div className="mx-auto bg-green-50/80 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center border border-green-200/50">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-4 animate-scale-in">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    E-mail confirmado!
                  </h1>
                  <p className="text-sm text-white/90 font-medium">{message}</p>
                </div>
                <Link to="/">
                  <Button className="w-full h-12 rounded-full bg-white text-ticlin-600 hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0">
                    Ir para o login
                  </Button>
                </Link>
              </>
            )}
            
            {status === "error" && (
              <>
                <div className="mx-auto bg-red-50/80 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center border border-red-200/50">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-4 animate-scale-in">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Erro na confirmação
                  </h1>
                  <p className="text-sm text-white/90 font-medium">{message}</p>
                </div>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-full bg-white/30 backdrop-blur-sm border-white/30 text-white hover:bg-white/40 transition-all duration-300" 
                    onClick={handleResendEmail}
                  >
                    Reenviar e-mail de confirmação
                  </Button>
                  <Link to="/">
                    <Button 
                      variant="link" 
                      className="w-full text-white/90 hover:text-white font-medium transition-colors duration-200"
                    >
                      Voltar para login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-700 mt-8 font-medium">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
