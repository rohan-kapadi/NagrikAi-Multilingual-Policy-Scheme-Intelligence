import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface VoiceButtonProps {
  language: SupportedLanguage;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  language,
  onTranscript,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Map app languages to BCP-47 locale tags
  const getLocale = (lang: SupportedLanguage): string => {
    switch (lang) {
      case 'hi':
        return 'hi-IN';
      case 'mr':
        return 'mr-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  const t = {
    en: {
      start: 'Speak query (Mic)',
      listening: 'Listening...',
      stop: 'Stop listening',
      notSupported: 'Voice recognition is not supported in this browser. Please use Chrome/Edge.',
      error: 'Microphone access denied or error occurred.',
    },
    hi: {
      start: 'बोलकर पूछें (माइक)',
      listening: 'सुन रहा हूँ...',
      stop: 'रोकें',
      notSupported: 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया Chrome/Edge का उपयोग करें।',
      error: 'माइक्रोफ़ोन अनुमति अस्वीकृत या त्रुटि हुई।',
    },
    mr: {
      start: 'बोलून विचारा (माइक)',
      listening: 'ऐकत आहे...',
      stop: 'थांबवा',
      notSupported: 'या ब्राउझरमध्ये व्हॉइस इनपुट समर्थित नाही. कृपया Chrome/Edge वापरा.',
      error: 'मायक्रोफोन परवानगी नाकारली किंवा त्रुटी आली.',
    },
  }[language];

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(t.notSupported);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = getLocale(language);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          onTranscript(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(t.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorMessage(t.error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          type="button"
          disabled
          aria-label={t.notSupported}
          className="p-2 rounded-xl text-slate-300 cursor-not-allowed bg-slate-100"
          title={t.notSupported}
        >
          <MicOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        aria-label={isListening ? t.stop : t.start}
        title={isListening ? t.stop : t.start}
        className={`p-2 rounded-xl transition-all shadow-xs flex items-center justify-center ${
          isListening
            ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Floating listening indicator banner */}
      {isListening && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-lg flex items-center space-x-1.5 z-20">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>{t.listening}</span>
        </div>
      )}

      {/* Error alert tooltip */}
      {errorMessage && (
        <div className="absolute bottom-full mb-2 right-0 whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200 text-[11px] p-2 rounded-lg shadow-md flex items-center space-x-1 z-20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-1 text-rose-500 font-bold hover:text-rose-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
