import React, { useState } from "react";
import { UserProfile } from "../types";
import { saveUserProfile } from "../services/firestoreService";
import { Settings, X, Sparkles, Check, Compass, ShieldCheck } from "lucide-react";

interface SettingsModalProps {
  userId: string;
  currentProfile: Partial<UserProfile> | null;
  onClose: () => void;
  onProfileUpdated: (updated: Partial<UserProfile>) => void;
}

const PERSONA_OPTIONS: Array<{
  id: UserProfile['aiGuideStyle'];
  title: string;
  description: string;
  badge: string;
}> = [
  {
    id: "empathetic",
    title: "Empathetic Listener",
    description: "Offers deep emotional validation, compassionate active listening, and gentle reframes.",
    badge: "Warm & Validating",
  },
  {
    id: "socratic",
    title: "Socratic Questioner",
    description: "Asks probing, open-ended questions that challenge assumptions and spark original insight.",
    badge: "Deep Inquiry",
  },
  {
    id: "philosophical",
    title: "Philosophical & Stoic",
    description: "Shares timeless wisdom on resilience, acceptance, perspective, and core human values.",
    badge: "Perspective & Wisdom",
  },
  {
    id: "action_oriented",
    title: "Action-Oriented Coach",
    description: "Transforms raw feelings into practical reframes, constructive goals, and positive micro-habits.",
    badge: "Growth & Habits",
  },
  {
    id: "mindful",
    title: "Mindful & Somatic",
    description: "Encourages body awareness, breath grounding, present-moment acceptance, and non-judgment.",
    badge: "Presence & Peace",
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  userId,
  currentProfile,
  onClose,
  onProfileUpdated,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<UserProfile['aiGuideStyle']>(
    currentProfile?.aiGuideStyle || "empathetic"
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = { aiGuideStyle: selectedStyle };
      await saveUserProfile(userId, updates);
      onProfileUpdated(updates);
      onClose();
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Settings className="w-4 h-4 text-amber-700" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              AI Guide Persona Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Choose how Gemini interacts with you during multi-turn reflections and journal analyses. Your preference is saved securely in your Cloud Firestore profile.
          </p>

          <div className="space-y-3">
            {PERSONA_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setSelectedStyle(opt.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedStyle === opt.id
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedStyle === opt.id
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedStyle === opt.id && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{opt.title}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preference"}
          </button>
        </div>

      </div>
    </div>
  );
};
