import { useRef, useState, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  /** Elemento de scroll de referência (id). Se não passado, usa o pai imediato. */
  scrollContainerId?: string;
  children: ReactNode;
}

const PULL_THRESHOLD = 70;
const MAX_PULL = 140;

/**
 * Pull-to-refresh nativo. Detecta toque no topo do scroll vertical e arrasta pra baixo.
 * Spring back com easing iOS. Spinner gira proporcional ao pull.
 */
export default function PullToRefresh({ onRefresh, scrollContainerId, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [animating, setAnimating] = useState(false);

  const startY = useRef(0);
  const startScroll = useRef(0);
  const swiping = useRef(false);
  const direction = useRef<'h' | 'v' | null>(null);
  const startX = useRef(0);

  useEffect(() => {
    const scrollEl = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : containerRef.current?.parentElement || null;
    if (!scrollEl) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      // Só ativa pull se já está no topo
      if (scrollEl.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      startScroll.current = scrollEl.scrollTop;
      swiping.current = true;
      direction.current = null;
      setAnimating(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swiping.current || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;

      if (!direction.current && Math.abs(dx) + Math.abs(dy) > 6) {
        direction.current = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
      }

      // Só registra pull se: scroll está no topo + arrastando pra baixo + direção vertical
      if (direction.current === 'v' && dy > 0 && scrollEl.scrollTop <= 0) {
        // Resistência: cresce desacelerando
        const pull = Math.min(MAX_PULL, dy * 0.55);
        setPullDistance(pull);
      } else if (dy < 0 || direction.current === 'h') {
        swiping.current = false;
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      swiping.current = false;
      const final = pullDistance;
      setAnimating(true);
      if (final >= PULL_THRESHOLD) {
        setPullDistance(PULL_THRESHOLD * 0.75);
        setRefreshing(true);
        try { await onRefresh(); } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      direction.current = null;
    };

    scrollEl.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollEl.addEventListener('touchmove', onTouchMove, { passive: true });
    scrollEl.addEventListener('touchend', onTouchEnd);
    scrollEl.addEventListener('touchcancel', onTouchEnd);

    return () => {
      scrollEl.removeEventListener('touchstart', onTouchStart);
      scrollEl.removeEventListener('touchmove', onTouchMove);
      scrollEl.removeEventListener('touchend', onTouchEnd);
      scrollEl.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [pullDistance, refreshing, onRefresh, scrollContainerId]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const opacity = Math.min(1, pullDistance / 30);
  const rotation = progress * 270 + (refreshing ? 0 : 0);

  return (
    <div ref={containerRef} className="relative" style={{ pointerEvents: 'none' }}>
      {/* Indicador no topo */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center z-10"
        style={{
          top: `${Math.max(0, pullDistance - 36)}px`,
          opacity,
          transition: animating ? 'top 0.3s var(--ease-ios), opacity 0.25s var(--ease-ios)' : 'none',
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: 'rgb(var(--surface-rgb) / 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
            style={{
              color: progress >= 1 ? 'rgb(var(--brand-primary-rgb))' : 'rgb(var(--muted-rgb))',
              transform: refreshing ? undefined : `rotate(${rotation}deg)`,
              transition: refreshing ? undefined : 'transform 0.05s linear, color 0.2s var(--ease-ios)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
