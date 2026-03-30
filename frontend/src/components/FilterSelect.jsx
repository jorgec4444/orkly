import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function FilterSelect({ options, value, onChange, placeholder = "All" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = options.find(o => o.value === value);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
      >
        {current?.emoji && <span>{current.emoji}</span>}
        <span>{current?.label || placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
          {options.map(({ value: val, label, emoji }) => (
            <button
              key={val}
              onClick={() => { onChange(val); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                value === val
                  ? 'bg-primary/8 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {emoji && <span>{emoji}</span>}
              <span className="flex-1 text-left">{label}</span>
              {value === val && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}