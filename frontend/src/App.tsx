import { useState, useEffect } from 'react';
import { checkHealth } from './lib/api';
import type { HealthStatus } from './lib/api';
import type { CitizenProfile, SupportedLanguage } from './types';
import { loadAuth, clearAuth, saveAuth } from './lib/auth';
import type { User } from './lib/auth';
import { ChatWindow } from './components/ChatWindow';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProfilePanel } from './components/ProfilePanel';
import { NoticeUpload } from './components/NoticeUpload';
import { NagrikVault } from './components/NagrikVault';
import { AuthModal } from './components/AuthModal';
import { MemoryPanel } from './components/MemoryPanel';
import { LandingPage } from './pages/LandingPage';
import {
  UserCheck, CheckCircle2, AlertCircle, MessageSquare,
  FileText, ShieldCheck, Brain, LogOut, LogIn
} from 'lucide-react';

type ActiveTab = 'chat' | 'notice' | 'vault';
type AppView = 'landing' | 'app';

export default function App() {
  // ── Auth & Session Restoration ─────────────────────────
  const [user, setUser] = useState<User | null>(() => {
    const { user: savedUser, token } = loadAuth();
    return savedUser && token ? savedUser : null;
  });

  // ── Routing (Restores 'app' view immediately if user is already logged in) ──
  const [view, setView] = useState<AppView>(() => {
    const { user: savedUser, token } = loadAuth();
    return savedUser && token ? 'app' : 'landing';
  });

  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'signup' }>({
    open: false,
    tab: 'login',
  });

  // ── App state ─────────────────────────────────────────
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lang, setLang] = useState<SupportedLanguage>(() => {
    const { user: savedUser } = loadAuth();
    if (savedUser?.preferred_language && ['en', 'hi', 'mr'].includes(savedUser.preferred_language)) {
      return savedUser.preferred_language as SupportedLanguage;
    }
    return 'en';
  });
  const [profile, setProfile] = useState<Partial<CitizenProfile>>({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // ── Health check on entering app ─────────────────────
  useEffect(() => {
    if (view !== 'app') return;
    setHealthLoading(true);
    checkHealth()
      .then((data) => { setHealth(data); setHealthLoading(false); })
      .catch(() => { setHasError(true); setHealthLoading(false); });
  }, [view]);

  const handleAuthSuccess = (u: User, token: string) => {
    setUser(u);
    saveAuth(token, u);
    if (u.preferred_language && ['en', 'hi', 'mr'].includes(u.preferred_language)) {
      setLang(u.preferred_language as SupportedLanguage);
    }
    setView('app');
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setView('landing');
  };

  const collectedFieldsCount = Object.values(profile).filter(
    (v) => v !== null && v !== undefined && v !== ''
  ).length;

  const t = {
    en: {
      title: 'NagrikAI',
      subtitle: 'Multilingual Policy & Scheme Intelligence',
      profileBtn: 'Profile',
      connected: 'Live',
      disconnected: 'Offline',
      disclaimer: 'Disclaimer: NagrikAI is an informational tool. Eligibility decisions are made solely by official government portals and competent authorities. Placeholders marked TODO_VERIFY represent unverified demo data.',
      memory: 'Memory',
      logout: 'Log Out',
      loginBtn: 'Log In',
    },
    hi: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजना एवं नीति मार्गदर्शक',
      profileBtn: 'प्रोफ़ाइल',
      connected: 'लाइव',
      disconnected: 'ऑफ़लाइन',
      disclaimer: 'अस्वीकरण: नागरिक AI केवल सूचनात्मक मार्गदर्शन प्रदान करता है। पात्रता और लाभों पर अंतिम निर्णय केवल आधिकारिक सरकारी पोर्टल और संबंधित प्राधिकरणों द्वारा लिया जाता है।',
      memory: 'मेमोरी',
      logout: 'लॉग आउट',
      loginBtn: 'लॉग इन',
    },
    mr: {
      title: 'नागरिक AI',
      subtitle: 'सरकारी योजना आणि धोरण मार्गदर्शक',
      profileBtn: 'प्रोफाइल',
      connected: 'लाइव्ह',
      disconnected: 'ऑफलाइन',
      disclaimer: 'अस्वीकरण: नागरिक AI केवळ माहितीच्या उद्देशाने आहे. पात्रतेबाबतचा अंतिम निर्णय अधिकृत सरकारी पोर्टलचा असेल.',
      memory: 'मेमरी',
      logout: 'लॉग आउट',
      loginBtn: 'लॉग इन',
    },
  }[lang];

  // ── Landing view ──────────────────────────────────────
  if (view === 'landing') {
    return (
      <>
        <LandingPage
          language={lang}
          onLanguageChange={setLang}
          isLoggedIn={!!user}
          userName={user?.name}
          onGetStarted={() => {
            if (user) setView('app');
            else setAuthModal({ open: true, tab: 'signup' });
          }}
          onLogin={() => {
            if (user) setView('app');
            else setAuthModal({ open: true, tab: 'login' });
          }}
        />
        <AuthModal
          isOpen={authModal.open}
          onClose={() => setAuthModal({ open: false, tab: 'login' })}
          onAuthSuccess={handleAuthSuccess}
          language={lang}
          initialTab={authModal.tab}
        />
      </>
    );
  }

  // ── App view ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <button
            onClick={() => setView('landing')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
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
          </button>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcher currentLanguage={lang} onLanguageChange={setLang} />

            {/* Memory button (Phase 10) */}
            <button
              onClick={() => setIsMemoryOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
              title={t.memory}
            >
              <Brain className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden sm:inline">{t.memory}</span>
            </button>

            {/* Profile button */}
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

            {/* Auth button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:block text-xs text-slate-600 font-medium max-w-24 truncate">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModal({ open: true, tab: 'login' })}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.loginBtn}</span>
              </button>
            )}

            {/* Health pill */}
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-white">
              {healthLoading ? (
                <span className="text-slate-400 animate-pulse">...</span>
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
                {lang === 'hi' ? 'नागरिक वॉल्ट' : lang === 'mr' ? 'नागरिक व्हॉल्ट' : 'NagrikVault'}
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
              userId={user?.id ?? null}
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

        {/* Memory Panel (Phase 10) */}
        <MemoryPanel
          isOpen={isMemoryOpen}
          onClose={() => setIsMemoryOpen(false)}
          language={lang}
          isLoggedIn={!!user}
        />
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        onClose={() => setAuthModal({ open: false, tab: 'login' })}
        onAuthSuccess={handleAuthSuccess}
        language={lang}
        initialTab={authModal.tab}
      />

      {/* Persistent Disclaimer Footer */}
      <footer className="border-t border-slate-200 bg-white py-2.5 px-4 text-center text-[11px] text-slate-500">
        <div className="max-w-4xl mx-auto">
          <p>{t.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
