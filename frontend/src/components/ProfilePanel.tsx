import React, { useState } from 'react';
import { UserCheck, Edit3, Check, X, Shield } from 'lucide-react';
import type { CitizenProfile } from '../types';

interface ProfilePanelProps {
  profile: Partial<CitizenProfile>;
  onUpdateProfile: (updated: Partial<CitizenProfile>) => void;
  language?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  profile,
  onUpdateProfile,
  language = 'en',
  isOpen,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CitizenProfile>>(profile);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  if (!isOpen) return null;

  const t = {
    en: {
      title: 'Your Citizen Profile',
      subtitle: 'Details collected from conversation. Editable anytime.',
      occupation: 'Occupation',
      district: 'District',
      state: 'State',
      land: 'Land Holding (ha)',
      income: 'Annual Family Income (₹)',
      education: 'Education Level',
      caste: 'Caste Category',
      residence: 'Residence Area',
      save: 'Save Profile',
      cancel: 'Cancel',
      edit: 'Edit Fields',
      privacyNote: 'Privacy Notice: Your information is kept strictly in session memory and is never shared or stored permanently.',
    },
    hi: {
      title: 'नागरिक प्रोफ़ाइल (Citizen Profile)',
      subtitle: 'बातचीत से प्राप्त विवरण। कभी भी बदल सकते हैं।',
      occupation: 'मुख्य व्यवसाय',
      district: 'जिला',
      state: 'राज्य',
      land: 'कृषि भूमि (हेक्टेयर)',
      income: 'वार्षिक पारिवारिक आय (₹)',
      education: 'शिक्षा का स्तर',
      caste: 'सामाजिक श्रेणी',
      residence: 'निवास क्षेत्र',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      edit: 'बदलें',
      privacyNote: 'गोपनीयता सूचना: आपकी जानकारी केवल सत्र के दौरान रखी जाती है और कभी भी स्थायी रूप से संग्रहीत नहीं की जाती।',
    },
    mr: {
      title: 'नागरिक प्रोफाइल (Citizen Profile)',
      subtitle: 'संभाषणातून गोळा केलेला तपशील. केव्हाही संपादित करा.',
      occupation: 'व्यवसाय',
      district: 'जिल्हा',
      state: 'राज्य',
      land: 'शेतजमीन (हेक्टर)',
      income: 'कौटुंबिक वार्षिक उत्पन्न (₹)',
      education: 'शिक्षण स्तर',
      caste: 'प्रवर्ग',
      residence: 'राहण्याचे ठिकाण',
      save: 'जतन करा',
      cancel: 'रद्द करा',
      edit: 'संपादित करा',
      privacyNote: 'गोपनीयता सूचना: आपली माहिती केवळ या सत्रासाठी वापरली जाते आणि कायमस्वरूपी जतन केली जात नाही.',
    },
  }[language] || {
    title: 'Your Citizen Profile',
    subtitle: 'Details collected from conversation. Editable anytime.',
    occupation: 'Occupation',
    district: 'District',
    state: 'State',
    land: 'Land Holding (ha)',
    income: 'Annual Family Income (₹)',
    education: 'Education Level',
    caste: 'Caste Category',
    residence: 'Residence Area',
    save: 'Save Profile',
    cancel: 'Cancel',
    edit: 'Edit Fields',
    privacyNote: 'Privacy Notice: Your information is kept strictly in session memory and is never shared or stored permanently.',
  };

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col font-sans transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{t.title}</h3>
            <p className="text-[11px] text-slate-500">{t.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
        {/* Occupation */}
        <div>
          <label className="font-semibold text-slate-600">{t.occupation}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.occupation || ''}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. farmer, student"
            />
          ) : (
            <p className="mt-0.5 text-slate-800 font-medium capitalize">
              {profile.occupation || '—'}
            </p>
          )}
        </div>

        {/* District & State */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-semibold text-slate-600">{t.district}</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.district || ''}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            ) : (
              <p className="mt-0.5 text-slate-800 font-medium">{profile.district || '—'}</p>
            )}
          </div>
          <div>
            <label className="font-semibold text-slate-600">{t.state}</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            ) : (
              <p className="mt-0.5 text-slate-800 font-medium">{profile.state || '—'}</p>
            )}
          </div>
        </div>

        {/* Land holding */}
        <div>
          <label className="font-semibold text-slate-600">{t.land}</label>
          {isEditing ? (
            <input
              type="number"
              step="0.1"
              value={formData.land_holding_hectares || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  land_holding_hectares: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          ) : (
            <p className="mt-0.5 text-slate-800 font-medium">
              {profile.land_holding_hectares !== null && profile.land_holding_hectares !== undefined
                ? `${profile.land_holding_hectares} ha`
                : '—'}
            </p>
          )}
        </div>

        {/* Annual income */}
        <div>
          <label className="font-semibold text-slate-600">{t.income}</label>
          {isEditing ? (
            <input
              type="number"
              value={formData.annual_family_income || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  annual_family_income: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          ) : (
            <p className="mt-0.5 text-slate-800 font-medium">
              {profile.annual_family_income
                ? `₹${profile.annual_family_income.toLocaleString('en-IN')}`
                : '—'}
            </p>
          )}
        </div>

        {/* Education level */}
        <div>
          <label className="font-semibold text-slate-600">{t.education}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.education_level || ''}
              onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
              className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          ) : (
            <p className="mt-0.5 text-slate-800 font-medium capitalize">
              {profile.education_level?.replace('_', ' ') || '—'}
            </p>
          )}
        </div>

        {/* Caste Category */}
        <div>
          <label className="font-semibold text-slate-600">{t.caste}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.caste_category || ''}
              onChange={(e) => setFormData({ ...formData, caste_category: e.target.value })}
              className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          ) : (
            <p className="mt-0.5 text-slate-800 font-medium uppercase">
              {profile.caste_category || '—'}
            </p>
          )}
        </div>

        {/* Privacy Note */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2 mt-4">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>{t.privacyNote}</p>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setFormData(profile);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t.save}</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 rounded-lg bg-white border border-slate-300 hover:border-slate-400 font-medium text-xs text-slate-700 flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.edit}</span>
          </button>
        )}
      </div>
    </div>
  );
};
