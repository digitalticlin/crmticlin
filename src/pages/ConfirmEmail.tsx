
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConfirmEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmailConfirmation = async () => {
      try {
        console.log('[ConfirmEmail] 🔍 Verificando confirmação de email...');
        
        // Verificar se há hash na URL (formato: #access_token=...&type=signup)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const tokenType = hashParams.get('type');
        const refreshToken = hashParams.get('refresh_token');

        console.log('[ConfirmEmail] 📝 Parâmetros do hash:', {
          hasAccessToken: !!accessToken,
          tokenType,
          hasRefreshToken: !!refreshToken
        });

        if (!accessToken || tokenType !== 'signup') {
          console.log('[ConfirmEmail] ❌ Token de confirmação inválido ou ausente');
          setStatus("error");
          setMessage("Link de confirmação inválido ou expirado. Por favor, solicite um novo email de confirmação.");
          return;
        }

        // Verificar se há uma sessão ativa após o redirect
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[ConfirmEmail] ❌ Erro ao verificar sessão:', sessionError);
          setStatus("error");
          setMessage("Erro ao verificar confirmação. Por favor, tente fazer login.");
          return;
        }

        if (sessionData.session) {
          console.log('[ConfirmEmail] ✅ Email confirmado com sucesso!');
          setStatus("success");
          setMessage("Seu email foi confirmado com sucesso! Você já está logado.");
          
          // Redirecionar para dashboard após 3 segundos
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 3000);
        } else {
          console.log('[ConfirmEmail] ✅ Email confirmado, mas sessão não ativa');
          setStatus("success");
          setMessage("Seu email foi confirmado com sucesso! Você pode fazer login agora.");
        }

      } catch (error: any) {
        console.error('[ConfirmEmail] ❌ Erro na verificação:', error);
        setStatus("error");
        setMessage("Ocorreu um erro ao confirmar seu email. Por favor, tente novamente ou faça login.");
      }
    };

    verifyEmailConfirmation();
  }, [navigate]);

  const handleResendEmail = async () => {
    try {
      toast.info("Para reenviar o email de confirmação, use a opção 'Esqueci minha senha' na tela de login.");
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      console.error("Erro ao redirecionar:", error);
    }
  };

  return (
    <BackgroundGradient className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200">
      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <img
              src="/lovable-uploads/68c955d6-5aab-40d3-9018-c372a8f3faf6.png"
              alt="Ticlin CRM"
              className="h-14 transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ticlin-400 to-ticlin-600 opacity-10 rounded-lg blur-lg"></div>
          </div>
        </div>
        
        <div className="w-full rounded-3xl bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl p-8 space-y-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/35 text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-ticlin/10 backdrop-blur-sm border border-ticlin/20">
                <Loader2 className="h-8 w-8 text-ticlin-600 animate-spin" />
              </div>
              <div className="space-y-4 animate-scale-in">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Verificando...
                </h1>
                <p className="text-sm text-gray-700 font-medium">
                  Estamos verificando seu email. Por favor, aguarde.
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
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  E-mail confirmado!
                </h1>
                <p className="text-sm text-gray-700 font-medium">{message}</p>
              </div>
              <Link to="/dashboard">
                <Button className="w-full h-12 rounded-full bg-gradient-to-r from-ticlin-500 to-ticlin-600 hover:from-ticlin-600 hover:to-ticlin-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0">
                  Ir para o Dashboard
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
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Erro na confirmação
                </h1>
                <p className="text-sm text-gray-700 font-medium">{message}</p>
              </div>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-full bg-white/50 backdrop-blur-sm border-white/30 text-gray-800 hover:bg-white/60 transition-all duration-300" 
                  onClick={handleResendEmail}
                >
                  Ir para o Login
                </Button>
                <Link to="/login">
                  <Button 
                    variant="link" 
                    className="w-full text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
                  >
                    Voltar para login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-700 mt-8 font-medium">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </BackgroundGradient>
  );
}
