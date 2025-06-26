
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TiclinAvatarProps {
  profilePicUrl?: string;
  customAvatar?: string;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16"
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-lg",
  lg: "text-2xl"
};

export const TiclinAvatar = ({ 
  profilePicUrl, 
  customAvatar, 
  name, 
  className,
  size = "md"
}: TiclinAvatarProps) => {
  // Lógica de prioridade: WhatsApp profile pic > custom avatar > Ticlin default
  const imageUrl = profilePicUrl || customAvatar;
  
  return (
    <Avatar className={cn(sizeClasses[size], "ring-2 ring-white/10", className)}>
      {imageUrl && (
        <AvatarImage src={imageUrl} alt={name} />
      )}
      <AvatarFallback 
        className={cn(
          "bg-black text-yellow-400 font-extrabold flex items-center justify-center",
          textSizeClasses[size]
        )}
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        T
      </AvatarFallback>
    </Avatar>
  );
};
