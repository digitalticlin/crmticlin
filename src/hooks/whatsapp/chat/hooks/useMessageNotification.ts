
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseMessageNotificationProps {
  contactName: string;
  enabled: boolean;
}

export const useMessageNotification = ({
  contactName,
  enabled
}: UseMessageNotificationProps) => {
  
  // Som de notificação simples
  const playNotificationSound = useCallback(() => {
    if (!enabled) return;
    
    try {
      // Criar som usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('[Notification] Som não suportado');
    }
  }, [enabled]);

  // Mostrar toast de nova mensagem
  const showMessageToast = useCallback((messageText: string) => {
    if (!enabled) return;
    
    toast.success(`💬 ${contactName}`, {
      description: messageText.length > 50 
        ? `${messageText.substring(0, 47)}...`
        : messageText,
      duration: 4000,
    });
  }, [contactName, enabled]);

  // Notificação do navegador
  const showBrowserNotification = useCallback((messageText: string) => {
    if (!enabled || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(`Nova mensagem de ${contactName}`, {
        body: messageText.length > 100 
          ? `${messageText.substring(0, 97)}...`
          : messageText,
        icon: '/favicon.ico',
        tag: `message-${contactName}`,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showBrowserNotification(messageText);
        }
      });
    }
  }, [contactName, enabled]);

  const notify = useCallback((messageText: string) => {
    playNotificationSound();
    showMessageToast(messageText);
    showBrowserNotification(messageText);
  }, [playNotificationSound, showMessageToast, showBrowserNotification]);

  return {
    notify
  };
};
