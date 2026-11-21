import React from 'react';
import { Bot, User, HelpCircle, Brain } from 'lucide-react';
import type { ChatMessage } from '../types';
import { SchemeCard } from './SchemeCard';
import { CitationList } from './CitationList';
import { ListenButton } from './ListenButton';
import { ExplainPanel } from './ExplainPanel';

const CLARIFY_HEADER: Record<string, string> = {
  en: 'Missing Profile Information',
  hi: 'अतिरिक्त जानकारी आवश्यक है',
  mr: 'अधिक माहिती आवश्यक आहे',
};

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const lang = message.language || 'en';
  const usedMemory = message.usedMemory ||
    (message.explanation && message.explanation.memory_fields_used.length > 0);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-3`}>
      <div className={`flex max-w-2xl gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold shadow-xs ${
            isUser ? 'bg-slate-700' : 'bg-emerald-600'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Bubble body */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-emerald-600 text-white rounded-tr-xs'
              : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-xs'
          }`}
        >
          {/* Memory indicator badge */}
          {!isUser && usedMemory && (
            <div className="flex items-center space-x-1 mb-2">
              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-full">
                <Brain className="w-2.5 h-2.5" />
                <span>Using your memory</span>
              </span>
            </div>
          )}

          {/* Main message text */}
          <div className="whitespace-pre-wrap">{message.text}</div>

          {/* Clarifying question callout */}
          {message.clarifying_question && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">
                  {CLARIFY_HEADER[lang] || CLARIFY_HEADER['en']}
                </p>
                <p>{message.clarifying_question}</p>
              </div>
            </div>
          )}

          {/* Matched Scheme Cards */}
          {message.schemes && message.schemes.length > 0 && (
            <div className="mt-4 space-y-2">
              {message.schemes.map((s) => {
                const elig = message.eligibility?.find((e) => e.scheme_id === s.id);
                return (
                  <SchemeCard
                    key={s.id}
                    scheme={s}
                    eligibility={elig}
                    language={lang}
                  />
                );
              })}
            </div>
          )}

          {/* Attached Citations */}
          {message.citations && message.citations.length > 0 && (
            <CitationList citations={message.citations} language={lang} />
          )}

          {/* Explainability panel (Phase 11) */}
          {!isUser && message.explanation && (
            <ExplainPanel explanation={message.explanation} language={lang as any} />
          )}

          {/* Bubble footer with timestamp and Listen button */}
          <div
            className={`flex items-center justify-between text-[10px] mt-2 pt-1 border-t ${
              isUser ? 'border-emerald-500/30 text-emerald-100 justify-end' : 'border-slate-100 text-slate-400'
            }`}
          >
            {!isUser && <ListenButton text={message.text} language={lang} />}
            <span>{message.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
