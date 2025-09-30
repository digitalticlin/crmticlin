
/**
 * 🎯 HOOK DE SCROLL DETECTION SEM CONFLITOS
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Removido scroll automático conflitante
 * ✅ Foco apenas na detecção e paginação
 * ✅ Throttling otimizado para performance
 * ✅ Preservação de posição após carregar mais
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseScrollDetectionProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onLoadMore?: () => Promise<void>;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
}

export const useScrollDetection = ({
  containerRef,
  onLoadMore,
  hasMoreMessages = false,
  isLoadingMore = false
}: UseScrollDetectionProps) => {
  const [isNearTop, setIsNearTop] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastScrollTop = useRef<number>(0);
  const isLoadingRef = useRef(false);
  const hasUserScrolled = useRef(false); // ✅ NOVO: Rastrear se usuário já scrollou
  const initialCheckDone = useRef(false); // ✅ NOVO: Rastrear primeira verificação

  // 🚀 CORREÇÃO: Função apenas para detectar posição (sem scroll automático)
  const detectScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop <= 150;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 150;

    // ✅ CORREÇÃO: Detectar se usuário fez scroll manual (não automático)
    if (Math.abs(scrollTop - lastScrollTop.current) > 10) {
      hasUserScrolled.current = true;
    }

    lastScrollTop.current = scrollTop;
    setIsNearTop(isAtTop);
    setIsNearBottom(isAtBottom);

    // ✅ CORREÇÃO CRÍTICA: Apenas disparar loadMore se:
    // 1. Usuário já scrollou manualmente OU
    // 2. Primeira verificação já passou (evita disparo no mount)
    const shouldLoadMore =
      isAtTop &&
      hasMoreMessages &&
      !isLoadingMore &&
      !isLoadingRef.current &&
      onLoadMore &&
      (hasUserScrolled.current || initialCheckDone.current); // ✅ NOVO: Verificação adicional

    if (shouldLoadMore) {
      console.log('[useScrollDetection] 📄 Carregando mais mensagens (scroll manual detectado)');

      isLoadingRef.current = true;

      // ✅ CORREÇÃO: Salvar ELEMENTO âncora, não apenas altura
      const currentScrollHeight = scrollHeight;
      const currentScrollTop = scrollTop;

      // ✅ CRÍTICO: Encontrar PRIMEIRO ELEMENTO VISÍVEL na viewport
      let firstVisibleElement: HTMLElement | null = null;
      const allMessages = container.querySelectorAll('[data-message-id]');

      for (let i = 0; i < allMessages.length; i++) {
        const element = allMessages[i] as HTMLElement;
        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.offsetHeight;

        // Elemento está visível se está dentro da viewport do container
        if (elementBottom >= scrollTop && elementTop <= scrollTop + clientHeight) {
          firstVisibleElement = element;
          console.log('[useScrollDetection] 🎯 Elemento visível encontrado:', {
            messageId: element.dataset.messageId,
            elementTop,
            scrollTop,
            index: i
          });
          break; // Pegar o PRIMEIRO visível
        }
      }

      const anchorOffset = firstVisibleElement
        ? firstVisibleElement.offsetTop - scrollTop
        : 0;

      console.log('[useScrollDetection] 🔒 Salvando âncora:', {
        currentScrollTop,
        currentScrollHeight,
        anchorElement: firstVisibleElement?.dataset?.messageId,
        anchorOffset,
        totalMessages: allMessages.length
      });

      onLoadMore().then(() => {
        // ✅ CORREÇÃO: Usar requestAnimationFrame + múltiplos frames
        // Aguardar React terminar render + DOM atualizar
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (container) {
                const newScrollHeight = container.scrollHeight;
                const addedHeight = newScrollHeight - currentScrollHeight;

                console.log('[useScrollDetection] 📊 Calculando nova posição:', {
                  oldHeight: currentScrollHeight,
                  newHeight: newScrollHeight,
                  addedHeight,
                  oldScrollTop: currentScrollTop
                });

                // ✅ CORREÇÃO: Tentar usar âncora primeiro
                if (firstVisibleElement && addedHeight > 0) {
                  // ✅ CRÍTICO: Re-encontrar elemento pela ID (pode ter mudado de posição)
                  const anchorId = firstVisibleElement.dataset.messageId;
                  const anchorAfterLoad = container.querySelector(`[data-message-id="${anchorId}"]`) as HTMLElement;

                  if (anchorAfterLoad) {
                    const newAnchorTop = anchorAfterLoad.offsetTop;
                    const newPosition = newAnchorTop - anchorOffset;

                    console.log('[useScrollDetection] ⚓ Restaurando via âncora (elemento re-encontrado):', {
                      anchorId,
                      newAnchorTop,
                      anchorOffset,
                      newPosition
                    });

                    container.scrollTop = Math.max(0, newPosition);
                  } else {
                    // Fallback 1: Usar referência antiga (pode não funcionar se reordenou)
                    const newAnchorTop = firstVisibleElement.offsetTop;
                    const newPosition = newAnchorTop - anchorOffset;

                    console.log('[useScrollDetection] ⚓ Restaurando via âncora (referência antiga):', {
                      newAnchorTop,
                      anchorOffset,
                      newPosition
                    });

                    container.scrollTop = Math.max(0, newPosition);
                  }
                } else {
                  // Fallback 2: método de altura (se âncora não funcionar)
                  const newPosition = currentScrollTop + addedHeight;

                  console.log('[useScrollDetection] 📏 Restaurando via altura:', {
                    newPosition,
                    currentScrollTop,
                    addedHeight
                  });

                  container.scrollTop = Math.max(0, newPosition);
                }

                console.log('[useScrollDetection] ✅ Posição restaurada:', {
                  finalScrollTop: container.scrollTop
                });
              }
              isLoadingRef.current = false;
            }, 50); // Delay adicional após frames
          });
        });
      }).catch(() => {
        isLoadingRef.current = false;
      });
    }

    // ✅ NOVO: Marcar primeira verificação como concluída
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
    }
  }, [onLoadMore, hasMoreMessages, isLoadingMore]);

  // 🚀 CORREÇÃO: Throttled scroll handler otimizado
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimer: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      scrollTimer = setTimeout(() => {
        detectScrollPosition();
      }, 16); // ~60fps throttling
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Detectar posição inicial
    detectScrollPosition();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [detectScrollPosition]);

  return { 
    isNearTop, 
    isNearBottom
  };
};
