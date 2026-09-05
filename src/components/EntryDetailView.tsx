import React, { useState } from "react";
import { JournalEntry } from "../types";
import { MultiTurnChat } from "./MultiTurnChat";
import { ArrowLeft, Sparkles, Trash2, Edit3, Tag, Heart, HelpCircle, Lightbulb, MessageSquare } from "lucide-react";

interface EntryDetailViewProps {
  userId: string;
  entry: JournalEntry;
  onBack: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => Promise<void>;
  aiStyle?: string;
}

const MOOD_MAP: Record<JournalEntry['mood'], { label: string; icon: string; bg: string }> = {
  calm: { label: 'Calm', icon: '🍃', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  reflective: { label: 'Reflective', icon: '🌊', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
  grateful: { label: 'Grateful', icon: '🙏', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  joyful: { label: 'Joyful', icon: '☀️', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  energetic: { label: 'Energetic', icon: '⚡', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
  bittersweet: { label: 'Bittersweet', icon: '🌅', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  anxious: { label: 'Anxious', icon: '🌧️', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  overwhelmed: { label: 'Overwhelmed', icon: '🌪️', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  neutral: { label: 'Neutral', icon: '☁️', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const EntryDetailView: React.FC<EntryDetailViewProps> = ({
  userId,
  entry,
  onBack,
  onEdit,
  onDelete,
  aiStyle = "empathetic",
}) => {
  const [deleting, setDeleting] = useState(false);
  const moodInfo = MOOD_MAP[entry.mood] || MOOD_MAP.neutral;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      setDeleting(true);
      try {
        await onDelete(entry.entryId);
        onBack();
      } catch (err) {
        console.error("Delete error:", err);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs text-xs font-medium flex items-center gap-1.5 px-3"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors shadow-2xs text-xs font-medium flex items-center gap-1.5 px-3 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Journal Entry Details */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-5">
            
            {/* Entry Header Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${moodInfo.bg}`}>
                  <span>{moodInfo.icon}</span>
                  <span>{moodInfo.label}</span>
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
                {entry.title}
              </h1>
            </div>

            {/* Entry Text */}
            <div className="text-slate-800 leading-relaxed font-sans text-sm sm:text-base whitespace-pre-wrap border-t border-b border-slate-100 py-4">
              {entry.content}
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {entry.tags.map(t => (
                  <span key={t} className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}

          </div>

          {/* AI Reflections Section */}
          {(entry.aiSummary || (entry.aiInsights && entry.aiInsights.length > 0) || entry.aiReframing) && (
            <div className="bg-amber-50/60 rounded-3xl p-6 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 border-b border-amber-200/60 pb-3">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-base">Gemini Reflection Insights</h3>
              </div>

              {entry.aiSummary && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">Summary & Emotional Context</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200/50">
                    {entry.aiSummary}
                  </p>
                </div>
              )}

              {entry.aiReframing && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mindful Reframe</span>
                  </h4>
                  <p className="text-xs text-amber-950 leading-relaxed italic bg-amber-100/60 p-3 rounded-xl border border-amber-300/60">
                    "{entry.aiReframing}"
                  </p>
                </div>
              )}

              {entry.aiInsights && entry.aiInsights.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">Key Growth Insights</h4>
                  <ul className="space-y-1.5">
                    {entry.aiInsights.map((insight, idx) => (
                      <li key={idx} className="text-xs text-slate-700 bg-white/70 p-2.5 rounded-xl border border-amber-200/50 flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Multi-Turn AI Conversation */}
        <div className="lg:col-span-5">
          <MultiTurnChat
            userId={userId}
            entry={entry}
            aiStyle={aiStyle}
          />
        </div>

      </div>

    </div>
  );
};
