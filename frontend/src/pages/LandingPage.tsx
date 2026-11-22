import React from 'react';
import {
  Shield, Tractor, GraduationCap, HeartPulse,
  FileText, CheckCircle2, Zap, Brain, MessageSquare, ArrowRight,
  ChevronRight, Globe, Sparkles, Lock, BadgeCheck, Languages,
  TrendingUp, Award, IndianRupee, Send
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

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  language,
  onLanguageChange,
  isLoggedIn = false,
  userName,
}) => {
  const copy = {
    en: {
      badge: 'IDEA//FORGE Hackathon · Track 1: Civic Pulse',
      headline1: 'Government Schemes,',
      headline2: 'Finally Understandable.',
      sub: 'NagrikAI explains every welfare scheme, checks your eligibility in real-time, and helps you apply — in English, Hindi, and Marathi.',
      cta: 'Get Started Free',
      signin: 'Sign In',
      openApp: 'Open App',
      trust: 'No Aadhaar required · No data sold · 100% Official Sources',
      featuresTitle: 'Everything you need in one place',
      featuresSub: 'A complete civic intelligence platform powered by deterministic verification and official government portals.',
      howTitle: 'How it works',
      howSub: 'Three simple steps to access any government scheme.',
      ctaTitle: 'Start for free today',
      ctaSub: 'No credit card. No Aadhaar. Just simple civic guidance.',
      ctaBtn: 'Get Started Free →',
    },
    hi: {
      badge: 'IDEA//FORGE हैकाथॉन · ट्रैक 1: सिविक पल्स',
      headline1: 'सरकारी योजनाएं,',
      headline2: 'अब समझना आसान।',
      sub: 'नागरिक AI हर कल्याण योजना समझाता है, पात्रता जाँचता है और हिंदी, मराठी, अंग्रेजी में आवेदन में मदद करता है।',
      cta: 'मुफ्त शुरू करें',
      signin: 'साइन इन',
      openApp: 'ऐप खोलें',
      trust: 'आधार की जरूरत नहीं · डेटा नहीं बेचा जाता · 100% आधिकारिक स्रोत',
      featuresTitle: 'सब कुछ एक जगह',
      featuresSub: 'सरकारी योजनाओं के लिए संपूर्ण नागरिक इंटेलिजेंस प्लेटफॉर्म।',
      howTitle: 'यह कैसे काम करता है?',
      howSub: 'किसी भी सरकारी योजना तक पहुँचने के तीन सरल चरण।',
      ctaTitle: 'आज ही मुफ्त शुरू करें',
      ctaSub: 'कोई क्रेडिट कार्ड नहीं। कोई आधार नहीं। बस सरल नागरिक मार्गदर्शन।',
      ctaBtn: 'अभी शुरू करें →',
    },
    mr: {
      badge: 'IDEA//FORGE हॅकथॉन · ट्रॅक 1: सिव्हिक पल्स',
      headline1: 'शासकीय योजना,',
      headline2: 'आता सहज समजतात.',
      sub: 'नागरिक AI प्रत्येक कल्याणकारी योजना स्पष्ट करतो, पात्रता तपासतो आणि मराठी, हिंदी, इंग्रजीत अर्ज करण्यास मदत करतो.',
      cta: 'मोफत सुरू करा',
      signin: 'साइन इन',
      openApp: 'अ‍ॅप उघडा',
      trust: 'आधार आवश्यक नाही · डेटा विकला जात नाही · 100% अधिकृत स्रोत',
      featuresTitle: 'सर्व काही एकाच ठिकाणी',
      featuresSub: 'निश्चयात्मक पडताळणी आणि अधिकृत पोर्टलद्वारे संपूर्ण नागरिक इंटेलिजेंस प्लॅटफॉर्म.',
      howTitle: 'हे कसे काम करते?',
      howSub: 'कोणत्याही शासकीय योजनेपर्यंत पोहोचण्याचे तीन सोपे टप्पे.',
      ctaTitle: 'आजच मोफत सुरू करा',
      ctaSub: 'क्रेडिट कार्ड नाही. आधार नाही. फक्त सोपे नागरिक मार्गदर्शन.',
      ctaBtn: 'आत्ता सुरू करा →',
    },
  }[language];

  const FEATURES = [
    {
      icon: MessageSquare,
      color: 'bg-emerald-100 text-emerald-700',
      border: 'hover:border-emerald-300',
      title: { en: 'Scheme Discovery Chat', hi: 'योजना खोज चैट', mr: 'योजना शोध चॅट' },
      desc: {
        en: 'Conversational multilingual guide to 100+ government schemes. Ask in English, Hindi, or Marathi.',
        hi: 'सरकारी योजनाओं के लिए बहुभाषी चैट गाइड।',
        mr: 'सरकारी योजनांसाठी बहुभाषी चॅट मार्गदर्शक.',
      },
    },
    {
      icon: CheckCircle2,
      color: 'bg-blue-100 text-blue-700',
      border: 'hover:border-blue-300',
      title: { en: 'Eligibility Engine', hi: 'पात्रता इंजन', mr: 'पात्रता इंजन' },
      desc: {
        en: 'Deterministic code-based eligibility checks. No AI guessing — every rule verified against official gazettes.',
        hi: 'कोड-आधारित पात्रता जाँच। कोई अनुमान नहीं।',
        mr: 'कोड-आधारित पात्रता तपासणी. अंदाज नाही.',
      },
    },
    {
      icon: FileText,
      color: 'bg-amber-100 text-amber-700',
      border: 'hover:border-amber-300',
      title: { en: 'Notice Explainer', hi: 'नोटिस समझाइए', mr: 'नोटीस स्पष्टीकरण' },
      desc: {
        en: 'Upload any government circular — get a plain-language summary in seconds with page-referenced citations.',
        hi: 'कोई भी सरकारी नोटिस अपलोड करें — सरल भाषा में सारांश पाएं।',
        mr: 'कोणतीही सरकारी नोटीस अपलोड करा — सोप्या भाषेत सारांश मिळवा.',
      },
    },
    {
      icon: Brain,
      color: 'bg-violet-100 text-violet-700',
      border: 'hover:border-violet-300',
      title: { en: 'Negotiated Memory', hi: 'नियंत्रित मेमोरी', mr: 'वाटाघाटी मेमरी' },
      desc: {
        en: 'AI proposes what to remember. You approve, edit, or dismiss every entry. Full control over your data.',
        hi: 'AI याद रखने का प्रस्ताव देता है। आप हर एंट्री को मंजूर या अस्वीकार करें।',
        mr: 'AI लक्षात ठेवण्याचा प्रस्ताव ठेवते. तुम्ही प्रत्येक नोंद मंजूर करा किंवा नाकारा.',
      },
    },
    {
      icon: Lock,
      color: 'bg-teal-100 text-teal-700',
      border: 'hover:border-teal-300',
      title: { en: 'NagrikVault', hi: 'नागरिक वॉल्ट', mr: 'नागरिक व्हॉल्ट' },
      desc: {
        en: 'AES-256 encrypted document locker. SHA-256 fingerprinted. Your docs never leave your browser.',
        hi: 'AES-256 एन्क्रिप्टेड दस्तावेज़ लॉकर। SHA-256 सुरक्षित।',
        mr: 'AES-256 एन्क्रिप्टेड दस्तऐवज लॉकर. SHA-256 सुरक्षित.',
      },
    },
    {
      icon: Zap,
      color: 'bg-rose-100 text-rose-700',
      border: 'hover:border-rose-300',
      title: { en: 'Copilot Autofill', hi: 'कोपायलट ऑटोफिल', mr: 'कोपायलट ऑटोफिल' },
      desc: {
        en: '1-click autofill of government portal forms using your verified vault profile. Browser extension included.',
        hi: 'सरकारी पोर्टल फॉर्म को 1-क्लिक में स्वचालित भरें।',
        mr: 'शासकीय पोर्टल फॉर्म 1-क्लिकमध्ये भरा.',
      },
    },
  ];

  const STEPS = {
    en: [
      { n: 1, title: 'Tell us about yourself', desc: 'Type or speak in English, Hindi, or Marathi. No forms to fill.' },
      { n: 2, title: 'Get personalised matches', desc: 'Deterministic eligibility checks with ✅/❌/❓ for every criterion.' },
      { n: 3, title: 'Apply with 1-click', desc: 'Your verified vault profile fills government portal forms instantly.' },
    ],
    hi: [
      { n: 1, title: 'अपने बारे में बताएं', desc: 'हिंदी, मराठी या अंग्रेजी में टाइप करें या बोलें।' },
      { n: 2, title: 'व्यक्तिगत योजनाएं पाएं', desc: 'हर मानदंड के लिए ✅/❌/❓ के साथ पात्रता जाँच।' },
      { n: 3, title: '1-क्लिक से आवेदन करें', desc: 'आपका प्रोफ़ाइल सरकारी फॉर्म तुरंत भर देगा।' },
    ],
    mr: [
      { n: 1, title: 'स्वतःबद्दल सांगा', desc: 'हिंदी, मराठी किंवा इंग्रजीत टाइप करा किंवा बोला.' },
      { n: 2, title: 'वैयक्तिक योजना मिळवा', desc: 'प्रत्येक निकषासाठी ✅/❌/❓ सह पात्रता तपासणी.' },
      { n: 3, title: '1-क्लिकमध्ये अर्ज करा', desc: 'आपले प्रोफाइल शासकीय फॉर्म त्वरित भरेल.' },
    ],
  }[language];

  const AUDIENCE = [
    {
      icon: Tractor,
      accent: 'emerald',
      tag: { en: 'For Farmers', hi: 'किसानों के लिए', mr: 'शेतकऱ्यांसाठी' },
      title: { en: 'Agriculture & Rural Welfare', hi: 'कृषि एवं ग्रामीण कल्याण', mr: 'कृषी व ग्रामीण कल्याण' },
      desc: {
        en: 'PM-KISAN ₹6,000/year direct benefit, Kisan Credit Card, crop insurance, and irrigation subsidies.',
        hi: 'पीएम-किसान ₹6,000 वार्षिक सहायता, किसान क्रेडिट कार्ड और फसल बीमा।',
        mr: 'पीएम-किसान ₹6,000 वार्षिक मदत, किसान क्रेडिट कार्ड व पीक विमा.',
      },
      portal: 'pmkisan.gov.in',
    },
    {
      icon: GraduationCap,
      accent: 'blue',
      tag: { en: 'For Students', hi: 'छात्रों के लिए', mr: 'विद्यार्थ्यांसाठी' },
      title: { en: 'Education & Scholarships', hi: 'शिक्षा एवं छात्रवृत्ति', mr: 'शिक्षण व शिष्यवृत्ती' },
      desc: {
        en: 'MahaDBT 100% tuition & exam fee waiver for OBC/VJNT/SBC students, plus NSP Central Sector scholarships.',
        hi: 'महाडीबीटी ओबीसी/वीजेएनटी छात्रों के लिए 100% शिक्षण शुल्क माफी और राष्ट्रीय छात्रवृत्तियां।',
        mr: 'महाडीबीटी OBC/VJNT विद्यार्थ्यांसाठी 100% शिक्षण शुल्क माफी व राष्ट्रीय शिष्यवृत्ती.',
      },
      portal: 'mahadbt.maharashtra.gov.in',
    },
    {
      icon: HeartPulse,
      accent: 'violet',
      tag: { en: 'For Women & Families', hi: 'महिलाओं व परिवारों के लिए', mr: 'महिला व कुटुंबांसाठी' },
      title: { en: 'Health & Social Security', hi: 'स्वास्थ्य एवं सामाजिक सुरक्षा', mr: 'आरोग्य व सामाजिक सुरक्षा' },
      desc: {
        en: 'Majhi Ladki Bahin ₹1,500/month DBT, Ayushman Bharat ₹5 Lakh cashless health card, and PMAY housing.',
        hi: 'माझी लाडकी बहीण ₹1,500/माह, आयुष्मान भारत ₹5 लाख और पीएम आवास।',
        mr: 'माझी लाडकी बहीण ₹1,500/महिना, आयुष्मान भारत ₹5 लाख व पीएम आवास.',
      },
      portal: 'ladkibahin.maharashtra.gov.in',
    },
  ];

  const accentClasses: Record<string, { bg: string; text: string; border: string; pill: string; num: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-700', num: 'bg-emerald-600 text-white' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', pill: 'bg-blue-100 text-blue-700', num: 'bg-blue-600 text-white' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', pill: 'bg-violet-100 text-violet-700', num: 'bg-violet-600 text-white' },
  };

  const PROMPTS = [
    { en: 'Am I eligible for PM-KISAN?', hi: 'क्या मैं PM-KISAN के लिए पात्र हूँ?', mr: 'मला PM-KISAN मिळेल का?' },
    { en: 'MahaDBT Tuition Fee Waiver for OBC', hi: 'महाडीबीटी ओबीसी शिक्षण शुल्क', mr: 'महाडीबीटी OBC शिक्षण शुल्क' },
    { en: 'Majhi Ladki Bahin ₹1,500 monthly DBT', hi: 'माझी लाडकी बहीण ₹1,500/माह', mr: 'माझी लाडकी बहीण ₹1,500/महिना' },
    { en: 'Ayushman Bharat health card apply', hi: 'आयुष्मान भारत हेल्थ कार्ड', mr: 'आयुष्मान भारत कार्ड अर्ज' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="NagrikAI Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-200"
            />
            <div className="leading-none">
              <span className="font-black text-slate-900 text-lg tracking-tight">NagrikAI</span>
              <span className="hidden sm:inline text-[10px] ml-2 font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                Track 1
              </span>
            </div>
          </div>

          {/* Centre nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-700 transition-colors">Features</a>
            <a href="#sectors" className="hover:text-emerald-700 transition-colors">Sectors</a>
            <a href="#how" className="hover:text-emerald-700 transition-colors">How it Works</a>
          </nav>

          {/* Right: lang + actions */}
          <div className="flex items-center gap-3">
            {/* Language picker */}
            <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 rounded-lg p-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 mx-1.5" />
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => onLanguageChange(opt.code)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
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
              className="text-sm font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors hidden sm:block"
            >
              {isLoggedIn ? (userName ?? 'Dashboard') : copy.signin}
            </button>

            <button
              onClick={onGetStarted}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>{isLoggedIn ? copy.openApp : copy.cta}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white h-[calc(100vh-4rem)] flex items-center">

        {/* Mesh / glow background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 10% 60%, rgba(16,185,129,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 90% 20%, rgba(5,150,105,0.14) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 50% 100%, rgba(6,78,59,0.3) 0%, transparent 60%)
          `
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">

            {/* ── LEFT: Text ── */}
            <div className="order-2 lg:order-1">

              {/* Badge pill */}
              <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {copy.badge}
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-[3.4rem] font-black leading-[1.05] tracking-tight mb-4">
                <span className="text-white block">{copy.headline1}</span>
                <span className="block mt-1">
                  <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    {copy.headline2}
                  </span>
                </span>
              </h1>

              {/* Sub */}
              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed mb-6 max-w-xl">
                {copy.sub}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-5">
                <button
                  onClick={onGetStarted}
                  className="group relative bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-7 py-3 rounded-xl shadow-xl shadow-emerald-900/50 transition-all flex items-center gap-2 text-sm overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Sparkles className="w-4 h-4" />
                  <span>{copy.cta}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onLogin}
                  className="border-2 border-white/20 hover:border-emerald-400/60 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
                >
                  {copy.signin}
                </button>
              </div>

              {/* Trust bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 mb-5">
                <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> No Aadhaar required</span>
                <span className="w-px h-3 bg-slate-700" />
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Zero data sold</span>
                <span className="w-px h-3 bg-slate-700" />
                <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-emerald-400" /> 100% Official Sources</span>
              </div>

              {/* Stats row */}
              <div className="pt-5 border-t border-white/10 grid grid-cols-3 gap-3">
                {[
                  { n: '100+', label: 'Schemes', icon: TrendingUp },
                  { n: '12+', label: 'Gov Portals', icon: Globe },
                  { n: '3', label: 'Languages', icon: Languages },
                ].map(({ n, label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-white leading-none">{n}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Visual panel ── */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[340px] lg:max-w-[380px]">

                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full" />

                {/* Main chat window mock */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8 bg-slate-800/60">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-[10px] text-slate-400 font-medium">NagrikAI Copilot</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {/* Chat messages */}
                  <div className="p-3 space-y-3">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-emerald-600 text-white text-[11px] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] leading-relaxed">
                        I'm an OBC student in Maharashtra. Can I get tuition fee waiver?
                      </div>
                    </div>

                    {/* AI reply */}
                    <div className="flex gap-2 items-start">
                      <img
                        src="/logo.png"
                        alt="NagrikAI"
                        className="w-6 h-6 rounded-lg object-cover shrink-0 mt-0.5 border border-white/20"
                      />
                      <div className="bg-slate-800 text-slate-200 text-[11px] rounded-xl rounded-tl-sm px-3 py-2 max-w-[88%] leading-relaxed space-y-1.5">
                        <p><span className="text-emerald-400 font-bold">✅ Yes! MahaDBT</span> covers 100% Tuition & Exam Fees for OBC/VJNT/SBC.</p>
                        <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-lg p-2 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span>Maharashtra domicile ✅</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span>Income &lt; ₹8 lakh/year ✅</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <IndianRupee className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
                            <span className="text-yellow-300 font-semibold">Benefit: 100% fee waiver</span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-[10px]">Source: <span className="text-emerald-400 font-mono">mahadbt.maharashtra.gov.in</span></p>
                      </div>
                    </div>

                    {/* Input bar */}
                    <div className="flex items-center gap-2 bg-slate-800 border border-white/10 rounded-xl px-3 py-2">
                      <input readOnly value="Ask about any scheme…" className="flex-1 bg-transparent text-[11px] text-slate-500 outline-none cursor-default" />
                      <button onClick={onGetStarted} className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 hover:bg-emerald-500 transition-colors">
                        <Send className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating accent cards */}
                <div className="absolute -top-4 -left-5 bg-white rounded-xl shadow-xl px-3 py-2 flex items-center gap-2 border border-slate-100 z-10">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Tractor className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 leading-none">PM-KISAN</div>
                    <div className="text-[11px] font-black text-slate-900">₹6,000 / year</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
                </div>

                <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl px-3 py-2 flex items-center gap-2 border border-slate-100 z-10">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <HeartPulse className="w-3.5 h-3.5 text-violet-700" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 leading-none">Majhi Ladki Bahin</div>
                    <div className="text-[11px] font-black text-slate-900">₹1,500 / month</div>
                  </div>
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 -right-6 lg:-right-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg px-2.5 py-2 flex items-center gap-1.5 z-10">
                  <GraduationCap className="w-3.5 h-3.5 text-white shrink-0" />
                  <div>
                    <div className="text-[9px] text-emerald-100 leading-none">Eligibility</div>
                    <div className="text-[11px] font-black text-white">✅ Eligible</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Prompt chips (below hero) ── */}
      <div className="bg-slate-900 border-b border-white/5 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Try:
          </span>
          {PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={onGetStarted}
              className="text-xs bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 text-slate-400 hover:text-white px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              {p[language]}
              <ChevronRight className="w-3 h-3 opacity-40" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Audience Cards ── clean white section below hero */}
      <section id="sectors" className="bg-slate-50 border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black tracking-widest uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block mb-3">
              Who We Serve
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {language === 'hi' ? 'आपके लिए सही योजनाएं' : language === 'mr' ? 'आपल्यासाठी योग्य योजना' : 'Find schemes tailored to you'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUDIENCE.map((item, i) => {
              const Icon = item.icon;
              const acc = accentClasses[item.accent];
              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border-2 ${acc.border} p-7 hover:shadow-xl transition-all group flex flex-col`}
                >
                  {/* Icon + tag */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-xl ${acc.bg} ${acc.text} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${acc.pill} px-2.5 py-1 rounded-full`}>
                      {item.tag[language]}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2.5">{item.title[language]}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">{item.desc[language]}</p>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">{item.portal}</span>
                    <button
                      onClick={onGetStarted}
                      className={`text-xs font-bold ${acc.text} flex items-center gap-1 hover:gap-2 transition-all`}
                    >
                      Explore <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ticker / live portal notice */}
          <div className="mt-8 bg-slate-900 rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-medium">
                Live search active on <span className="text-emerald-400 font-semibold">myScheme · MahaDBT · NSP · PM-KISAN</span> and 12+ verified government portals.
              </span>
            </div>
            <button onClick={onGetStarted} className="text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-wider shrink-0">
              Learn More →
            </button>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{copy.featuresTitle}</h2>
            <p className="text-slate-500 text-sm">{copy.featuresSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border border-slate-200 ${f.border} p-7 hover:shadow-md transition-all group`}
                >
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{f.title[language]}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc[language]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Language Showcase Strip ── */}
      <section className="py-14 bg-gradient-to-r from-emerald-50 to-teal-50 border-y border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="shrink-0 flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <Languages className="w-5 h-5" />
              <span>Works in 3 languages:</span>
            </div>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {[
                { lang: 'EN', text: 'Am I eligible for PM-KISAN ₹6,000?', c: 'border-emerald-300 bg-white text-emerald-800' },
                { lang: 'हि', text: 'मैं पुणे का किसान हूँ, 2 हेक्टेयर जमीन है', c: 'border-blue-300 bg-white text-blue-800' },
                { lang: 'म', text: 'मला पोस्ट मॅट्रिक शिष्यवृत्ती मिळेल का?', c: 'border-violet-300 bg-white text-violet-800' },
              ].map((item) => (
                <div
                  key={item.lang}
                  className={`flex items-center gap-2.5 border ${item.c} rounded-xl px-4 py-2.5 text-sm shadow-xs`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0 text-slate-700">
                    {item.lang}
                  </span>
                  <span className="text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{copy.howTitle}</h2>
            <p className="text-slate-500 text-sm">{copy.howSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center relative">
                {/* connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-7 left-[calc(50%+32px)] right-0 h-0.5 bg-gradient-to-r from-emerald-300 to-transparent" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl font-black flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200 relative z-10">
                  {step.n}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-base">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="bg-emerald-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: '100+', label: { en: 'Government Schemes', hi: 'सरकारी योजनाएं', mr: 'शासकीय योजना' } },
              { n: '12+', label: { en: 'Verified Gov Portals', hi: 'सत्यापित पोर्टल', mr: 'अधिकृत पोर्टल' } },
              { n: '3', label: { en: 'Indian Languages', hi: 'भारतीय भाषाएं', mr: 'भारतीय भाषा' } },
              { n: '0', label: { en: 'Aadhaar Required', hi: 'आधार आवश्यक', mr: 'आधार आवश्यक' } },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-black text-emerald-300 mb-1">{stat.n}</div>
                <div className="text-sm text-emerald-100 font-medium">{stat.label[language]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide px-3.5 py-1.5 rounded-full mb-8">
            <Shield className="w-3.5 h-3.5" />
            <span>Verified Civic AI · Official Sources Only</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{copy.ctaTitle}</h2>
          <p className="text-slate-300 text-sm mb-10 max-w-lg mx-auto">{copy.ctaSub}</p>
          <button
            onClick={onGetStarted}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-900/50 transition-all text-base inline-flex items-center gap-2"
          >
            {copy.ctaBtn}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/logo.png"
                alt="NagrikAI Logo"
                className="w-8 h-8 rounded-lg object-cover shadow-sm border border-slate-700"
              />
              <span className="text-white font-black text-base">NagrikAI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              National Civic Intelligence Platform simplifying government welfare schemes for every Indian citizen.
            </p>
          </div>

          {/* Official Portals */}
          <div>
            <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-3">Official Portals</span>
            <ul className="space-y-1.5 text-xs">
              {[
                { label: 'myScheme National Portal', href: 'https://www.myscheme.gov.in' },
                { label: 'MahaDBT Maharashtra', href: 'https://mahadbt.maharashtra.gov.in' },
                { label: 'National Scholarship Portal', href: 'https://scholarships.gov.in' },
                { label: 'PM-KISAN Portal', href: 'https://pmkisan.gov.in' },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-3">Privacy & Tech</span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>AES-256 Client-Side Encryption</li>
              <li>Deterministic Eligibility Engine</li>
              <li>User-Negotiated Memory</li>
              <li>Authoritative Portal Registry</li>
            </ul>
          </div>

          {/* Hackathon */}
          <div>
            <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-3">About</span>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built for IDEA//FORGE Hackathon 2026 · Track 1: Civic Pulse
            </p>
            <div className="inline-flex items-center gap-1.5 bg-emerald-900/50 border border-emerald-700 text-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold">
              <Shield className="w-3 h-3" />
              Verified Gov Build
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© 2026 NagrikAI · Built for Indian Citizens</p>
          <p>No Aadhaar collected · No personal data sold · Scheme data grounded in official portals</p>
        </div>
      </footer>
    </div>
  );
};
