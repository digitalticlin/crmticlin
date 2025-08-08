
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export function BackgroundGradient({ className, children }: BackgroundGradientProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Fundo gradiente radial */}
      <div 
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                       radial-gradient(circle at 80% 20%, #e5e7eb 0%, transparent 60%),
                       radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%)`,
          backgroundColor: '#e5e7eb' // gray-200 fallback
        }}
      />
      
      {/* Círculo gradiente maior no canto superior direito */}
      <div 
        className="absolute top-4 right-4 w-36 h-36 opacity-70"
        style={{
          background: `radial-gradient(circle, #D3D800 0%, transparent 70%)`,
        }}
      />
      
      {/* Elementos flutuantes para profundidade */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse delay-500"></div>
        
        {/* Grid pattern sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-15"></div>
      </div>
      
      {/* Conteúdo */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
