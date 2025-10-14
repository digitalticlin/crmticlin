
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
          hsl(0, 0%, 20%) 0%,
          hsl(0, 0%, 25%) 25%,
          hsl(0, 0%, 35%) 50%,
          hsl(0, 0%, 30%) 75%,
          hsl(0, 0%, 22%) 100%)`,
        backgroundSize: '300% 300%',
        animation: 'flow-liquid 12s ease-in-out infinite'
      }}
    >
      
      {/* Conteúdo */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
