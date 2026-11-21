import { useState, useEffect } from 'react';
import { checkHealth } from './lib/api';
import type { HealthStatus } from './lib/api';
import type { CitizenProfile, SupportedLanguage } from './types';
import { ChatWindow } from './components/ChatWindow';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProfilePanel } from './components/ProfilePanel';
import { NoticeUpload } from './components/NoticeUpload';
import { NagrikVault } from './components/NagrikVault';
import { UserCheck, CheckCircle2, AlertCircle, MessageSquare, FileText, ShieldCheck } from 'lucide-react';

type ActiveTab = 'chat' | 'notice' | 'vault';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [profile, setProfile] = useState<Partial<CitizenProfile>>({});
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  const t = {
    en: {
      title: 'NagrikAI',
      subtitle: 'Multilingual Policy & Scheme Intelligence',
      profileBtn: 'Profile',
      connected: 'Live',
      disconnected: 'Offline',
      disclaimer: 'Disclaimer: NagrikAI is an informational tool. Decisions on eligibility and benefits are made solely by official government portals and competent authorities. Placeholders marked TODO_VERIFY represent unverified demo data.',
    },
    hi: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजना एवं नीति मार्गदर्शक',
      profileBtn: 'प्रोफ़ाइल',
      connected: 'लाइव',
      disconnected: 'ऑफ़लाइन',
      disclaimer: 'अस्वीकरण: नागरिक AI केवल सूचनात्मक मार्गदर्शन प्रदान करता है। पात्रता और लाभों पर अंतिम निर्णय केवल आधिकारिक सरकारी पोर्टल और संबंधित प्राधिकरणों द्वारा लिया जाता है। TODO_VERIFY चिह्नित डेटा केवल डेमो के लिए है।',
    },
    mr: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजना आणि धोरण मार्गदर्शक',
      profileBtn: 'प्रोफाइल',
      connected: 'लाइव्ह',
      disconnected: 'ऑफलाइन',
      disclaimer: 'अस्वीकरण: नागरिक AI केवळ माहितीच्या उद्देशाने आहे. पात्रतेबाबतचा अंतिम निर्णय अधिकृत सरकारी पोर्टलचा असेल. TODO_VERIFY चिन्हांकित डेटा हा केवळ प्रात्यक्षिकासाठी आहे.',
    },
  }[lang];

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

  const collectedFieldsCount = Object.values(profile).filter(
    (v) => v !== null && v !== undefined && v !== ''
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              न
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-slate-900 flex items-center space-x-2">
                <span>{t.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Track 1
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">{t.subtitle}</p>
            </div>
          </div>

          {/* Controls: Language + Profile Drawer + Health */}
          <div className="flex items-center space-x-3">
            <LanguageSwitcher currentLanguage={lang} onLanguageChange={setLang} />

            {/* Profile Drawer Toggle Button */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.profileBtn}</span>
              {collectedFieldsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {collectedFieldsCount}
                </span>
              )}
            </button>

            {/* Health pill */}
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-white">
              {loading ? (
                <span className="text-slate-400 animate-pulse">Checking...</span>
              ) : health?.status === 'healthy' && !hasError ? (
                <span className="flex items-center text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                  {t.connected}
                </span>
              ) : (
                <span className="flex items-center text-rose-700 font-medium">
                  <AlertCircle className="w-3 h-3 text-rose-600 mr-1" />
                  {t.disconnected}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main area: tab bar + content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-slate-200 bg-white px-4">
          <div className="max-w-4xl mx-auto flex space-x-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>
                {lang === 'hi' ? 'योजना चैट' : lang === 'mr' ? 'योजना चॅट' : 'Scheme Chat'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('notice')}
              className={`flex items-center space-x-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'notice'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {lang === 'hi' ? 'नोटिस विश्लेषक' : lang === 'mr' ? 'नोटीस स्पष्टीकरण' : 'Notice Explainer'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'vault'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {lang === 'hi' ? 'नागरिक वॉल्ट' : lang === 'mr' ? 'नागरिक व्हॉल्ट' : 'NagrikVault (Locker)'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' ? (
            <ChatWindow
              language={lang}
              profile={profile}
              onProfileUpdate={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
            />
          ) : activeTab === 'notice' ? (
            <div className="h-full overflow-y-auto">
              <NoticeUpload language={lang} />
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <NagrikVault
                language={lang}
                profile={profile}
                onProfileUpdate={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
              />
            </div>
          )}
        </div>

        {/* Profile Side Drawer */}
        <ProfilePanel
          profile={profile}
          onUpdateProfile={(updated) => setProfile(updated)}
          language={lang}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </main>

      {/* Persistent Disclaimer Footer */}
      <footer className="border-t border-slate-200 bg-white py-2.5 px-4 text-center text-[11px] text-slate-500">
        <div className="max-w-4xl mx-auto">
          <p>{t.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
