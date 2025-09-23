/**
 * 🎯 AUTO-SCROLL HOOK PARA DRAG AND DROP
 *
 * Detecta quando o usuário arrasta próximo às bordas e
 * faz scroll automático para facilitar o drop em colunas
 * que não estão visíveis.
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  isActive: boolean; // Se drag está ativo
  scrollThreshold?: number; // Distância da borda para ativar (px)
  scrollSpeed?: number; // Velocidade do scroll (px por frame)
  container?: HTMLElement | null; // Container com scroll
}

export const useAutoScroll = ({
  isActive,
  scrollThreshold = 50,
  scrollSpeed = 8,
  container
}: UseAutoScrollOptions) => {
  const animationFrameRef = useRef<number>();
  const isScrollingRef = useRef(false);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!container || !isActive) return;

    const scrollAmount = direction === 'left' ? -scrollSpeed : scrollSpeed;

    // Scroll suave
    container.scrollBy({
      left: scrollAmount,
      behavior: 'auto' // Sem smooth para ser mais responsivo durante drag
    });

    // Log para debug
    console.log('[useAutoScroll] 🔄 Auto-scrolling:', {
      direction,
      scrollAmount,
      currentScrollLeft: container.scrollLeft,
      maxScrollLeft: container.scrollWidth - container.clientWidth
    });
  }, [container, isActive, scrollSpeed]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isActive || !container) return;

    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX;

    // Verificar se está próximo da borda esquerda
    const distanceFromLeft = mouseX - containerRect.left;
    // Verificar se está próximo da borda direita
    const distanceFromRight = containerRect.right - mouseX;

    let shouldScroll = false;
    let scrollDirection: 'left' | 'right' | null = null;

    if (distanceFromLeft < scrollThreshold && container.scrollLeft > 0) {
      shouldScroll = true;
      scrollDirection = 'left';
    } else if (distanceFromRight < scrollThreshold &&
               container.scrollLeft < container.scrollWidth - container.clientWidth) {
      shouldScroll = true;
      scrollDirection = 'right';
    }

    // Iniciar ou parar auto-scroll
    if (shouldScroll && scrollDirection && !isScrollingRef.current) {
      isScrollingRef.current = true;

      const scrollLoop = () => {
        if (!isActive || !isScrollingRef.current) return;

        scroll(scrollDirection);
        animationFrameRef.current = requestAnimationFrame(scrollLoop);
      };

      animationFrameRef.current = requestAnimationFrame(scrollLoop);

      console.log('[useAutoScroll] 🎯 Iniciando auto-scroll:', scrollDirection);
    } else if (!shouldScroll && isScrollingRef.current) {
      isScrollingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      console.log('[useAutoScroll] ⏹️ Parando auto-scroll');
    }
  }, [isActive, container, scrollThreshold, scroll]);

  // Configurar event listeners quando drag está ativo
  useEffect(() => {
    if (!isActive) {
      // Parar qualquer scroll ativo quando drag termina
      isScrollingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    // Adicionar listener de mouse move no documento
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);

      // Cleanup
      isScrollingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isActive, handleMouseMove]);

  return {
    isScrolling: isScrollingRef.current
  };
};