import React, { useEffect, useState } from 'react';
import { Brain, X, Trash2, Edit3, Check } from 'lucide-react';
import {
  fetchMemory, deleteMemoryEntry, updateMemoryEntry, clearAllMemory,
  type MemoryEntry,
} from '../lib/auth';
import type { SupportedLanguage } from '../types';

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  isLoggedIn: boolean;
}

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  chat: { label: 'From Chat', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  manual: { label: 'Manual', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  vault: { label: 'From Vault', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ isOpen, onClose, language, isLoggedIn }) => {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const t = {
    en: {
      title: 'Your Memory',
      subtitle: 'NagrikAI remembers this about you across sessions. You control every entry.',
      empty: 'No memories stored yet. Chat with NagrikAI and approve the memory proposals to build your profile.',
      clearAll: 'Clear All Memory',
      confirmClear: 'Are you sure? This cannot be undone.',
      yes: 'Yes, Clear',
      cancel: 'Cancel',
      loginRequired: 'Log in to use Negotiated Memory — your profile is remembered across sessions.',
      lastUpdated: 'Updated',
      save: 'Save',
      memoryInfo: 'Memory is used to give you better, personalised answers without asking the same questions again.',
    },
    hi: {
      title: 'आपकी मेमोरी',
      subtitle: 'नागरिक AI यह जानकारी सत्रों के बीच याद रखता है। आप हर एंट्री नियंत्रित करते हैं।',
      empty: 'अभी कोई मेमोरी नहीं है। नागरिक AI से चैट करें और मेमोरी प्रस्ताव स्वीकार करें।',
      clearAll: 'सारी मेमोरी साफ़ करें',
      confirmClear: 'क्या आप सुनिश्चित हैं? यह पूर्ववत नहीं किया जा सकता।',
      yes: 'हाँ, साफ़ करें',
      cancel: 'रद्द करें',
      loginRequired: 'मेमोरी उपयोग करने के लिए लॉग इन करें।',
      lastUpdated: 'अपडेट हुआ',
      save: 'सहेजें',
      memoryInfo: 'मेमोरी आपको बार-बार एक ही सवाल पूछे बिना बेहतर जवाब देने के लिए उपयोग होती है।',
    },
    mr: {
      title: 'आपली मेमरी',
      subtitle: 'नागरिक AI ही माहिती सत्रांमध्ये लक्षात ठेवतो. प्रत्येक नोंद आपल्या नियंत्रणात आहे.',
      empty: 'अद्याप कोणतीही मेमरी नाही. नागरिक AI शी चॅट करा आणि प्रस्ताव मंजूर करा.',
      clearAll: 'सर्व मेमरी साफ करा',
      confirmClear: 'खात्री आहे का? हे पूर्ववत करता येणार नाही.',
      yes: 'होय, साफ करा',
      cancel: 'रद्द करा',
      loginRequired: 'मेमरी वापरण्यासाठी लॉग इन करा.',
      lastUpdated: 'अपडेट केले',
      save: 'जतन करा',
      memoryInfo: 'मेमरी आपल्याला वारंवार तेच प्रश्न न विचारता चांगली उत्तरे देण्यासाठी वापरली जाते.',
    },
  }[language];

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setLoading(true);
      fetchMemory()
        .then(setEntries)
        .finally(() => setLoading(false));
    }
  }, [isOpen, isLoggedIn]);

  const handleDelete = async (id: string) => {
    await deleteMemoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEdit = async (id: string) => {
    const updated = await updateMemoryEntry(id, editValue);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    setEditingId(null);
  };

  const handleClearAll = async () => {
    await clearAllMemory();
    setEntries([]);
    setConfirmClear(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-30 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
              <p className="text-[10px] text-slate-500">NagrikAI Negotiated Memory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 pb-16">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Brain className="w-7 h-7 text-violet-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">{t.loginRequired}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 pb-16">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Brain className="w-7 h-7 text-violet-500" />
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{t.empty}</p>
            </div>
          ) : (
            entries.map((entry) => {
              const badge = SOURCE_BADGE[entry.source] || SOURCE_BADGE.manual;
              const isEditing = editingId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-violet-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{entry.label}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      {isEditing ? (
                        <div className="mt-1.5 flex items-center space-x-1">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 text-xs border border-violet-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => handleEdit(entry.id)}
                            className="p-1 bg-violet-600 text-white rounded-lg"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-violet-700 mt-0.5">{entry.value}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t.lastUpdated}: {new Date(entry.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => { setEditingId(entry.id); setEditValue(entry.value); }}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-200 px-4 py-3 space-y-2">
          <p className="text-[10px] text-slate-500 leading-relaxed">{t.memoryInfo}</p>
          {isLoggedIn && entries.length > 0 && (
            <>
              {confirmClear ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-rose-600 font-medium flex-1">{t.confirmClear}</span>
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg"
                  >
                    {t.yes}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-2 py-1 rounded-lg"
                  >
                    {t.cancel}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full text-xs font-semibold text-rose-600 hover:text-rose-700 py-1.5 border border-rose-200 hover:border-rose-300 rounded-xl transition-colors"
                >
                  {t.clearAll}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
