
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export function BackgroundGradient({ className, children }: BackgroundGradientProps) {
  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, 
          hsl(0, 0%, 6%) 0%,
          hsl(0, 0%, 10%) 25%,
          hsl(0, 0%, 15%) 50%,
          hsl(0, 0%, 12%) 75%,
          hsl(0, 0%, 8%) 100%)`,
        backgroundSize: '300% 300%',
        animation: 'flow-liquid 12s ease-in-out infinite'
      }}
    >
      {/* Elementos "blobs" líquidos grayscale com animação */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(60, 60, 60, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(80, 80, 80, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(40, 40, 40, 0.2) 0%, transparent 70%)
          `,
          animation: 'flow-liquid-blobs 15s ease-in-out infinite alternate',
          opacity: 0.7,
          transform: 'scale(1)',
          willChange: 'transform, opacity'
        }}
      />
      
      {/* Conteúdo */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
