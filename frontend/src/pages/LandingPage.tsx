import React from 'react';
import {
  MessageSquare, ShieldCheck, FileText, Zap,
  CheckCircle2, ArrowRight, Brain, Star, ChevronRight
} from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isLoggedIn?: boolean;
  userName?: string;
}

const LANG_OPTIONS: { code: SupportedLanguage; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

const FEATURES = [
  {
    icon: MessageSquare,
    color: 'bg-emerald-100 text-emerald-700',
    en: { title: 'Scheme Discovery Chat', desc: 'Conversational multilingual guide to 100+ government schemes. Ask in any language.' },
    hi: { title: 'योजना खोज चैट', desc: 'सरकारी योजनाओं के लिए बहुभाषी चैट गाइड।' },
    mr: { title: 'योजना शोध चॅट', desc: 'सरकारी योजनांसाठी बहुभाषी चॅट मार्गदर्शक.' },
  },
  {
    icon: CheckCircle2,
    color: 'bg-blue-100 text-blue-700',
    en: { title: 'Eligibility Engine', desc: 'Deterministic code-based eligibility checks. No AI guessing — every rule verified.' },
    hi: { title: 'पात्रता इंजन', desc: 'कोड-आधारित पात्रता जाँच। कोई अनुमान नहीं।' },
    mr: { title: 'पात्रता इंजन', desc: 'कोड-आधारित पात्रता तपासणी. अंदाज नाही.' },
  },
  {
    icon: FileText,
    color: 'bg-amber-100 text-amber-700',
    en: { title: 'Notice Explainer', desc: 'Upload any government circular — get a plain-language summary in seconds.' },
    hi: { title: 'नोटिस समझाइए', desc: 'कोई भी सरकारी नोटिस अपलोड करें — सरल भाषा में सारांश पाएं।' },
    mr: { title: 'नोटीस स्पष्टीकरण', desc: 'कोणतीही सरकारी नोटीस अपलोड करा — सोप्या भाषेत सारांश मिळवा.' },
  },
  {
    icon: Brain,
    color: 'bg-violet-100 text-violet-700',
    en: { title: 'Negotiated Memory', desc: 'AI proposes what to remember. You approve, edit, or dismiss every entry. Full control.' },
    hi: { title: 'नियंत्रित मेमोरी', desc: 'AI याद रखने का प्रस्ताव देता है। आप हर एंट्री को मंजूर या अस्वीकार करें।' },
    mr: { title: 'वाटाघाटी मेमरी', desc: 'AI लक्षात ठेवण्याचा प्रस्ताव ठेवते. तुम्ही प्रत्येक नोंद मंजूर करा किंवा नाकारा.' },
  },
  {
    icon: ShieldCheck,
    color: 'bg-teal-100 text-teal-700',
    en: { title: 'NagrikVault', desc: 'Client-side encrypted document locker. SHA-256 fingerprinted. Your docs never leave your browser.' },
    hi: { title: 'नागरिक वॉल्ट', desc: 'क्लाइंट-साइड एन्क्रिप्टेड दस्तावेज़ लॉकर। SHA-256 सुरक्षित।' },
    mr: { title: 'नागरिक व्हॉल्ट', desc: 'क्लायंट-साइड एन्क्रिप्टेड दस्तऐवज लॉकर. SHA-256 सुरक्षित.' },
  },
  {
    icon: Zap,
    color: 'bg-rose-100 text-rose-700',
    en: { title: 'Copilot Autofill', desc: '1-click autofill of government portal forms using your verified vault profile.' },
    hi: { title: 'कोपायलट ऑटोफिल', desc: 'सरकारी पोर्टल फॉर्म को 1-क्लिक में स्वचालित भरें।' },
    mr: { title: 'कोपायलट ऑटोफिल', desc: 'शासकीय पोर्टल फॉर्म 1-क्लिकमध्ये भरा.' },
  },
];

const STEPS = {
  en: [
    { n: '1', title: 'Tell NagrikAI about yourself', desc: 'Type or speak in English, Hindi, or Marathi. No forms to fill.' },
    { n: '2', title: 'Get personalised scheme matches', desc: 'Deterministic eligibility checks with ✅/❌/❓ for every criterion.' },
    { n: '3', title: 'Apply with 1-click autofill', desc: 'Your verified vault profile fills government portal forms instantly.' },
  ],
  hi: [
    { n: '1', title: 'अपने बारे में बताएं', desc: 'हिंदी, मराठी या अंग्रेजी में टाइप करें या बोलें।' },
    { n: '2', title: 'व्यक्तिगत योजनाएं पाएं', desc: 'हर मानदंड के लिए ✅/❌/❓ के साथ पात्रता जाँच।' },
    { n: '3', title: '1-क्लिक से आवेदन करें', desc: 'आपका प्रोफ़ाइल सरकारी फॉर्म तुरंत भर देगा।' },
  ],
  mr: [
    { n: '1', title: 'स्वतःबद्दल सांगा', desc: 'हिंदी, मराठी किंवा इंग्रजीत टाइप करा किंवा बोला.' },
    { n: '2', title: 'वैयक्तिक योजना मिळवा', desc: 'प्रत्येक निकषासाठी ✅/❌/❓ सह पात्रता तपासणी.' },
    { n: '3', title: '1-क्लिकमध्ये अर्ज करा', desc: 'आपले प्रोफाइल शासकीय फॉर्म त्वरित भरेल.' },
  ],
};

const HERO = {
  en: {
    badge: 'IDEA//FORGE Hackathon · Track 1 Civic Pulse',
    headline: 'Government Schemes, Finally Understandable.',
    sub: 'NagrikAI explains every welfare scheme, checks your eligibility in real-time, and helps you apply — in English, Hindi, and Marathi.',
    cta: 'Get Started Free',
    login: 'Sign In',
    trusted: 'No Aadhaar required. No data sold. Ever.',
  },
  hi: {
    badge: 'IDEA//FORGE हैकाथॉन · ट्रैक 1 सिविक पल्स',
    headline: 'सरकारी योजनाएं, अब समझना आसान।',
    sub: 'नागरिक AI हर कल्याण योजना समझाता है, पात्रता जाँचता है और हिंदी, मराठी, अंग्रेजी में आवेदन में मदद करता है।',
    cta: 'मुफ्त शुरू करें',
    login: 'साइन इन',
    trusted: 'आधार की जरूरत नहीं। डेटा नहीं बेचा जाता।',
  },
  mr: {
    badge: 'IDEA//FORGE हॅकथॉन · ट्रॅक 1 सिव्हिक पल्स',
    headline: 'सरकारी योजना, आता सहज समजतात.',
    sub: 'नागरिक AI प्रत्येक कल्याणकारी योजना स्पष्ट करतो, पात्रता तपासतो आणि मराठी, हिंदी, इंग्रजीत अर्ज करण्यास मदत करतो.',
    cta: 'मोफत सुरू करा',
    login: 'साइन इन',
    trusted: 'आधार आवश्यक नाही. डेटा विकला जात नाही.',
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted, onLogin, language, onLanguageChange, isLoggedIn = false, userName
}) => {
  const hero = HERO[language];
  const steps = STEPS[language];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              न
            </div>
            <span className="font-bold text-slate-900">NagrikAI</span>
            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Track 1
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language picker */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => onLanguageChange(opt.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    language === opt.code
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {opt.native}
                </button>
              ))}
            </div>
            <button
              onClick={onLogin}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              {isLoggedIn ? (userName ? `${userName}` : 'Dashboard') : hero.login}
            </button>
            <button
              onClick={onGetStarted}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <span>{isLoggedIn ? (language === 'hi' ? 'ऐप खोलें' : language === 'mr' ? 'अ‍ॅप उघडा' : 'Open App') : hero.cta}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold px-3 py-1.5 rounded-full mb-8">
            <Star className="w-3 h-3" />
            <span>{hero.badge}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
            {hero.headline}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            {hero.sub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center space-x-2 text-base"
            >
              <span>{hero.cta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base"
            >
              {hero.login}
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400">{hero.trusted}</p>

          {/* Language showcase */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            {[
              { lang: 'EN', text: 'Am I eligible for PM-KISAN?', color: 'border-emerald-400/40 text-emerald-200' },
              { lang: 'हि', text: 'मैं पुणे का किसान हूँ', color: 'border-blue-400/40 text-blue-200' },
              { lang: 'म', text: 'मला पोस्ट मॅट्रिक शिष्यवृत्ती मिळेल का?', color: 'border-amber-400/40 text-amber-200' },
            ].map((item) => (
              <div
                key={item.lang}
                className={`flex items-center space-x-2.5 border ${item.color} bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm max-w-xs`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {item.lang}
                </span>
                <span className="text-xs leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-3">
            {language === 'hi' ? 'क्या मिलता है?' : language === 'mr' ? 'काय मिळते?' : 'Everything you need'}
          </h2>
          <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto text-sm">
            {language === 'hi'
              ? 'एक इंटरफेस में सरकारी योजनाओं की सम्पूर्ण मार्गदर्शिका।'
              : language === 'mr'
              ? 'एकाच इंटरफेसमध्ये शासकीय योजनांचे संपूर्ण मार्गदर्शन.'
              : 'A complete civic intelligence platform in one interface.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const content = f[language] || f.en;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{content.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{content.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-14">
            {language === 'hi' ? 'यह कैसे काम करता है?' : language === 'mr' ? 'हे कसे काम करते?' : 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-200">
                  {step.n}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-20 bg-gradient-to-r from-emerald-900 to-teal-900 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4">
            {language === 'hi' ? 'आज ही शुरू करें' : language === 'mr' ? 'आजच सुरू करा' : 'Start for free today'}
          </h2>
          <p className="text-slate-300 mb-8 text-sm">
            {language === 'hi'
              ? 'कोई क्रेडिट कार्ड नहीं। कोई आधार नहीं। बस सरल नागरिक मार्गदर्शन।'
              : language === 'mr'
              ? 'क्रेडिट कार्ड नाही. आधार नाही. फक्त सोपे नागरिक मार्गदर्शन.'
              : 'No credit card. No Aadhaar. Just simple civic guidance.'}
          </p>
          <button
            onClick={onGetStarted}
            className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-extrabold px-10 py-4 rounded-2xl shadow-lg transition-all text-base"
          >
            {hero.cta} →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-400">
        <p>NagrikAI · Built for IDEA//FORGE Hackathon 2026 · Track 1 Civic Pulse</p>
        <p className="mt-1">No Aadhaar collected · No personal data sold · Scheme data is unverified demo content</p>
      </footer>
    </div>
  );
};
