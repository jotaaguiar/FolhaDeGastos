import { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export default function TagInput({ tags, onChange, suggestions = [], placeholder = 'Adicionar tag...' }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s));

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div
        className="input-dark flex flex-wrap gap-1.5 min-h-[38px] cursor-text py-1.5"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-brand-primary/15 text-brand-primary text-xs px-2 py-0.5 rounded-full">
            #{tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="hover:text-white">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="bg-transparent outline-none text-xs flex-1 min-w-[80px] placeholder:text-muted"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/[0.07] rounded-lg shadow-xl z-10 overflow-hidden">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 text-muted hover:text-white"
              onMouseDown={() => addTag(s)}
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
