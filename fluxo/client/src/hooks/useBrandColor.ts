import { useState, useEffect } from 'react';

function readBrandColor(): string {
  return getComputedStyle(document.body).getPropertyValue('--brand-primary').trim() || '#a78bfa';
}

export function useBrandColor(): string {
  const [color, setColor] = useState<string>(readBrandColor);

  useEffect(() => {
    setColor(readBrandColor());

    const observer = new MutationObserver(() => setColor(readBrandColor()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return color;
}
