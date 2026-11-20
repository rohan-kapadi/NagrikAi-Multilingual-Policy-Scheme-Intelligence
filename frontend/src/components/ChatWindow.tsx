import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
import type { ChatMessage, CitizenProfile, SupportedLanguage } from '../types';
import { MessageBubble } from './MessageBubble';
import { sendChatMessage, resetSessionProfile } from '../lib/api';

interface ChatWindowProps {
  language: SupportedLanguage;
  profile: Partial<CitizenProfile>;
  onProfileUpdate: (profile: Partial<CitizenProfile>) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  language,
  onProfileUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    en: {
      placeholder: 'Ask about government schemes, eligibility, or benefits...',
      send: 'Send',
      startersHeader: 'Try asking:',
      starter1: 'I am a farmer in Pune with 1.2 hectare land',
      starter2: 'College student with family income 1.8 lakh, can I get a scholarship?',
      starter3: 'Does PM Kisan scheme provide free tractors to farmers?',
      clearChat: 'Reset Chat',
      welcomeTitle: 'Welcome to NagrikAI',
      welcomeDesc: 'Your personal civic intelligence guide for Indian government schemes and welfare policies.',
    },
    hi: {
      placeholder: 'सरकारी योजनाओं, पात्रता या लाभों के बारे में पूछें...',
      send: 'भेजें',
      startersHeader: 'उदाहरण प्रश्न:',
      starter1: 'मैं पुणे का किसान हूँ, 1.2 हेक्टेयर जमीन है',
      starter2: '12वीं पास छात्र हूँ, पारिवारिक आय 1.8 लाख है, क्या मुझे छात्रवृत्ति मिलेगी?',
      starter3: 'क्या पीएम किसान योजना में किसानों को मुफ्त ट्रैक्टर मिलता है?',
      clearChat: 'रीसेट करें',
      welcomeTitle: 'नागरिक AI में आपका स्वागत है',
      welcomeDesc: 'सरकारी योजनाओं, पात्रता और नीतियों के लिए आपका नागरिक मार्गदर्शक।',
    },
    mr: {
      placeholder: 'सरकारी योजना, पात्रता किंवा लाभांबद्दल विचारा...',
      send: 'पाठवा',
      startersHeader: 'उदाहरणे:',
      starter1: 'मी पुण्याचा शेतकरी आहे, माझ्याकडे 1.2 हेक्टर जमीन आहे',
      starter2: 'मी 12वी उत्तीर्ण विद्यार्थी आहे, कौटुंबिक उत्पन्न 1.8 लाख आहे, मला शिष्यवृत्ती मिळेल का?',
      starter3: 'पीएम किसान योजनेअंतर्गत मोफत ट्रॅक्टर मिळतो का?',
      clearChat: 'रीसेट करा',
      welcomeTitle: 'नागरिक AI मध्ये आपले स्वागत आहे',
      welcomeDesc: 'शासकीय योजना आणि कल्याणकारी धोरणांसाठी आपला वैयक्तिक मार्गदर्शक.',
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
      const response = await sendChatMessage(sessionId, text.trim(), language);

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
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.profile) {
        onProfileUpdate(response.profile);
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
    onProfileUpdate({});
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)] max-w-4xl w-full mx-auto p-4 font-sans">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multilingual Civic Pulse</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.clearChat}</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 text-emerald-700 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t.welcomeTitle}</h2>
            <p className="text-sm text-slate-500 max-w-md mb-6">{t.welcomeDesc}</p>

            {/* Quick Starters */}
            <div className="w-full max-w-lg text-left">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                {t.startersHeader}
              </p>
              <div className="space-y-2">
                {[t.starter1, t.starter2, t.starter3].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xs text-xs text-slate-700 transition-all flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <span className="text-slate-400 group-hover:text-emerald-600 font-bold ml-2">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 py-3 pl-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>NagrikAI is analyzing policies and schemes...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 bg-white rounded-2xl border border-slate-300 p-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-hidden bg-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <span>{t.send}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
