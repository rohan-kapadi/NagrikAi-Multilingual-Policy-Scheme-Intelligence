import React, { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface ListenButtonProps {
  text: string;
  language?: SupportedLanguage | string;
}

export const ListenButton: React.FC<ListenButtonProps> = ({ text, language = 'en' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const t = {
    en: {
      listen: 'Listen',
      stop: 'Stop listening',
      notSupported: 'Audio playback not supported in this browser.',
    },
    hi: {
      listen: 'सुनें',
      stop: 'रोकें',
      notSupported: 'इस ब्राउज़र में ऑडियो प्लेबैक समर्थित नहीं है।',
    },
    mr: {
      listen: 'ऐका',
      stop: 'थांबवा',
      notSupported: 'या ब्राउझरमध्ये ऑडिओ प्लेबॅक समर्थित नाही.',
    },
  }[language as SupportedLanguage] || {
    listen: 'Listen',
    stop: 'Stop listening',
    notSupported: 'Audio playback not supported in this browser.',
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getCleanSpeechText = (raw: string): string => {
    // Strip markdown formatting, symbols, bullet points, asterisks, URLs
    return raw
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // [link text](url) -> link text
      .replace(/https?:\/\/\S+/g, '') // remove urls
      .replace(/[*_#`~>]/g, '') // strip markdown tokens
      .replace(/[📌✅❌❓📄⚠️]/g, '') // strip emojis
      .replace(/[-•]\s+/g, '') // strip list bullets
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getVoice = (lang: string): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();

    const targetLang =
      lang === 'hi'
        ? 'hi-IN'
        : lang === 'mr'
        ? 'mr-IN'
        : 'en-IN';

    // 1. Exact BCP-47 match
    let match = voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase());
    if (match) return match;

    // 2. Prefix match (e.g. 'mr', 'hi', 'en')
    match = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (match) return match;

    // 3. For Marathi, Hindi voice is a high-quality phonetic fallback if Marathi TTS is not installed
    if (lang === 'mr') {
      const hiFallback = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
      if (hiFallback) return hiFallback;
    }

    return null;
  };

  const handleToggle = () => {
    if (!isSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any other playing utterance

    const cleanText = getCleanSpeechText(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.lang = langCode;

    const voice = getVoice(language);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.95; // slightly slower for better public clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isSpeaking ? t.stop : t.listen}
      title={isSpeaking ? t.stop : t.listen}
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
        isSpeaking
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 animate-pulse'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
      }`}
    >
      {isSpeaking ? (
        <>
          <Square className="w-3 h-3 fill-current" />
          <span>{t.stop}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3 h-3 text-emerald-600" />
          <span>{t.listen}</span>
        </>
      )}
    </button>
  );
};
