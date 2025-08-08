
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";

export default function ConfirmEmailInstructions() {
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
          <div className="mx-auto bg-blue-50/80 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center border border-blue-200/50">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          
          <div className="space-y-4 animate-scale-in">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Verifique seu e-mail
            </h1>
            <p className="text-sm text-gray-700 font-medium">
              Enviamos um e-mail de confirmação para você. Por favor, clique no link no e-mail para ativar sua conta.
            </p>
          </div>
          
          <div className="pt-4 space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-full bg-white/50 backdrop-blur-sm border-white/30 text-gray-800 hover:bg-white/60 transition-all duration-300"
            >
              Reenviar e-mail de confirmação
            </Button>
            
            <Link to="/">
              <Button 
                variant="link" 
                className="w-full text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Voltar para login
              </Button>
            </Link>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-700 mt-8 font-medium">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </BackgroundGradient>
  );
}
