import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, FileSearch, Zap, Globe } from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface ExplanationData {
  intent: string;
  language_detected: string;
  memory_fields_used: string[];
  chunks_retrieved: Array<{ title: string; page: number; score: number; preview: string }>;
  eligibility_operators_fired: Array<{
    criterion: string;
    op: string;
    required_value: any;
    user_value: any;
    result: string;
  }>;
}

interface ExplainPanelProps {
  explanation: ExplanationData | null;
  language: SupportedLanguage;
}

const RESULT_COLOR: Record<string, string> = {
  met: 'text-emerald-700 bg-emerald-50',
  not_met: 'text-rose-700 bg-rose-50',
  missing: 'text-amber-700 bg-amber-50',
};

const RESULT_ICON: Record<string, string> = {
  met: '✅',
  not_met: '❌',
  missing: '❓',
};

export const ExplainPanel: React.FC<ExplainPanelProps> = ({ explanation, language }) => {
  const [open, setOpen] = useState(false);

  const t = {
    en: { toggle: 'Why this answer?', hide: 'Hide explanation', intent: 'Intent', memory: 'Memory used', sources: 'Sources retrieved', eligibility: 'Eligibility checks', noMemory: 'No memory fields used', noChunks: 'No chunks retrieved', noEligibility: 'No eligibility checks ran', langDetected: 'Language detected' },
    hi: { toggle: 'यह उत्तर क्यों?', hide: 'छुपाएं', intent: 'आशय', memory: 'उपयोग की गई मेमोरी', sources: 'स्रोत', eligibility: 'पात्रता जाँच', noMemory: 'कोई मेमोरी उपयोग नहीं', noChunks: 'कोई स्रोत नहीं मिला', noEligibility: 'कोई जाँच नहीं चली', langDetected: 'भाषा' },
    mr: { toggle: 'हे उत्तर का?', hide: 'लपवा', intent: 'हेतू', memory: 'वापरली मेमरी', sources: 'स्रोत', eligibility: 'पात्रता तपासणी', noMemory: 'मेमरी वापरली नाही', noChunks: 'स्रोत सापडला नाही', noEligibility: 'तपासणी नाही', langDetected: 'भाषा' },
  }[language];

  if (!explanation) return null;

  return (
    <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden text-xs">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600 font-medium"
      >
        <span className="flex items-center space-x-1.5">
          <Zap className="w-3 h-3 text-violet-500" />
          <span>{open ? t.hide : t.toggle}</span>
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-white">
          {/* Intent + Language row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
              <Globe className="w-3 h-3" />
              <span><span className="font-semibold">{t.intent}:</span> {explanation.intent}</span>
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
              <span><span className="font-semibold">{t.langDetected}:</span> {explanation.language_detected.toUpperCase()}</span>
            </div>
          </div>

          {/* Memory fields used */}
          <div>
            <div className="flex items-center space-x-1 font-semibold text-violet-700 mb-1.5">
              <Brain className="w-3 h-3" />
              <span>{t.memory}</span>
            </div>
            {explanation.memory_fields_used.length === 0 ? (
              <p className="text-slate-400">{t.noMemory}</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {explanation.memory_fields_used.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 font-medium">
                    🧠 {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chunks retrieved */}
          <div>
            <div className="flex items-center space-x-1 font-semibold text-slate-700 mb-1.5">
              <FileSearch className="w-3 h-3" />
              <span>{t.sources}</span>
            </div>
            {explanation.chunks_retrieved.length === 0 ? (
              <p className="text-slate-400">{t.noChunks}</p>
            ) : (
              <div className="space-y-1.5">
                {explanation.chunks_retrieved.map((c, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-slate-700">{c.title} {c.page > 0 ? `(p.${c.page})` : ''}</span>
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                        {Math.round(c.score * 100)}%
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed truncate">{c.preview}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eligibility operators */}
          {explanation.eligibility_operators_fired.length > 0 && (
            <div>
              <div className="flex items-center space-x-1 font-semibold text-slate-700 mb-1.5">
                <Zap className="w-3 h-3" />
                <span>{t.eligibility}</span>
              </div>
              <div className="space-y-1">
                {explanation.eligibility_operators_fired.map((op, i) => (
                  <div key={i} className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${RESULT_COLOR[op.result] || 'bg-slate-50 text-slate-600'}`}>
                    <span>{RESULT_ICON[op.result] || '•'} {op.criterion}</span>
                    <span className="font-mono text-[10px]">
                      {op.op} {String(op.required_value)} (you: {String(op.user_value)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
