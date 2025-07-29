
/**
 * 🎯 PÁGINA SIMPLIFICADA - SEM PROVIDER
 * 
 * ANTES: Provider complexo com muitas responsabilidades
 * DEPOIS: Componente simples que usa hook direto
 * 
 * VANTAGENS:
 * ✅ Código mais limpo e legível
 * ✅ Sem overhead de contexto
 * ✅ Performance superior
 */

import { LoadingSpinner } from "@/components/ui/spinner";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { WhatsAppChatTabs } from "./WhatsAppChatTabs";
import { useWhatsAppChat } from "@/hooks/whatsapp/useWhatsAppChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

const WhatsAppChatContent = () => {
  const { companyLoading } = useWhatsAppChat();

  if (companyLoading) {
    return <WhatsAppChatLoadingState />;
  }

  return <WhatsAppChatMainContent />;
};

const WhatsAppChatLoadingState = () => {
  const { isCollapsed } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="h-screen w-full overflow-hidden relative">
      {/* Fundo gradiente fixo igual ao Dashboard */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                       radial-gradient(circle at 80% 20%, #17191c 0%, transparent 60%),
                       radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%)`,
          backgroundColor: '#e5e7eb'
        }}
      />
      
      {/* Elementos flutuantes para profundidade */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <ResponsiveSidebar />
      
      <main className={cn(
        "fixed top-0 right-0 bottom-0 z-10 overflow-auto transition-all duration-300",
        isMobile 
          ? "left-0 pt-14" 
          : isCollapsed 
            ? "left-[64px]" 
            : "left-[200px]"
      )}>
        <div className="main-content-scale flex h-full items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-800">Carregando...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const WhatsAppChatMainContent = () => {
  const { isCollapsed } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="h-screen w-full overflow-hidden relative">
      {/* Fundo gradiente fixo igual ao Dashboard */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                       radial-gradient(circle at 80% 20%, #17191c 0%, transparent 60%),
                       radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%)`,
          backgroundColor: '#e5e7eb'
        }}
      />
      
      {/* Elementos flutuantes para profundidade */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-15"></div>
      </div>

      <ResponsiveSidebar />
      
      <main className={cn(
        "fixed top-0 right-0 bottom-0 z-20 overflow-hidden transition-all duration-300",
        isMobile 
          ? "left-0 pt-14" 
          : isCollapsed 
            ? "left-[64px]" 
            : "left-[200px]"
      )}>
        <div className={cn(
          "main-content-scale p-4 md:p-6 h-full",
          isMobile && "pt-6"
        )}>
          <WhatsAppChatTabs />
        </div>
      </main>
    </div>
  );
};

// Componente principal sem Provider
export const WhatsAppChatPage = () => {
  return <WhatsAppChatContent />;
};
