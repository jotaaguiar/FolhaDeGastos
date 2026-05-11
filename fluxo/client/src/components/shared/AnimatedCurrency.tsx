import { useCountUp } from '@/hooks/useCountUp';
import { formatCurrency } from '@/lib/formatters';

interface AnimatedCurrencyProps {
  value: number;
  className?: string;
  duration?: number;
}

export default function AnimatedCurrency({ value, className, duration = 500 }: AnimatedCurrencyProps) {
  const animated = useCountUp(value, duration);
  return <span className={className}>{formatCurrency(animated)}</span>;
}
