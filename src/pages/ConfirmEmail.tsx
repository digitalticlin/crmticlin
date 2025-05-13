
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ConfirmEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Aqui seria a lógica para verificar o token com o backend
    // Por enquanto, vamos apenas simular
    const verifyToken = async () => {
      try {
        // Simulando uma chamada de API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulando sucesso (em um caso real, isso seria baseado na resposta do backend)
        if (token && token.length > 5) {
          setStatus("success");
          setMessage("Seu e-mail foi confirmado com sucesso!");
        } else {
          setStatus("error");
          setMessage("O link é inválido ou expirou. Por favor, solicite um novo e-mail de confirmação.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Ocorreu um erro ao confirmar seu e-mail. Por favor, tente novamente.");
      }
    };

    verifyToken();
  }, [token]);

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
                <Button variant="outline" className="w-full">
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
