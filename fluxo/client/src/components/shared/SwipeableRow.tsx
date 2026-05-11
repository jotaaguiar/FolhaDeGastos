import { useRef, useState, useEffect } from 'react';
import type { ReactNode, TouchEvent } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: ReactNode;
  onDelete?: () => void;
  disabled?: boolean;
  /** Classe extra aplicada ao container externo (para herdar bordas/spacing) */
  className?: string;
}

const REVEAL_WIDTH = 76;
const TRIGGER_REVEAL = 36;
const AUTO_DELETE = 140;
const MAX_PULL = 200;

export default function SwipeableRow({ children, onDelete, disabled, className = '' }: SwipeableRowProps) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const baseOffset = useRef(0);
  const direction = useRef<'h' | 'v' | null>(null);
  const swiping = useRef(false);

  // Fechar revelação ao tocar fora
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (offset === 0) return;
    const onDocTouch = (e: globalThis.TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAnimating(true);
        setOffset(0);
      }
    };
    document.addEventListener('touchstart', onDocTouch);
    return () => document.removeEventListener('touchstart', onDocTouch);
  }, [offset]);

  if (disabled || !onDelete) {
    return <>{children}</>;
  }

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    baseOffset.current = offset;
    direction.current = null;
    swiping.current = true;
    setAnimating(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!swiping.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!direction.current && Math.abs(dx) + Math.abs(dy) > 6) {
      direction.current = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v';
    }

    if (direction.current === 'h') {
      const raw = baseOffset.current + dx;
      // Resistência ao puxar pra direita do zero
      const clamped = raw > 0 ? raw * 0.2 : Math.max(raw, -MAX_PULL);
      setOffset(clamped);
    }
  };

  const handleTouchEnd = () => {
    swiping.current = false;
    if (direction.current === 'h') {
      setAnimating(true);
      if (offset <= -AUTO_DELETE) {
        // Auto-delete: chama handler (que pode pedir confirm) e volta ao estado neutro
        setOffset(0);
        onDelete?.();
      } else if (offset <= -TRIGGER_REVEAL) {
        setOffset(-REVEAL_WIDTH);
      } else {
        setOffset(0);
      }
    }
    direction.current = null;
  };

  const close = () => { setAnimating(true); setOffset(0); };

  const triggerDelete = () => {
    setAnimating(true);
    setOffset(0);
    onDelete?.();
  };

  const intensity = Math.min(1, Math.abs(offset) / AUTO_DELETE);

  return (
    <div ref={rootRef} className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Fundo de delete */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-end rounded-lg"
        style={{
          background: `rgb(var(--red-rgb) / ${0.85 + 0.15 * intensity})`,
        }}
      >
        <button
          type="button"
          onClick={triggerDelete}
          aria-label="Excluir"
          className="h-full flex items-center justify-center text-white active:scale-90"
          style={{
            width: `${REVEAL_WIDTH}px`,
            transition: 'transform 0.15s var(--ease-ios)',
          }}
        >
          <Trash2
            size={20}
            strokeWidth={2.2}
            style={{
              transform: `scale(${1 + intensity * 0.25})`,
              transition: 'transform 0.12s var(--ease-ios)',
            }}
          />
        </button>
      </div>

      {/* Conteúdo deslizante */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClickCapture={(e) => {
          // Se está revelado, qualquer clique fecha em vez de propagar
          if (offset !== 0) {
            e.stopPropagation();
            close();
          }
        }}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 0.32s var(--ease-ios)' : 'none',
          touchAction: 'pan-y',
          background: 'rgb(var(--surface-rgb))',
          willChange: 'transform',
        }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}
