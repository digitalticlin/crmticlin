
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConfirmEmailInstructions() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ticlin/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-ticlin/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center space-y-6">
          <div className="mx-auto bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          
          <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
          
          <p className="text-gray-600 dark:text-gray-400">
            Enviamos um e-mail de confirmação para você. Por favor, clique no link no e-mail para ativar sua conta.
          </p>
          
          <div className="pt-4 space-y-4">
            <Button variant="outline" className="w-full">
              Reenviar e-mail de confirmação
            </Button>
            
            <Link to="/">
              <Button variant="link" className="w-full">
                Voltar para login
              </Button>
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
