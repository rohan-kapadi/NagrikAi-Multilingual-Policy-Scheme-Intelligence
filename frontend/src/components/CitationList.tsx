import React from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import type { Citation } from '../types';

interface CitationListProps {
  citations: Citation[];
  language?: string;
}

export const CitationList: React.FC<CitationListProps> = ({ citations, language = 'en' }) => {
  if (!citations || citations.length === 0) return null;

  const header = {
    en: 'Official Source Citations',
    hi: 'आधिकारिक स्रोत संदर्भ',
    mr: 'अधिकृत स्रोत संदर्भ',
  }[language] || 'Official Source Citations';

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
        <span>{header}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs transition-colors"
          >
            <span className="font-medium truncate max-w-xs">{c.title}</span>
            {c.section && <span className="text-[10px] text-emerald-600">({c.section})</span>}
            <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};
