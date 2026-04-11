import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'ca', flag: '🏴', label: 'Català' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' },
];

export default function LanguageSelector({ variant = 'light' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === i18n.language.split('-')[0]) || LANGUAGES[0];

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isDark = variant === 'dark';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors w-full ${
          isDark
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <span aria-hidden="true">{current.flag}</span>
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className={`absolute ${isDark ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} left-0 right-0 rounded-xl shadow-lg overflow-hidden border z-50 ${
            isDark
              ? 'bg-gray-900 border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          {LANGUAGES.map(({ code, flag, label }) => (
            <button
              key={code}
              role="option"
              aria-selected={current.code === code}
              onClick={() => { i18n.changeLanguage(code); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                current.code === code
                  ? isDark ? 'bg-white/15 text-white' : 'bg-primary/8 text-primary'
                  : isDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span aria-hidden="true">{flag}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}