import React, { useState, useRef } from 'react';
import { FileText, Upload, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';
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
      title: 'Government Notice Explainer',
      subtitle: 'Upload a PDF or image of a government circular, notice, or policy order to get a plain-language explanation.',
      dropzone: 'Drop a PDF or image here, or click to upload',
      dropzoneSmall: 'PDF, JPG, PNG · Max 10 MB · Max 30 pages',
      analyzing: 'Analyzing notice...',
      summary: 'Summary',
      keyPoints: 'Key Points',
      affectedGroups: 'Who is Affected?',
      deadlines: 'Important Dates & Deadlines',
      citations: 'Page References',
      showCitations: 'Show page references',
      hideCitations: 'Hide page references',
      page: 'Page',
      clearBtn: 'Upload Another',
      error: 'Error',
      unsupportedType: 'Only PDF, JPG, and PNG files are accepted.',
      fileTooLarge: `File must be under ${MAX_FILE_MB} MB.`,
      noDeadlines: 'No specific deadlines mentioned.',
      noGroups: 'All citizens (general notice).',
    },
    hi: {
      title: 'सरकारी नोटिस विश्लेषक',
      subtitle: 'सरकारी परिपत्र, नोटिस या नीति आदेश का पीडीएफ या इमेज अपलोड करें और सरल भाषा में समझें।',
      dropzone: 'यहाँ PDF या इमेज छोड़ें, या क्लिक करके अपलोड करें',
      dropzoneSmall: 'PDF, JPG, PNG · अधिकतम 10 MB · अधिकतम 30 पृष्ठ',
      analyzing: 'नोटिस का विश्लेषण हो रहा है...',
      summary: 'सारांश',
      keyPoints: 'मुख्य बिंदु',
      affectedGroups: 'यह किस पर लागू होता है?',
      deadlines: 'महत्वपूर्ण तिथियाँ और समयसीमाएँ',
      citations: 'पृष्ठ संदर्भ',
      showCitations: 'पृष्ठ संदर्भ दिखाएं',
      hideCitations: 'पृष्ठ संदर्भ छुपाएं',
      page: 'पृष्ठ',
      clearBtn: 'दूसरा अपलोड करें',
      error: 'त्रुटि',
      unsupportedType: 'केवल PDF, JPG और PNG फ़ाइलें स्वीकार की जाती हैं।',
      fileTooLarge: `फ़ाइल ${MAX_FILE_MB} MB से कम होनी चाहिए।`,
      noDeadlines: 'कोई विशेष समयसीमा उल्लेखित नहीं।',
      noGroups: 'सभी नागरिक (सामान्य नोटिस)।',
    },
    mr: {
      title: 'शासकीय नोटीस स्पष्टीकरण',
      subtitle: 'शासकीय परिपत्रक, नोटीस किंवा धोरण आदेशाचा PDF किंवा इमेज अपलोड करा आणि सोप्या भाषेत समजून घ्या.',
      dropzone: 'येथे PDF किंवा इमेज टाका, किंवा क्लिक करून अपलोड करा',
      dropzoneSmall: 'PDF, JPG, PNG · जास्तीत जास्त 10 MB · जास्तीत जास्त 30 पाने',
      analyzing: 'नोटीसचे विश्लेषण होत आहे...',
      summary: 'सारांश',
      keyPoints: 'मुख्य मुद्दे',
      affectedGroups: 'हे कोणाला लागू होते?',
      deadlines: 'महत्त्वाच्या तारखा आणि मुदती',
      citations: 'पृष्ठ संदर्भ',
      showCitations: 'पृष्ठ संदर्भ दाखवा',
      hideCitations: 'पृष्ठ संदर्भ लपवा',
      page: 'पान',
      clearBtn: 'दुसरे अपलोड करा',
      error: 'त्रुटी',
      unsupportedType: 'केवळ PDF, JPG आणि PNG फाइल्स स्वीकारल्या जातात.',
      fileTooLarge: `फाइल ${MAX_FILE_MB} MB पेक्षा कमी असावी.`,
      noDeadlines: 'कोणतीही विशिष्ट मुदत नमूद केलेली नाही.',
      noGroups: 'सर्व नागरिक (सामान्य नोटीस).',
    },
  }[language];

  const isAcceptedType = (file: File): boolean => {
    return ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
  };

  const processFile = async (file: File) => {
    setError(null);
    setResult(null);

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
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data: NoticeResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to process notice.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setFileName(null);
    setShowCitations(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 font-sans">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center space-x-2 mb-1">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800 text-base">{t.title}</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{t.subtitle}</p>
      </div>

      {/* Upload dropzone — hidden when result is shown */}
      {!result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50'
              : loading
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'
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
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-medium text-emerald-700">{t.analyzing}</p>
              {fileName && <p className="text-xs text-slate-400">{fileName}</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">{t.dropzone}</p>
              <p className="text-xs text-slate-400">{t.dropzoneSmall}</p>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <span className="font-semibold">{t.error}: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Result view */}
      {result && (
        <div className="space-y-4">
          {/* File info + clear */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <div className="flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold truncate max-w-xs">{fileName}</span>
            </div>
            <button
              onClick={handleClear}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.clearBtn}</span>
            </button>
          </div>

          {/* Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t.summary}</h3>
            <p className="text-sm text-slate-800 leading-relaxed">{result.summary}</p>
          </div>

          {/* Key Points */}
          {result.key_points.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t.keyPoints}</h3>
              <ul className="space-y-1.5">
                {result.key_points.map((point, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm text-slate-800">
                    <span className="mt-1 w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Affected Groups & Deadlines side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">{t.affectedGroups}</h3>
              {result.affected_groups.length > 0 ? (
                <ul className="space-y-1">
                  {result.affected_groups.map((g, i) => (
                    <li key={i} className="text-xs text-amber-900">• {g}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-700 italic">{t.noGroups}</p>
              )}
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wide mb-2">{t.deadlines}</h3>
              {result.deadlines.length > 0 ? (
                <ul className="space-y-1">
                  {result.deadlines.map((d, i) => (
                    <li key={i} className="text-xs text-rose-900 font-medium">📅 {d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-rose-700 italic">{t.noDeadlines}</p>
              )}
            </div>
          </div>

          {/* Page citations collapsible */}
          {result.citations.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <span>{showCitations ? t.hideCitations : t.showCitations} ({result.citations.length})</span>
                {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showCitations && (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {result.citations.map((c, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-start space-x-3">
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {t.page} {c.page}
                      </span>
                      <span className="text-xs text-slate-600 leading-relaxed">{c.text_preview}</span>
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
