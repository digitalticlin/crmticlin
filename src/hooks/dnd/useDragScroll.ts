/**
 * 🎯 DRAG-TO-SCROLL HOOK
 *
 * Permite ao usuário fazer scroll horizontal segurando
 * clique e arrastando com o mouse (como no Figma).
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseDragScrollOptions {
  container?: HTMLElement | null;
  enabled?: boolean;
  sensitivity?: number; // Sensibilidade do scroll (1-5)
}

export const useDragScroll = ({
  container,
  enabled = true,
  sensitivity = 2
}: UseDragScrollOptions) => {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    // Só ativar em elementos sem data-no-drag ou se não for um input/button
    const target = event.target as HTMLElement;

    // Verificar se é um elemento que não deve ativar drag-scroll
    if (
      target.hasAttribute('data-no-drag') ||
      target.closest('[data-no-drag]') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('[role="button"]') ||
      target.closest('.lead-card') || // Não ativar em cards de leads
      !container ||
      !enabled
    ) {
      return;
    }

    // Prevenir seleção de texto durante o drag
    event.preventDefault();

    isDraggingRef.current = true;
    startXRef.current = event.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;

    // Cursor de drag
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';

    console.log('[useDragScroll] 🎯 Iniciando drag-scroll');
  }, [container, enabled]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingRef.current || !container) return;

    event.preventDefault();

    const x = event.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * sensitivity;

    container.scrollLeft = scrollLeftRef.current - walk;
  }, [container, sensitivity]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current || !container) return;

    isDraggingRef.current = false;

    // Restaurar cursor
    container.style.cursor = '';
    container.style.userSelect = '';

    console.log('[useDragScroll] ✋ Finalizando drag-scroll');
  }, [container]);

  const handleMouseLeave = useCallback(() => {
    if (!isDraggingRef.current || !container) return;

    isDraggingRef.current = false;

    // Restaurar cursor
    container.style.cursor = '';
    container.style.userSelect = '';

    console.log('[useDragScroll] 🚪 Saindo da área - finalizando drag-scroll');
  }, [container]);

  // Configurar event listeners
  useEffect(() => {
    if (!container || !enabled) return;

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [container, enabled, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  return {
    isDragging: isDraggingRef.current
  };
};