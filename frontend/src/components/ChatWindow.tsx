import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, RotateCcw, Tractor, GraduationCap, 
  HeartPulse, ShieldCheck, CheckCircle2,
  Lock, ArrowRight, MessageSquare
} from 'lucide-react';
import type { ChatMessage, CitizenProfile, SupportedLanguage, MemoryProposal } from '../types';
import { MessageBubble } from './MessageBubble';
import { VoiceButton } from './VoiceButton';
import { sendChatMessage, resetSessionProfile } from '../lib/api';
import { MemoryProposalToast } from './MemoryProposalToast';

interface ChatWindowProps {
  language: SupportedLanguage;
  profile: Partial<CitizenProfile>;
  onProfileUpdate: (profile: Partial<CitizenProfile>) => void;
  userId?: string | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  language,
  onProfileUpdate,
  userId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [pendingProposals, setPendingProposals] = useState<MemoryProposal[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    en: {
      placeholder: 'Ask about government schemes, eligibility, or benefits...',
      send: 'Send',
      startersHeader: 'Explore Popular Governance Tracks',
      badge: 'Multilingual Civic Intelligence · Official Sources',
      welcomeTitle: 'How can NagrikAI assist you today?',
      welcomeDesc: 'Ask in English, Hindi, or Marathi. Get instant, deterministic eligibility checks grounded directly in verified government gazettes and official portals.',
      analyzing: 'NagrikAI is analyzing policies and verifying criteria...',
      clearChat: 'Clear Chat',
      trust1: 'Deterministic Rules',
      trust2: '12+ Gov Portals',
      trust3: 'Zero Data Sold',
      disclaimer: 'Powered by Authoritative Portal Registry · Grounded in official .gov.in notices',
      cards: [
        {
          icon: Tractor,
          tag: 'Farmers & DBT',
          prompt: 'I am a farmer in Pune with 1.2 hectare land. Am I eligible for PM-KISAN ₹6,000?',
          color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-700 border-emerald-200/80',
          badge: 'PM-KISAN',
        },
        {
          icon: GraduationCap,
          tag: 'Higher Education',
          prompt: 'MahaDBT 100% Tuition & Exam Fee Waiver for OBC / VJNT / SBC students',
          color: 'from-blue-500/10 to-blue-500/5 text-blue-700 border-blue-200/80',
          badge: 'MahaDBT',
        },
        {
          icon: HeartPulse,
          tag: 'Women & Families',
          prompt: 'What are the eligibility criteria for Majhi Ladki Bahin ₹1,500 monthly benefit?',
          color: 'from-rose-500/10 to-rose-500/5 text-rose-700 border-rose-200/80',
          badge: 'Ladki Bahin',
        },
        {
          icon: ShieldCheck,
          tag: 'Health & Security',
          prompt: 'How to apply for Ayushman Bharat PM-JAY ₹5 Lakh cashless health card?',
          color: 'from-violet-500/10 to-violet-500/5 text-violet-700 border-violet-200/80',
          badge: 'Ayushman Bharat',
        },
      ]
    },
    hi: {
      placeholder: 'सरकारी योजनाओं, पात्रता या लाभों के बारे में पूछें...',
      send: 'भेजें',
      startersHeader: 'लोकप्रिय कल्याणकारी योजनाएं',
      badge: 'बहुभाषी नागरिक इंटेलिजेंस · आधिकारिक स्रोत',
      welcomeTitle: 'आज नागरिक AI आपकी क्या सहायता कर सकता है?',
      welcomeDesc: 'हिंदी, मराठी या अंग्रेजी में पूछें। आधिकारिक सरकारी गजट और पोर्टलों के आधार पर तुरंत सटीक पात्रता जांच प्राप्त करें।',
      analyzing: 'नागरिक AI नियमों की पुष्टि कर रहा है...',
      clearChat: 'चैट साफ़ करें',
      trust1: 'निश्चयात्मक नियम',
      trust2: '12+ सरकारी पोर्टल',
      trust3: 'डेटा नहीं बेचा जाता',
      disclaimer: 'आधिकारिक पोर्टल रजिस्ट्री द्वारा संचालित · आधिकारिक .gov.in सूचनाओं पर आधारित',
      cards: [
        {
          icon: Tractor,
          tag: 'किसान कल्याण',
          prompt: 'मैं पुणे का किसान हूँ, 1.2 हेक्टेयर जमीन है। क्या मुझे PM-KISAN ₹6,000 मिलेगा?',
          color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-700 border-emerald-200/80',
          badge: 'पीएम-किसान',
        },
        {
          icon: GraduationCap,
          tag: 'उच्च शिक्षा',
          prompt: 'महाडीबीटी ओबीसी / वीजेएनटी छात्रों के लिए 100% शिक्षण एवं परीक्षा शुल्क माफी',
          color: 'from-blue-500/10 to-blue-500/5 text-blue-700 border-blue-200/80',
          badge: 'महाडीबीटी',
        },
        {
          icon: HeartPulse,
          tag: 'महिला कल्याण',
          prompt: 'माझी लाडकी बहीण योजना ₹1,500 प्रति माह के लिए आवश्यक पात्रता क्या है?',
          color: 'from-rose-500/10 to-rose-500/5 text-rose-700 border-rose-200/80',
          badge: 'लाडकी बहीण',
        },
        {
          icon: ShieldCheck,
          tag: 'स्वास्थ्य सुरक्षा',
          prompt: 'आयुष्मान भारत ₹5 लाख कैशलेस स्वास्थ्य कार्ड के लिए कैसे आवेदन करें?',
          color: 'from-violet-500/10 to-violet-500/5 text-violet-700 border-violet-200/80',
          badge: 'आयुष्मान भारत',
        },
      ]
    },
    mr: {
      placeholder: 'शासकीय योजना, पात्रता किंवा लाभांबद्दल विचारा...',
      send: 'पाठवा',
      startersHeader: 'लोकप्रिय शासकीय योजना',
      badge: 'बहुभाषिक नागरी गुप्तचर · अधिकृत स्रोत',
      welcomeTitle: 'नागरिक AI आज आपली काय मदत करू शकते?',
      welcomeDesc: 'मराठी, हिंदी किंवा इंग्रजीत विचारा. अधिकृत सरकारी राजपत्रांच्या आधारे तात्काळ व अचूक पात्रता पडताळणी मिळवा.',
      analyzing: 'नागरिक AI नियमांची पडताळणी करत आहे...',
      clearChat: 'चॅट साफ करा',
      trust1: 'अचूक नियम पडताळणी',
      trust2: '12+ अधिकृत पोर्टल',
      trust3: 'डेटा सुरक्षित',
      disclaimer: 'अधिकृत पोर्टल नोंदणीद्वारे समर्थित · अधिकृत .gov.in अधिसूचनेवर आधारित',
      cards: [
        {
          icon: Tractor,
          tag: 'शेतकरी कल्याण',
          prompt: 'मी पुण्याचा शेतकरी आहे, 1.2 हेक्टर जमीन आहे. मला PM-KISAN ₹6,000 मिळतील का?',
          color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-700 border-emerald-200/80',
          badge: 'पीएम-किसान',
        },
        {
          icon: GraduationCap,
          tag: 'उच्च शिक्षण',
          prompt: 'महाडीबीटी OBC / VJNT / SBC विद्यार्थ्यांसाठी 100% शिक्षण व परीक्षा शुल्क सवलत',
          color: 'from-blue-500/10 to-blue-500/5 text-blue-700 border-blue-200/80',
          badge: 'महाडीबीटी',
        },
        {
          icon: HeartPulse,
          tag: 'महिला व कुटुंब',
          prompt: 'मुख्यमंत्री माझी लाडकी बहीण योजना ₹1,500 प्रति महिना अर्ज कसा करावा?',
          color: 'from-rose-500/10 to-rose-500/5 text-rose-700 border-rose-200/80',
          badge: 'लाडकी बहीण',
        },
        {
          icon: ShieldCheck,
          tag: 'आरोग्य संरक्षण',
          prompt: 'आयुष्मान भारत ₹5 लाख कॅशलेस आरोग्य कार्डसाठी पात्रता निकष काय आहेत?',
          color: 'from-violet-500/10 to-violet-500/5 text-violet-700 border-violet-200/80',
          badge: 'आयुष्मान भारत',
        },
      ]
    },
  }[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await sendChatMessage(sessionId, text.trim(), language, userId);

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: response.language,
        schemes: response.schemes,
        eligibility: response.eligibility,
        citations: response.citations,
        clarifying_question: response.clarifying_question,
        memory_proposals: response.memory_proposals,
        explanation: response.explanation,
        usedMemory: (response.explanation?.memory_fields_used?.length ?? 0) > 0,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.profile) {
        onProfileUpdate(response.profile);
      }
      if (response.memory_proposals && response.memory_proposals.length > 0 && userId) {
        setPendingProposals(response.memory_proposals);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: 'Sorry, an error occurred while connecting to NagrikAI backend. Please ensure the server is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    await resetSessionProfile(sessionId);
    setMessages([]);
    setPendingProposals([]);
    // Do not wipe user's verified citizen profile on chat clear
  };

