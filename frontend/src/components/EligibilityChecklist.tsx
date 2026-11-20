import React from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { CriterionResult } from '../types';

interface EligibilityChecklistProps {
  criteria: CriterionResult[];
  overall: 'eligible' | 'likely_eligible' | 'not_eligible' | 'need_more_info';
  language?: string;
}

export const EligibilityChecklist: React.FC<EligibilityChecklistProps> = ({
  criteria,
  overall,
  language = 'en',
}) => {
  const t = {
    en: {
      title: 'Eligibility Criteria Evaluation',
      eligible: 'Eligible',
      not_eligible: 'Not Eligible',
      need_more_info: 'Needs More Information',
      likely_eligible: 'Likely Eligible',
      required: 'Required:',
      yourValue: 'Your input:',
    },
    hi: {
      title: 'पात्रता मानदंड समीक्षा',
      eligible: 'पात्र हैं (Eligible)',
      not_eligible: 'पात्र नहीं हैं (Not Eligible)',
      need_more_info: 'अधिक जानकारी चाहिए',
      likely_eligible: 'संभावित पात्र',
      required: 'आवश्यकता:',
      yourValue: 'आपका विवरण:',
    },
    mr: {
      title: 'पात्रता निकष पडताळणी',
      eligible: 'पात्र आहात (Eligible)',
      not_eligible: 'पात्र नाही (Not Eligible)',
      need_more_info: 'अधिक माहिती हवी आहे',
      likely_eligible: 'संभाव्य पात्र',
      required: 'आवश्यक:',
      yourValue: 'आपला तपशील:',
    },
  }[language] || {
    title: 'Eligibility Criteria Evaluation',
    eligible: 'Eligible',
    not_eligible: 'Not Eligible',
    need_more_info: 'Needs More Information',
    likely_eligible: 'Likely Eligible',
    required: 'Required:',
    yourValue: 'Your input:',
  };

  const getBadgeStyle = () => {
    switch (overall) {
      case 'eligible':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'not_eligible':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs mt-3">
      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
        <span className="font-semibold text-slate-800">{t.title}</span>
        <span className={`px-2.5 py-0.5 rounded-full font-medium border text-[11px] ${getBadgeStyle()}`}>
          {overall === 'eligible'
            ? t.eligible
            : overall === 'not_eligible'
            ? t.not_eligible
            : t.need_more_info}
        </span>
      </div>

      <div className="space-y-2">
        {criteria.map((c) => (
          <div key={c.criterion_id} className="flex items-start space-x-2 py-1">
            {c.status === 'met' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {c.status === 'not_met' && <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {c.status === 'missing' && <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}

            <div className="flex-1">
              <p className={`font-medium ${c.status === 'not_met' ? 'text-rose-900' : 'text-slate-800'}`}>
                {c.label}
              </p>
              <p className="text-[11px] text-slate-500">
                <span className="font-mono text-slate-600">{t.required} {c.required}</span>
                {c.user_value !== null && c.user_value !== undefined && (
                  <span className="ml-2 text-slate-600">({t.yourValue} {String(c.user_value)})</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
