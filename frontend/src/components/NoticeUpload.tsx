import React, { useState, useRef } from 'react';
import { 
  FileText, Upload, Loader2, AlertCircle, CheckCircle2, 
  ChevronDown, ChevronUp, X, Sparkles, Calendar, Users, 
  BookOpen, ShieldCheck, Check
} from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface NoticeResult {
  summary: string;
  key_points: string[];
  affected_groups: string[];
  deadlines: string[];
  language_used: string;
  citations: { page: number; text_preview: string }[];
}

interface NoticeUploadProps {
  language: SupportedLanguage;
}

const MAX_FILE_MB = 10;

export const NoticeUpload: React.FC<NoticeUploadProps> = ({ language }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NoticeResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showCitations, setShowCitations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      badge: 'Gazette & GR Intelligence · OCR Enabled',
      title: 'Government Notice & Circular Explainer',
      subtitle: 'Upload complex government resolutions, gazette notifications, or ministry circulars in English, Hindi, or Marathi to get an instant plain-language breakdown.',
      dropzone: 'Drop your notice file here, or browse files',
      dropzoneSmall: 'Supports PDF, JPG, PNG · Max 10 MB · Up to 30 pages',
      analyzing: 'Analyzing notice with PyMuPDF OCR & Gazette Engine...',
      summary: 'Executive Summary',
      keyPoints: 'Key Policy Decisions',
      affectedGroups: 'Who is Affected?',
      deadlines: 'Deadlines & Key Dates',
      citations: 'Page References & Evidence',
      showCitations: 'View Page-by-Page Citations',
      hideCitations: 'Hide Page Citations',
      page: 'Page',
      clearBtn: 'Upload Another Circular',
      error: 'Processing Error',
      unsupportedType: 'Only PDF, JPG, and PNG files are accepted.',
      fileTooLarge: `File must be under ${MAX_FILE_MB} MB.`,
      noDeadlines: 'No specific application deadline or cutoff mentioned.',
      noGroups: 'General public / all eligible citizens.',
      capabilities: [
        {
          icon: BookOpen,
          title: 'Official Gazette & GR Parsing',
          desc: 'Trained on Maharashtra Government Resolutions (शासन निर्णय) and Central Ministry gazettes.',
        },
        {
          icon: ShieldCheck,
          title: 'Deterministic Citations',
          desc: 'Every key takeaway is backed by exact page and clause numbers to prevent hallucinations.',
        },
        {
          icon: Calendar,
          title: 'Deadlines & Criteria Tagging',
          desc: 'Instantly identifies cutoff dates, income ceilings, and required documents.',
        },
      ]
    },
    hi: {
      badge: 'सरकारी राजपत्र व परिपत्रक विश्लेषक · OCR सक्षम',
      title: 'सरकारी नोटिस एवं परिपत्र विश्लेषक',
      subtitle: 'सरकारी परिपत्र, राजपत्र अधिसूचना या नीति आदेश अपलोड करें और हिंदी, मराठी या अंग्रेजी में सरल विश्लेषण प्राप्त करें।',
      dropzone: 'यहाँ अपनी नोटिस फाइल छोड़ें या ब्राउज़ करें',
      dropzoneSmall: 'PDF, JPG, PNG समर्थित · अधिकतम 10 MB · अधिकतम 30 पृष्ठ',
      analyzing: 'PyMuPDF और राजपत्र इंजन द्वारा विश्लेषण हो रहा है...',
      summary: 'कार्यकारी सारांश',
      keyPoints: 'मुख्य नीतिगत निर्णय',
      affectedGroups: 'यह किन नागरिकों पर लागू होता है?',
      deadlines: 'महत्वपूर्ण समयसीमाएँ व तिथियाँ',
      citations: 'पृष्ठ संदर्भ एवं प्रमाण',
      showCitations: 'पृष्ठ संदर्भ देखें',
      hideCitations: 'पृष्ठ संदर्भ छुपाएं',
      page: 'पृष्ठ',
      clearBtn: 'अन्य परिपत्र अपलोड करें',
      error: 'त्रुटि',
      unsupportedType: 'केवल PDF, JPG और PNG फ़ाइलें स्वीकार की जाती हैं।',
      fileTooLarge: `फ़ाइल ${MAX_FILE_MB} MB से कम होनी चाहिए।`,
      noDeadlines: 'कोई विशेष समयसीमा या अंतिम तिथि उल्लेखित नहीं है।',
      noGroups: 'सभी नागरिक (सामान्य अधिसूचना)।',
      capabilities: [
        {
          icon: BookOpen,
          title: 'राजपत्र व जीआर पार्सिंग',
          desc: 'महाराष्ट्र शासन निर्णय व केंद्रीय मंत्रालय परिपत्रों के लिए विशेष रूप से डिज़ाइन किया गया।',
        },
        {
          icon: ShieldCheck,
          title: 'सटीक पृष्ठ संदर्भ',
          desc: 'प्रत्येक निष्कर्ष का सत्यापन मूल पृष्ठ और खंड संख्या से किया जाता है।',
        },
        {
          icon: Calendar,
          title: 'समयसीमा व पात्रता पहचान',
          desc: 'अंतिम तिथियां, आय सीमा और आवश्यक दस्तावेज स्वचालित रूप से निकाले जाते हैं।',
        },
      ]
    },
    mr: {
      badge: 'शासकीय राजपत्र व जीआर विश्लेषक · OCR सक्षम',
      title: 'शासकीय नोटीस व परिपत्रक स्पष्टीकरण',
      subtitle: 'शासकीय परिपत्रके (GR), राजपत्र अधिसूचना किंवा धोरण आदेश अपलोड करा आणि सोप्या मराठी, हिंदी किंवा इंग्रजीत समजून घ्या.',
      dropzone: 'येथे आपली नोटीस फाइल टाका किंवा निवडा',
      dropzoneSmall: 'PDF, JPG, PNG समर्थित · जास्तीत जास्त 10 MB · 30 पानांपर्यंत',
      analyzing: 'PyMuPDF आणि राजपत्र इंजिनद्वारे विश्लेषण सुरू आहे...',
      summary: 'कार्यकारी सारांश',
      keyPoints: 'महत्त्वाचे धोरणात्मक मुद्दे',
      affectedGroups: 'हे कोणाला लागू होते?',
      deadlines: 'महत्त्वाच्या तारखा व मुदती',
      citations: 'पान संदर्भ व पुरावे',
      showCitations: 'पान संदर्भ पहा',
      hideCitations: 'पान संदर्भ लपवा',
      page: 'पान',
      clearBtn: 'दुसरे परिपत्रक अपलोड करा',
      error: 'त्रुटी',
      unsupportedType: 'केवळ PDF, JPG आणि PNG फाइल्स स्वीकारल्या जातात.',
      fileTooLarge: `फाइल ${MAX_FILE_MB} MB पेक्षा कमी असावी.`,
      noDeadlines: 'कोणतीही विशिष्ट मुदत किंवा अंतिम तारीख नमूद केलेली नाही.',
      noGroups: 'सर्व नागरिक (सामान्य परिपत्रक).',
      capabilities: [
        {
          icon: BookOpen,
          title: 'महाराष्ट्र शासन निर्णय (GR)',
          desc: 'महाराष्ट्र शासनाचे GR आणि केंद्र सरकारच्या राजपत्रांच्या विश्लेषणासाठी अनुकूल.',
        },
        {
          icon: ShieldCheck,
          title: 'निश्चयात्मक पान संदर्भ',
          desc: 'प्रत्येक निष्कर्ष मूळ दस्तऐवजाच्या पान व परिच्छेदाशी जोडलेला असतो.',
        },
        {
          icon: Calendar,
          title: 'मुदती व निकष पडताळणी',
          desc: 'अर्जाची शेवटची तारीख, उत्पन्न मर्यादा आणि आवश्यक कागदपत्रे तात्काळ दाखवतो.',
        },
      ]
    },
  }[language];

  const isAcceptedType = (file: File): boolean => {
    return ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
  };

  const processFile = async (file: File) => {
    setError(null);
    if (!isAcceptedType(file)) {
      setError(t.unsupportedType);
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(t.fileTooLarge);
      return;
    }

    setFileName(file.name);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const res = await fetch('/api/notice/explain', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data: NoticeResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze notice');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setFileName(null);
    setShowCitations(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{t.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-white">
            {t.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Upload dropzone — when no result */}
      {!result && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all select-none relative group ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                : loading
                ? 'border-slate-300 bg-slate-50 cursor-not-allowed'
                : 'border-slate-300/90 hover:border-emerald-500 hover:bg-emerald-50/40 bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={handleFileInput}
              disabled={loading}
            />

            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">{t.analyzing}</p>
                  {fileName && (
                    <p className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 px-3 py-1 rounded-lg">
                      {fileName}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 shadow-xs group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">{t.dropzone}</h3>
                <p className="text-xs text-slate-500 max-w-sm">{t.dropzoneSmall}</p>

                {/* Format chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">PDF</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">JPEG / JPG</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">PNG</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">Max 10 MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Capabilities 3-Card Grid */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
              Why use NagrikAI Notice Explainer:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {t.capabilities.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">{c.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs text-rose-700 shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <div>
            <span className="font-bold text-sm block mb-0.5">{t.error}</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Result view */}
      {result && (
        <div className="space-y-5">
          {/* File info bar + clear button */}
          <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-200 rounded-2xl px-4 py-3 shadow-2xs">
            <div className="flex items-center space-x-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block truncate max-w-sm sm:max-w-md">{fileName}</span>
                <span className="text-[10px] text-emerald-700">Language identified: {result.language_used || 'Standard'}</span>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.clearBtn}</span>
            </button>
          </div>

          {/* Summary Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.summary}</h3>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">{result.summary}</p>
          </div>

          {/* Key Points */}
          {result.key_points.length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.keyPoints}</h3>
              </div>
              <div className="space-y-2.5">
                {result.key_points.map((point, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-sm text-slate-800">
                    <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected Groups & Deadlines side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50/80 to-amber-50/30 border border-amber-200/70 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t.affectedGroups}</h3>
              </div>
              {result.affected_groups.length > 0 ? (
                <ul className="space-y-1.5">
                  {result.affected_groups.map((g, i) => (
                    <li key={i} className="text-xs text-amber-950 flex items-center gap-2 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-800 italic">{t.noGroups}</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-rose-50/80 to-rose-50/30 border border-rose-200/70 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-800">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider">{t.deadlines}</h3>
              </div>
              {result.deadlines.length > 0 ? (
                <ul className="space-y-1.5">
                  {result.deadlines.map((d, i) => (
                    <li key={i} className="text-xs text-rose-950 font-bold flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-rose-200/60">
                      <span>📅</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-rose-800 italic">{t.noDeadlines}</p>
              )}
            </div>
          </div>

          {/* Page citations collapsible */}
          {result.citations.length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="w-full flex items-center justify-between px-5 py-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>{showCitations ? t.hideCitations : t.showCitations}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600">
                    {result.citations.length} pages
                  </span>
                </div>
                {showCitations ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showCitations && (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto px-2 pb-2">
                  {result.citations.map((c, i) => (
                    <div key={i} className="p-3 flex items-start space-x-3 text-xs">
                      <span className="shrink-0 px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                        {t.page} {c.page}
                      </span>
                      <span className="text-xs text-slate-600 leading-relaxed font-serif bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-1">
                        "{c.text_preview}"
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
