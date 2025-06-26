
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
  text?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  showText = false,
  text = "Carregando..."
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10", 
    lg: "h-16 w-16"
  };

  const sizeSpacing = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      showText && sizeSpacing[size],
      className
    )}>
      <LoaderCircle 
        className={cn(
          "animate-spin text-ticlin",
          sizeClasses[size]
        )} 
      />
      {showText && (
        <p className="text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
