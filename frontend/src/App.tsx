import { useState, useEffect } from 'react';
import { checkHealth } from './lib/api';
import type { HealthStatus } from './lib/api';
import { ShieldCheck, AlertCircle, CheckCircle2, MessageSquare, Globe2 } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');

  const titles = {
    en: {
      title: 'NagrikAI',
      subtitle: 'Multilingual Policy, Rights & Government Scheme Explainer',
      statusLabel: 'Backend Status',
      connected: 'backend connected',
      disconnected: 'backend disconnected',
      scaffoldDone: 'Phase 0 Scaffold Complete',
      readyMsg: 'FastAPI backend, Pydantic models, and React/Tailwind frontend are ready.',
      disclaimer: 'Disclaimer: NagrikAI is an informational tool. Decisions on eligibility and benefits are made solely by official government portals and competent authorities.'
    },
    hi: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजना, अधिकार और नीति मार्गदर्शक',
      statusLabel: 'बैकएंड स्थिति',
      connected: 'बैकएंड कनेक्टेड (Backend Connected)',
      disconnected: 'बैकएंड डिस्कनेक्टेड',
      scaffoldDone: 'चरण 0 मचान पूर्ण (Phase 0 Scaffold Complete)',
      readyMsg: 'फास्टएपीआई बैकएंड और रिएक्ट फ्रंटएंड तैयार हैं।',
      disclaimer: 'अस्वीकरण: नागरिक AI केवल जानकारी के लिए है। पात्रता का अंतिम निर्णय संबंधित सरकारी प्राधिकरण द्वारा ही लिया जाता है।'
    },
    mr: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजना, अधिकार आणि धोरण मार्गदर्शक',
      statusLabel: 'बॅकएंड स्थिती',
      connected: 'बॅकएंड कनेक्टेड (Backend Connected)',
      disconnected: 'बॅकएंड डिस्कनेक्टेड',
      scaffoldDone: 'टप्पा 0 स्केफोल्ड पूर्ण (Phase 0 Scaffold Complete)',
      readyMsg: 'फास्टएपीआय बॅकएंड आणि रिॲक्ट फ्रंटएंड सज्ज आहेत.',
      disclaimer: 'अस्वीकरण: नागरिक AI हे केवळ माहितीच्या उद्देशाने आहे. पात्रतेबाबतचा अंतिम निर्णय अधिकृत सरकारी पोर्टलचा असेल.'
    }
  };

  const currentT = titles[lang];

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setHasError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow">
              न
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-800">{currentT.title}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">{currentT.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <Globe2 className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'hi' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'mr' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                मराठी
              </button>
            </div>

            {/* Health pill */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border">
              {loading ? (
                <span className="text-slate-500 animate-pulse">Checking status...</span>
              ) : health?.status === 'healthy' && !hasError ? (
                <span className="flex items-center text-emerald-700 bg-emerald-50 border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                  {currentT.connected}
                </span>
              ) : (
                <span className="flex items-center text-rose-700 bg-rose-50 border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 mr-1.5" />
                  {currentT.disconnected}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{currentT.scaffoldDone}</h2>
          <p className="text-sm text-slate-600 mb-6">{currentT.readyMsg}</p>

          <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Backend Health Endpoint:</span>
              <span className="font-mono text-emerald-700 font-semibold">/api/health</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-semibold capitalize text-slate-800">{health?.status || 'Waiting...'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">App Service:</span>
              <span className="text-slate-700">{health?.app || 'NagrikAI'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">API Version:</span>
              <span className="text-slate-700">{health?.version || '0.1.0'}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-500">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>Ready for Phase 1: Scheme Data Layer</span>
          </div>
        </div>
      </main>

      {/* Disclaimer Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto">
          <p>{currentT.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
