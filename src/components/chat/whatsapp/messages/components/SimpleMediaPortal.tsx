import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface SimpleMediaPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showZoomControls?: boolean;
  showDownloadButton?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onDownload?: () => void;
  zoom?: number;
}

export const SimpleMediaPortal: React.FC<SimpleMediaPortalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showZoomControls = true,
  showDownloadButton = false,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDownload,
  zoom = 1
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  // ✅ CONTROLE DE ANIMAÇÃO
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Pequeno delay para garantir que o DOM está pronto
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Aguardar animação terminar antes de remover do DOM
      setTimeout(() => setShouldRender(false), 200);
    }
  }, [isOpen]);

  // ✅ KEYBOARD NAVIGATION
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          if (showZoomControls && onZoomIn) {
            e.preventDefault();
            onZoomIn();
          }
          break;
        case '-':
          if (showZoomControls && onZoomOut) {
            e.preventDefault();
            onZoomOut();
          }
          break;
        case '0':
          if (showZoomControls && onZoomReset) {
            e.preventDefault();
            onZoomReset();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, showZoomControls, onZoomIn, onZoomOut, onZoomReset]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Visualização de mídia"}
    >
      {/* Background */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-80"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      />

      {/* Content Container */}
      <div 
        className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content */}
        <div className={`relative w-full h-full max-w-full max-h-full overflow-auto bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 transition-transform duration-300 ${
          isAnimating ? 'transform scale-100' : 'transform scale-95'
        }`}>
          {children}
        </div>

        {/* Controls */}
        <div className={`absolute top-4 right-4 flex items-center gap-2 transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          {/* Zoom Controls */}
          {showZoomControls && (
            <>
              <button
                onClick={onZoomOut}
                disabled={zoom <= 0.5}
                className="px-3 py-2 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-40"
                aria-label="Reduzir zoom"
                title="Reduzir zoom (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <button
                onClick={onZoomIn}
                disabled={zoom >= 4}
                className="px-3 py-2 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-40"
                aria-label="Aumentar zoom"
                title="Aumentar zoom (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <button
                onClick={onZoomReset}
                className="px-3 py-2 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                aria-label="Redefinir zoom"
                title="Redefinir zoom (0)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              {/* Zoom Indicator */}
              <span className="px-3 py-2 rounded-xl bg-black bg-opacity-50 text-white text-sm font-mono border border-white border-opacity-30">
                {Math.round(zoom * 100)}%
              </span>
            </>
          )}
          
          {/* Download Button */}
          {showDownloadButton && onDownload && (
            <button
              onClick={onDownload}
              className="px-3 py-2 rounded-xl bg-blue-500 bg-opacity-80 hover:bg-blue-500 text-white border border-blue-400 border-opacity-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
              aria-label="Baixar arquivo"
              title="Baixar arquivo"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-red-500 bg-opacity-80 hover:bg-red-500 text-white border border-red-400 border-opacity-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
            aria-label="Fechar"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ✅ RENDERIZAR DIRETO NO BODY (SEM PORTAL COMPLEXO)
  return createPortal(modalContent, document.body);
};

SimpleMediaPortal.displayName = 'SimpleMediaPortal';