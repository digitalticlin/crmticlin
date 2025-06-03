
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConfirmEmailInstructions() {
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
            <div className="mx-auto bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center border border-white/30">
              <Mail className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-4 animate-scale-in">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Verifique seu e-mail
              </h1>
              <p className="text-sm text-white/90 font-medium">
                Enviamos um e-mail de confirmação para você. Por favor, clique no link no e-mail para ativar sua conta.
              </p>
            </div>
            
            <div className="pt-4 space-y-4">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-full bg-white/30 backdrop-blur-sm border-white/30 text-white hover:bg-white/40 transition-all duration-300"
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
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-700 mt-8 font-medium">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
