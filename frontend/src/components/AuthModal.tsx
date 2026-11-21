import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { signupApi, loginApi, saveAuth } from '../lib/auth';
import type { User as UserType } from '../lib/auth';
import type { SupportedLanguage } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType, token: string) => void;
  language: SupportedLanguage;
  initialTab?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  language,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    en: {
      loginTitle: 'Welcome back',
      signupTitle: 'Create your NagrikAI account',
      loginSub: 'Sign in to access your personalised scheme guide',
      signupSub: 'Free forever. No Aadhaar required.',
      emailLabel: 'Email address',
      nameLabel: 'Your name',
      passwordLabel: 'Password',
      loginBtn: 'Sign In',
      signupBtn: 'Create Account',
      switchToSignup: "Don't have an account? Sign up",
      switchToLogin: 'Already have an account? Sign in',
      loading: 'Please wait...',
    },
    hi: {
      loginTitle: 'वापस स्वागत है',
      signupTitle: 'नागरिक AI अकाउंट बनाएं',
      loginSub: 'अपनी व्यक्तिगत योजना गाइड तक पहुंचें',
      signupSub: 'हमेशा के लिए मुफ्त। आधार की जरूरत नहीं।',
      emailLabel: 'ईमेल पता',
      nameLabel: 'आपका नाम',
      passwordLabel: 'पासवर्ड',
      loginBtn: 'साइन इन करें',
      signupBtn: 'अकाउंट बनाएं',
      switchToSignup: 'अकाउंट नहीं है? साइन अप करें',
      switchToLogin: 'पहले से अकाउंट है? साइन इन करें',
      loading: 'कृपया प्रतीक्षा करें...',
    },
    mr: {
      loginTitle: 'पुन्हा स्वागत आहे',
      signupTitle: 'नागरिक AI खाते तयार करा',
      loginSub: 'आपल्या वैयक्तिक योजना मार्गदर्शकात प्रवेश करा',
      signupSub: 'कायमचे मोफत. आधार आवश्यक नाही.',
      emailLabel: 'ईमेल पत्ता',
      nameLabel: 'आपले नाव',
      passwordLabel: 'पासवर्ड',
      loginBtn: 'साइन इन करा',
      signupBtn: 'खाते तयार करा',
      switchToSignup: 'खाते नाही? साइन अप करा',
      switchToLogin: 'आधीच खाते आहे? साइन इन करा',
      loading: 'कृपया प्रतीक्षा करा...',
    },
  }[language];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result: { token: string; user: UserType };
      if (tab === 'signup') {
        result = await signupApi(email, name, password, language);
      } else {
        result = await loginApi(email, password);
      }
      saveAuth(result.token, result.user);
      onAuthSuccess(result.user, result.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                न
              </div>
              <span className="text-sm font-bold text-emerald-700">NagrikAI</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              {tab === 'login' ? t.loginTitle : t.signupTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tab === 'login' ? t.loginSub : t.signupSub}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 mb-4">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {(['login', 'signup'] as const).map((t_) => (
              <button
                key={t_}
                onClick={() => { setTab(t_); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  tab === t_
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t_ === 'login' ? t.loginBtn : t.signupBtn}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.nameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Rohan Kapadnis"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.emailLabel}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>{t.loading}</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{tab === 'login' ? t.loginBtn : t.signupBtn}</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            <button
              type="button"
              onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-emerald-700 font-semibold hover:underline"
            >
              {tab === 'login' ? t.switchToSignup : t.switchToLogin}
            </button>
          </p>

          {tab === 'signup' && (
            <p className="text-center text-[11px] text-slate-400 leading-relaxed">
              🔒 No Aadhaar or government ID collected. Your data stays yours.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
