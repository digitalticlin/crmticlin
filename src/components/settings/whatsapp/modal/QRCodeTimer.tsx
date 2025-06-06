
import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface QRCodeTimerProps {
  isOpen: boolean;
  onExpired: () => void;
}

export const QRCodeTimer = ({ isOpen, onExpired }: QRCodeTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    setTimeLeft(300);
    setIsExpired(false);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          onExpired();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isExpired) return null;

  return (
    <div className="text-center mb-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          QR Code válido por: {formatTime(timeLeft)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        O código expira automaticamente por segurança
      </p>
    </div>
  );
};
