import { useRef, useState, useEffect, ReactNode } from 'react';

interface HeroCarouselProps {
  slides: Array<{ key: string; content: ReactNode }>;
}

/**
 * Carousel hero estilo iOS — CSS scroll-snap nativo + indicador de dots.
 * Swipe natural em mobile, scroll horizontal com mouse/trackpad no desktop.
 */
export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.offsetWidth;
      const idx = Math.round(el.scrollLeft / w);
      if (idx !== active) setActive(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [active]);

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
  };

  if (slides.length === 0) return null;
  if (slides.length === 1) return <>{slides[0].content}</>;

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {slides.map(s => (
          <div
            key={s.key}
            className="shrink-0 w-full snap-center snap-always"
            style={{ scrollSnapAlign: 'center' }}
          >
            {s.content}
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className="h-1.5 rounded-full active:scale-90"
            style={{
              width: i === active ? '20px' : '6px',
              background: i === active ? 'rgb(var(--brand-primary-rgb))' : 'var(--border2)',
              transition: 'width 0.32s var(--ease-ios), background 0.25s var(--ease-ios), transform 0.15s var(--ease-ios)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
