import { useCategorias } from '@/hooks/useCategorias';

interface CategoriaSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CategoriaSelect({ value, onChange, className = '' }: CategoriaSelectProps) {
  const { all } = useCategorias();

  return (
    <select
      className={`input-dark ${className}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {all.map(c => (
        <option key={c.value} value={c.value}>
          {c.icone} {c.label}
        </option>
      ))}
    </select>
  );
}