  return (
    <div className="h-full flex-1 flex flex-col max-w-5xl w-full mx-auto p-3 sm:p-5 font-sans min-h-0">
      
      {/* Top action / status bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800">NagrikAI Civic Intelligence Copilot</span>
          <span className="hidden sm:inline-block text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-semibold">
            Real-Time Grounded
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs text-slate-600 transition-all shadow-2xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.clearChat}</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="py-4 sm:py-6 flex flex-col items-center justify-center text-center">
            
            {/* Logo orb with ambient glow */}
            <div className="relative mb-5 group">
              <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all" />
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-300/80 p-1 bg-slate-900 flex items-center justify-center">
                <img src="/logo.png" alt="NagrikAI Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
            </div>

            {/* Pill */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full mb-3 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {t.badge}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              {t.welcomeTitle}
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mb-7 leading-relaxed">
              {t.welcomeDesc}
            </p>

            {/* Trust feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-600 mb-8">
              <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {t.trust1}
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t.trust2}
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                {t.trust3}
              </span>
            </div>

            {/* 4 Interactive Sector Cards in 2x2 Grid */}
            <div className="w-full max-w-3xl text-left">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t.startersHeader}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Click any to ask instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.cards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(card.prompt)}
                      className={`p-4 rounded-2xl border bg-gradient-to-br ${card.color} hover:shadow-md hover:scale-[1.01] transition-all text-left flex flex-col justify-between group cursor-pointer`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center">
                            <Icon className="w-4 h-4 text-slate-800" />
                          </div>
                          <span className="text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded-md shadow-2xs uppercase tracking-wide">
                            {card.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mb-1">{card.tag}</div>
                        <p className="text-xs text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                          "{card.prompt}"
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-700 group-hover:underline">Ask Copilot</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {loading && (
          <div className="flex items-center space-x-3 text-xs text-slate-600 py-3 px-3 bg-white/80 rounded-xl border border-slate-200/80 shadow-2xs max-w-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
            <span className="font-medium">{t.analyzing}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Memory Proposal Toast */}
      {pendingProposals.length > 0 && userId && (
        <MemoryProposalToast
          proposals={pendingProposals}
          language={language}
          onDismissAll={() => setPendingProposals([])}
          onProposalHandled={(key) => setPendingProposals((prev) => prev.filter((p) => p.key !== key))}
        />
      )}

      {/* Bottom Input Area */}
      <div className="pt-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 bg-white rounded-2xl border-2 border-slate-200/90 p-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all"
        >
          <div className="pl-2 text-slate-400">
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 px-2 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
            disabled={loading}
          />
          <VoiceButton
            language={language}
            onTranscript={(spokenText) => {
              setInputText(spokenText);
              handleSend(spokenText);
            }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{t.send}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-2">
          {t.disclaimer}
        </p>
      </div>

    </div>
  );
};
