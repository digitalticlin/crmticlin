
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export function BackgroundGradient({ className, children }: BackgroundGradientProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Novo gradiente baseado no RETORNO - Sistema de 5 camadas */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(222, 220, 0, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(149, 193, 31, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(222, 220, 0, 0.2) 0%, transparent 60%),
            linear-gradient(135deg,
              rgba(222, 220, 0, 0.1) 0%,
              rgba(255, 238, 102, 0.15) 25%,
              rgba(149, 193, 31, 0.2) 50%,
              rgba(123, 160, 24, 0.15) 75%,
              rgba(222, 220, 0, 0.1) 100%
            ),
            linear-gradient(45deg,
              rgba(45, 56, 8, 0.05) 0%,
              rgba(98, 128, 18, 0.1) 50%,
              rgba(45, 56, 8, 0.05) 100%
            )
          `,
          backgroundPosition: 'center 30%',
          backgroundColor: '#fffef0' // pulse-50 fallback
        }}
      />

      {/* Elementos de profundidade com gradiente pulse */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Elemento blur principal com gradiente pulse */}
        <div className="absolute -top-[10%] -right-[5%] w-1/2 h-[70%] opacity-20 blur-3xl rounded-full"
             style={{
               background: 'linear-gradient(180deg, rgba(222, 220, 0, 0.8) 0%, rgba(149, 193, 31, 0) 100%)'
             }}></div>

        {/* Elemento parallax de fundo */}
        <div className="hidden lg:block absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-3xl -z-10"
             style={{
               backgroundColor: 'rgba(255, 250, 204, 0.3)' // pulse-100/30
             }}></div>

        {/* Elementos flutuantes adicionais */}
        <div className="absolute top-1/4 left-10 w-48 h-48 rounded-full blur-2xl animate-pulse"
             style={{
               backgroundColor: 'rgba(222, 220, 0, 0.1)'
             }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-36 h-36 rounded-full blur-xl animate-pulse delay-700"
             style={{
               backgroundColor: 'rgba(149, 193, 31, 0.15)'
             }}></div>
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
