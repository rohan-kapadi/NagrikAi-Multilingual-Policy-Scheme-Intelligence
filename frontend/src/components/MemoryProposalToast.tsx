import React, { useState } from 'react';
import { Brain, Check, X, Edit3 } from 'lucide-react';
import { addMemoryEntry } from '../lib/auth';
import type { SupportedLanguage } from '../types';

interface MemoryProposal {
  key: string;
  proposed_value: any;
  current_value: any;
  change_type: 'new' | 'update';
  reason: string;
}

interface MemoryProposalToastProps {
  proposals: MemoryProposal[];
  language: SupportedLanguage;
  onDismissAll: () => void;
  onProposalHandled: (key: string) => void;
}

export const MemoryProposalToast: React.FC<MemoryProposalToastProps> = ({
  proposals,
  language,
  onDismissAll,
  onProposalHandled,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const t = {
    en: { wants: 'wants to remember', save: 'Save', dismiss: 'Dismiss', edit: 'Edit', dismissAll: 'Dismiss All', update: 'Update', new: 'New' },
    hi: { wants: 'याद रखना चाहता है', save: 'सहेजें', dismiss: 'अनदेखा करें', edit: 'बदलें', dismissAll: 'सभी अनदेखा करें', update: 'अपडेट', new: 'नया' },
    mr: { wants: 'लक्षात ठेवू इच्छितो', save: 'जतन करा', dismiss: 'नाकारा', edit: 'बदला', dismissAll: 'सर्व नाकारा', update: 'अपडेट', new: 'नवीन' },
  }[language];

  if (proposals.length === 0) return null;

  const handleSave = async (proposal: MemoryProposal) => {
    setSavingKey(proposal.key);
    try {
      const val = editValues[proposal.key] ?? String(proposal.proposed_value);
      await addMemoryEntry(proposal.key, val, 'chat');
      onProposalHandled(proposal.key);
    } catch {
      // Silently fail — user can retry from memory panel
    } finally {
      setSavingKey(null);
      setEditingKey(null);
    }
  };

  const displayValue = (key: string, val: any) => {
    return editValues[key] !== undefined ? editValues[key] : String(val);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-3">
      <div className="bg-white border border-violet-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Toast header */}
        <div className="flex items-center justify-between px-3 py-2 bg-violet-50 border-b border-violet-100">
          <div className="flex items-center space-x-1.5">
            <Brain className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-bold text-violet-800">NagrikAI {t.wants}:</span>
          </div>
          <button
            onClick={onDismissAll}
            className="text-[10px] text-slate-500 hover:text-slate-700 font-medium"
          >
            {t.dismissAll}
          </button>
        </div>

        {/* Proposal list (max 3) */}
        <div className="divide-y divide-slate-100">
          {proposals.slice(0, 3).map((proposal) => {
            const isEditing = editingKey === proposal.key;
            const isSaving = savingKey === proposal.key;
            const badge = proposal.change_type === 'new' ? t.new : t.update;
            const badgeColor = proposal.change_type === 'new'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700';

            return (
              <div key={proposal.key} className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                        {badge}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {proposal.key.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {isEditing ? (
                      <input
                        value={displayValue(proposal.key, proposal.proposed_value)}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, [proposal.key]: e.target.value }))}
                        className="mt-1 w-full text-xs border border-violet-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    ) : (
                      <p className="text-xs text-violet-700 font-bold mt-0.5">
                        {String(proposal.proposed_value)}
                        {proposal.current_value != null && (
                          <span className="text-slate-400 font-normal ml-1">
                            (was: {String(proposal.current_value)})
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{proposal.reason}</p>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => {
                        if (isEditing) setEditingKey(null);
                        else { setEditingKey(proposal.key); setEditValues((p) => ({ ...p, [proposal.key]: String(proposal.proposed_value) })); }
                      }}
                      className="p-1 text-slate-400 hover:text-violet-600 rounded-lg"
                      title={t.edit}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onProposalHandled(proposal.key)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      title={t.dismiss}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSave(proposal)}
                      disabled={isSaving}
                      className="flex items-center space-x-0.5 px-2 py-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-[10px] font-bold rounded-lg transition-colors"
                      title={t.save}
                    >
                      {isSaving ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>{t.save}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {proposals.length > 3 && (
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-500 text-center">
            +{proposals.length - 3} more proposals
          </div>
        )}
      </div>
    </div>
  );
};
