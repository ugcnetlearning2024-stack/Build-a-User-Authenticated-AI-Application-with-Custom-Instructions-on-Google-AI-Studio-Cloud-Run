import React from "react";
import { JournalEntry } from "../types";
import { Sparkles, Calendar, Tag, ChevronRight, MessageSquare } from "lucide-react";

interface EntryCardProps {
  entry: JournalEntry;
  onClick: () => void;
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

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onClick }) => {
  const moodInfo = MOOD_MAP[entry.mood] || MOOD_MAP.neutral;
  const snippet = entry.content.length > 140 ? entry.content.slice(0, 140) + "..." : entry.content;
  const hasReflection = !!(entry.aiSummary || entry.aiInsights?.length);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
    >
      <div className="space-y-2.5">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${moodInfo.bg}`}>
            <span>{moodInfo.icon}</span>
            <span>{moodInfo.label}</span>
          </span>

          <span className="text-[11px] text-slate-400 font-mono">
            {new Date(entry.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
          {entry.title || "Untitled Entry"}
        </h3>

        {/* Snippet */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {snippet}
        </p>
      </div>

      {/* Footer Meta Row */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        
        {/* Tags */}
        <div className="flex items-center gap-1 overflow-hidden max-w-[70%]">
          {entry.tags && entry.tags.length > 0 ? (
            entry.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] truncate">
                #{t}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 italic">No tags</span>
          )}
        </div>

        {/* Indicators & Arrow */}
        <div className="flex items-center gap-2">
          {hasReflection && (
            <div className="p-1 rounded-md bg-amber-100 text-amber-800 text-[10px] flex items-center gap-1 font-medium" title="AI Reflected">
              <Sparkles className="w-3 h-3 text-amber-600" />
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5" />
        </div>

      </div>
    </div>
  );
};
