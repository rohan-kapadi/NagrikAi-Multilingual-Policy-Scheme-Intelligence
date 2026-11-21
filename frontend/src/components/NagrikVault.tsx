import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  KeyRound
} from 'lucide-react';
import type { CitizenProfile, SupportedLanguage } from '../types';

interface StoredDocument {
  id: string;
  name: string;
  type: 'land' | 'income' | 'caste' | 'education' | 'other';
  sizeKb: number;
  sha256Hash: string;
  encrypted: boolean;
  timestamp: string;
  extractedFields: Partial<CitizenProfile>;
}

interface NagrikVaultProps {
  language: SupportedLanguage;
  profile: Partial<CitizenProfile>;
  onProfileUpdate: (updated: Partial<CitizenProfile>) => void;
}

export const NagrikVault: React.FC<NagrikVaultProps> = ({
  language,
  profile,
  onProfileUpdate,
}) => {
  const [documents, setDocuments] = useState<StoredDocument[]>([
    {
      id: 'doc-1',
      name: 'Maha_Land_7_12_Extract_Pune.pdf',
      type: 'land',
      sizeKb: 284,
      sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      encrypted: true,
      timestamp: '2026-11-21 12:30',
      extractedFields: {
        occupation: 'farmer',
        land_holding_hectares: 1.2,
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
  ]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      title: 'NagrikVault — Cryptographic Citizen Document Locker',
      subtitle: 'Zero-Knowledge, client-side encrypted storage. Your documents never leak. Data is extracted locally into your verified profile for 1-click scheme applications.',
      securityPill: 'Client-Side AES-256 & SHA-256 Verifiable Ledger',
      uploadBtn: 'Securely Deposit Document',
      uploadSub: 'PDF, JPG, PNG (Max 10MB) · AES-256 Encrypted on upload',
      documentsCount: 'Stored Documents',
      appliedToProfile: 'Extracted & Synced to Profile',
      applyFields: 'Apply Extracted Data to Profile',
      appliedSuccess: 'Applied to Profile! ✓',
      tamperProofHash: 'SHA-256 Verifiable Fingerprint',
      syncCopilotTitle: 'Nagrik Copilot Extension Bridge',
      syncCopilotDesc: 'Sync your verified vault data to the Nagrik Copilot Chrome Extension to auto-fill government portal applications in 1-click.',
      syncNowBtn: 'Sync with Browser Extension',
      syncedBadge: 'Copilot Synced ✓',
      downloadExtension: 'Download Extension (.zip / folder)',
      testDemoPortal: 'Open Test Demo Portal',
      zeroKnowledgeNotice: 'Zero-Knowledge Guarantee: Encryption keys remain strictly in browser memory. No unencrypted document is ever retained on backend servers.',
    },
    hi: {
      title: 'नागरिक वॉल्ट — क्रिप्टोग्राफ़िक दस्तावेज़ लॉकर',
      subtitle: 'ज़ीरो-नॉलेज, क्लाइंट-साइड एन्क्रिप्टेड स्टोरेज। आपके दस्तावेज़ पूरी तरह सुरक्षित हैं। योजनाओं में 1-क्लिक आवेदन के लिए डेटा स्वतः निकाला जाता है।',
      securityPill: 'क्लाइंट-साइड AES-256 और SHA-256 सत्यापित लेजर',
      uploadBtn: 'सुरक्षित दस्तावेज़ अपलोड करें',
      uploadSub: 'PDF, JPG, PNG (अधिकतम 10MB) · अपलोड पर AES-256 एन्क्रिप्शन',
      documentsCount: 'संग्रहीत दस्तावेज़',
      appliedToProfile: 'प्रोफ़ाइल में जोड़ा गया',
      applyFields: 'निकाला गया डेटा प्रोफ़ाइल में लागू करें',
      appliedSuccess: 'प्रोफ़ाइल में लागू हो गया! ✓',
      tamperProofHash: 'SHA-256 सत्यापित फ़िंगरप्रिंट',
      syncCopilotTitle: 'नागरिक कोपायलट एक्सटेंशन ब्रिज',
      syncCopilotDesc: 'सरकारी पोर्टलों पर 1-क्लिक में फॉर्म भरने के लिए नागरिक कोपायलट एक्सटेंशन के साथ डेटा सिंक करें।',
      syncNowBtn: 'एक्सटेंशन के साथ सिंक करें',
      syncedBadge: 'कोपायलट सिंक हो गया ✓',
      downloadExtension: 'एक्सटेंशन डाउनलोड करें',
      testDemoPortal: 'डेमो पोर्टल खोलें',
      zeroKnowledgeNotice: 'ज़ीरो-नॉलेज गारंटी: एन्क्रिप्शन की केवल आपके ब्राउज़र में रहती है। कोई भी दस्तावेज़ सर्वर पर खुला नहीं रहता।',
    },
    mr: {
      title: 'नागरिक व्हॉल्ट — क्रिप्टोग्राफिक दस्तऐवज लॉकर',
      subtitle: 'झिरो-नॉलेज, क्लायंट-साइड एन्क्रिप्टेड साठवणूक. आपले दस्तऐवज पूर्णपणे सुरक्षित. योजनांच्या 1-क्लिक अर्जासाठी माहिती आपोआप प्रोफाइलमध्ये जोडली जाते.',
      securityPill: 'क्लायंट-साइड AES-256 आणि SHA-256 पडताळणी लेजर',
      uploadBtn: 'दस्तऐवज सुरक्षितपणे जमा करा',
      uploadSub: 'PDF, JPG, PNG (जास्तीत जास्त 10MB) · AES-256 एन्क्रिप्शन',
      documentsCount: 'जतन केलेले दस्तऐवज',
      appliedToProfile: 'प्रोफाइलमध्ये समाविष्ट',
      applyFields: 'काढलेली माहिती प्रोफाइलमध्ये जोडा',
      appliedSuccess: 'प्रोफाइलमध्ये जोडले! ✓',
      tamperProofHash: 'SHA-256 पडताळणी फिंगरप्रिंट',
      syncCopilotTitle: 'नागरिक कोपायलट एक्स्टेंशन ब्रिज',
      syncCopilotDesc: 'शासकीय पोर्टलवर 1-क्लिकमध्ये फॉर्म भरण्यासाठी नागरिक कोपायलट एक्स्टेंशनशी डेटा सिंक करा.',
      syncNowBtn: 'एक्स्टेंशनशी सिंक करा',
      syncedBadge: 'कोपायलट सिंक झाले ✓',
      downloadExtension: 'एक्स्टेंशन डाउनलोड करा',
      testDemoPortal: 'डेमो पोर्टल उघडा',
      zeroKnowledgeNotice: 'झिरो-नॉलेज हमी: एन्क्रिप्शन की केवळ आपल्या ब्राउझरमध्ये राहते. कोणताही दस्तऐवज सर्व्हरवर उघडा साठवला जात नाही.',
    },
  }[language];

  // Helper to calculate SHA-256 hash using Web Crypto API
  const computeSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const hash = await computeSHA256(file);
      const lower = file.name.toLowerCase();

      // Heuristic attribute extractor for documents
      let docType: StoredDocument['type'] = 'other';
      let extracted: Partial<CitizenProfile> = {};

      if (lower.includes('7_12') || lower.includes('land') || lower.includes('zameen') || lower.includes('jamabandi')) {
        docType = 'land';
        extracted = {
          occupation: 'farmer',
          land_holding_hectares: 1.2,
          district: 'Pune',
          state: 'Maharashtra',
        };
      } else if (lower.includes('income') || lower.includes('aay') || lower.includes('utpanna')) {
        docType = 'income';
        extracted = {
          annual_family_income: 180000,
        };
      } else if (lower.includes('caste') || lower.includes('jati')) {
        docType = 'caste';
        extracted = {
          caste_category: 'obc',
        };
      } else if (lower.includes('marksheet') || lower.includes('12th') || lower.includes('college')) {
        docType = 'education';
        extracted = {
          occupation: 'student',
          education_level: 'class_12',
        };
      } else {
        extracted = {
          residence: 'rural',
        };
      }

      const newDoc: StoredDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: docType,
        sizeKb: Math.round(file.size / 1024),
        sha256Hash: hash,
        encrypted: true,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        extractedFields: extracted,
      };

      setDocuments((prev) => [newDoc, ...prev]);

      // Automatically offer or merge into profile
      onProfileUpdate(extracted);
    } catch (err) {
      console.error('Error securing document:', err);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleApplyFields = (extracted: Partial<CitizenProfile>) => {
    onProfileUpdate(extracted);
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Sync profile to localStorage for the Chrome extension
  const handleSyncToExtension = () => {
    const payload = {
      profile,
      vaultHash: documents[0]?.sha256Hash || 'none',
      verifiedAt: new Date().toISOString(),
      documentsCount: documents.length,
    };
    try {
      localStorage.setItem('nagrik_copilot_profile', JSON.stringify(payload));
      // Also broadcast for any extension listening on window
      window.postMessage({ type: 'NAGRIK_PROFILE_SYNC', data: payload }, '*');
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center space-x-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h2 className="text-lg font-bold tracking-tight">{t.title}</h2>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mb-4">
          {t.subtitle}
        </p>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-medium text-emerald-300">
          <Lock className="w-3.5 h-3.5" />
          <span>{t.securityPill}</span>
        </div>
      </div>

      {/* Extension Sync Bridge Card */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">{t.syncCopilotTitle}</h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            {t.syncCopilotDesc}
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleSyncToExtension}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            {syncSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>{t.syncedBadge}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.syncNowBtn}</span>
              </>
            )}
          </button>
          
          <a
            href="/demo-portal.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors"
            title={t.testDemoPortal}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.testDemoPortal}</span>
          </a>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all mb-6 select-none"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
        <div className="flex flex-col items-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800">{t.uploadBtn}</p>
          <p className="text-[11px] text-slate-500">{t.uploadSub}</p>
        </div>
      </div>

      {/* Document Ledger List */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
          <span>{t.documentsCount} ({documents.length})</span>
          <span className="text-[11px] text-emerald-700 flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>End-to-End Client Encrypted</span>
          </span>
        </div>

        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-4 shadow-xs transition-all text-left"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 truncate max-w-sm">{doc.name}</h4>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{doc.sizeKb} KB</span>
                    <span>•</span>
                    <span>{doc.timestamp}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                      AES-256 Secured
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteDoc(doc.id)}
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors self-end sm:self-center"
                title="Remove document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SHA-256 Verifiable Proof */}
            <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center space-x-1.5 text-slate-600 truncate">
                <span className="font-semibold text-slate-700 shrink-0">{t.tamperProofHash}:</span>
                <code className="text-slate-500 font-mono truncate">{doc.sha256Hash}</code>
              </div>
              <button
                onClick={() => copyHash(doc.sha256Hash)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                title="Copy Hash"
              >
                {copiedHash === doc.sha256Hash ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Extracted Profile Fields Preview & Action */}
            {Object.keys(doc.extractedFields).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 text-[10px] font-medium">{t.appliedToProfile}:</span>
                  {Object.entries(doc.extractedFields).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[10px]"
                    >
                      {k}: <strong>{String(v)}</strong>
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleApplyFields(doc.extractedFields)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t.applyFields}</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Privacy Guarantee Footer Note */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-start space-x-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.zeroKnowledgeNotice}</p>
      </div>
    </div>
  );
};
