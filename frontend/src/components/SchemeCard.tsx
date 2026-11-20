import React from 'react';
import { ExternalLink, ShieldAlert, FileCheck } from 'lucide-react';
import type { ChatSchemeItem, EligibilityResult } from '../types';
import { EligibilityChecklist } from './EligibilityChecklist';

interface SchemeCardProps {
  scheme: ChatSchemeItem;
  eligibility?: EligibilityResult;
  language?: string;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, eligibility, language = 'en' }) => {
  const t = {
    en: {
      applyOfficial: 'Apply on Official Portal',
      requiredDocs: 'Required Documents:',
      unverified: 'Unverified Data (TODO_VERIFY)',
    },
    hi: {
      applyOfficial: 'आधिकारिक पोर्टल पर आवेदन करें',
      requiredDocs: 'आवश्यक दस्तावेज:',
      unverified: 'अपुष्ट डेटा (Unverified Data)',
    },
    mr: {
      applyOfficial: 'अधिकृत पोर्टलवर अर्ज करा',
      requiredDocs: 'आवश्यक कागदपत्रे:',
      unverified: 'अपुष्ट डेटा (Unverified Data)',
    },
  }[language] || {
    applyOfficial: 'Apply on Official Portal',
    requiredDocs: 'Required Documents:',
    unverified: 'Unverified Data (TODO_VERIFY)',
  };

  const officialUrl =
    scheme.id === 'pm-kisan'
      ? 'https://pmkisan.gov.in'
      : scheme.id === 'post-matric-scholarship'
      ? 'https://scholarships.gov.in'
      : 'https://india.gov.in';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition-all mb-3 text-left">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-bold text-slate-800 text-sm leading-tight">{scheme.name}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{scheme.why_relevant}</p>
        </div>
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          <span>{t.unverified}</span>
        </span>
      </div>

      {/* Render deterministic criteria checklist if present */}
      {eligibility && (
        <EligibilityChecklist
          criteria={eligibility.criteria_results}
          overall={eligibility.overall}
          language={language}
        />
      )}

      {/* Required documents preview */}
      {eligibility && eligibility.required_documents.length > 0 && (
        <div className="mt-3 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-xs">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-900 mb-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.requiredDocs}</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
            {eligibility.required_documents.map((doc, idx) => (
              <li key={idx}>{doc}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Apply link button */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-xs"
        >
          <span>{t.applyOfficial}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
