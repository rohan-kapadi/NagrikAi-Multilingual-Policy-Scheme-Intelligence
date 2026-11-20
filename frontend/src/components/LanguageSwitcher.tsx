import React from 'react';
import { Globe2 } from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface LanguageSwitcherProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
      <Globe2 className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => onLanguageChange(l.code)}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            currentLanguage === l.code
              ? 'bg-white text-emerald-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
