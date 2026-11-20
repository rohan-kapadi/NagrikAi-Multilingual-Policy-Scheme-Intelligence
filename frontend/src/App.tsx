import { useState, useEffect } from 'react';
import { checkHealth } from './lib/api';
import type { HealthStatus } from './lib/api';
import { ShieldCheck, AlertCircle, CheckCircle2, MessageSquare, Globe2, Sparkles } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');

  const t = {
    en: {
      title: 'NagrikAI',
      subtitle: 'Your guide to government schemes & welfare programs',
      connected: 'Backend connected',
      disconnected: 'Backend unreachable',
      phaseDone: 'Phases 0–3 complete — ready for chat pipeline',
      readyMsg: 'FastAPI + ChromaDB backend, multilingual profile extractor, and eligibility engine are live.',
      apiDocs: 'Swagger API Docs',
      nextPhase: 'Next: Phase 4 — Chat pipeline & orchestrator',
      disclaimer: 'NagrikAI is an informational tool. Eligibility decisions are made solely by official government portals and competent authorities.'
    },
    hi: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजनाओं और कल्याण कार्यक्रमों का आपका मार्गदर्शक',
      connected: 'बैकएंड कनेक्टेड',
      disconnected: 'बैकएंड उपलब्ध नहीं',
      phaseDone: 'चरण 0–3 पूर्ण — चैट पाइपलाइन के लिए तैयार',
      readyMsg: 'फास्टएपीआई + ChromaDB बैकएंड, बहुभाषी प्रोफ़ाइल एक्सट्रैक्टर और पात्रता इंजन लाइव हैं।',
      apiDocs: 'Swagger API डॉक्स',
      nextPhase: 'अगला: चरण 4 — चैट पाइपलाइन',
      disclaimer: 'अस्वीकरण: नागरिक AI केवल जानकारी के लिए है। पात्रता का अंतिम निर्णय केवल आधिकारिक सरकारी पोर्टल और सक्षम प्राधिकरणों द्वारा लिया जाता है।'
    },
    mr: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजना आणि कल्याण कार्यक्रमांचा आपला मार्गदर्शक',
      connected: 'बॅकएंड कनेक्टेड',
      disconnected: 'बॅकएंड उपलब्ध नाही',
      phaseDone: 'टप्पे 0–3 पूर्ण — चॅट पाइपलाइनसाठी तयार',
      readyMsg: 'FastAPI + ChromaDB बॅकएंड, बहुभाषिक प्रोफाइल एक्स्ट्रॅक्टर आणि पात्रता इंजन लाइव आहेत.',
      apiDocs: 'Swagger API डॉक्स',
      nextPhase: 'पुढे: टप्पा 4 — चॅट पाइपलाइन',
      disclaimer: 'अस्वीकरण: नागरिक AI केवळ माहितीच्या उद्देशाने आहे. पात्रतेचा अंतिम निर्णय अधिकृत सरकारी पोर्टल आणि संबंधित प्राधिकरणांचा असेल.'
    }
  };

  const c = t[lang];

  useEffect(() => {
    checkHealth()
      .then((data) => { setHealth(data); setLoading(false); })
      .catch(() => { setHasError(true); setLoading(false); });
  }, []);

  const isHealthy = !hasError && health?.status === 'healthy';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              न
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-800">{c.title}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">{c.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <Globe2 className="w-3.5 h-3.5 text-slate-400 mx-1" />
              {(['en', 'hi', 'mr'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    lang === l
                      ? 'bg-white text-emerald-700 shadow font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                </button>
              ))}
            </div>

            {/* Health status badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              loading ? 'border-slate-200 text-slate-400'
              : isHealthy ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              {loading ? (
                <span className="animate-pulse">Checking...</span>
              ) : isHealthy ? (
                <><CheckCircle2 className="w-3.5 h-3.5" />{c.connected}</>
              ) : (
                <><AlertCircle className="w-3.5 h-3.5" />{c.disconnected}</>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 flex flex-col justify-center items-center gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-lg text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">{c.phaseDone}</h2>
          <p className="text-sm text-slate-500 mb-6">{c.readyMsg}</p>

          {/* Status table */}
          <div className="text-left text-xs rounded-xl border border-slate-200 overflow-hidden mb-5">
            {[
              ['Health', health?.status || 'Checking...'],
              ['Version', health?.version || '0.1.0'],
              ['Schemes loaded', '2 (PM-KISAN, Post-Matric Scholarship)'],
              ['ChromaDB index', '10 multilingual chunks'],
              ['Tests passing', '13 / 13'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="text-slate-800 font-semibold">{v}</span>
              </div>
            ))}
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-medium underline underline-offset-2 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {c.apiDocs} →
          </a>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{c.nextPhase}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        <p>⚠️ {c.disclaimer}</p>
      </footer>
    </div>
  );
}
