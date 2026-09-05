import React, { useState } from "react";
import { JournalEntry, SynthesisResult } from "../types";
import { synthesizeGrowthInsights } from "../services/aiService";
import { TrendingUp, Sparkles, RefreshCw, Award, Heart, CheckCircle2, Compass } from "lucide-react";

interface SynthesisViewProps {
  entries: JournalEntry[];
}

export const SynthesisView: React.FC<SynthesisViewProps> = ({ entries }) => {
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSynthesize = async () => {
    if (entries.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const formatted = entries.map(e => ({
        title: e.title,
        content: e.content,
        mood: e.mood,
        createdAt: e.createdAt,
      }));
      const result = await synthesizeGrowthInsights(formatted);
      setSynthesis(result);
    } catch (err: any) {
      console.error("Synthesize error:", err);
      setError(err.message || "Failed to synthesize growth insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>AI Multi-Entry Analysis</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Growth & Mood Synthesis
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Gemini reads across your private Cloud Firestore journal entries to uncover recurring emotional themes, mental breakthroughs, and character strengths over time.
          </p>

          <button
            onClick={handleSynthesize}
            disabled={loading || entries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50 mt-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? "Analyzing Entry Patterns..." : "Synthesize Recent Journal History"}</span>
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
          <Compass className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Journal Entries Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Write a few journal entries first to generate an AI synthesis of your emotional journey and growth trends.
          </p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
          {error}
        </div>
      ) : synthesis ? (
        <div className="space-y-5">
          
          {/* Headline Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70">
              Trajectory Summary
            </span>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
              "{synthesis.headline}"
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Dominant Themes */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Dominant Mindset Themes</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {synthesis.dominantThemes?.map((theme, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/70 text-xs font-medium">
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Strengths Observed */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Strengths & Resilience</span>
              </h4>
              <ul className="space-y-2 pt-1">
                {synthesis.strengthsObserved?.map((str, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Emotional Shift */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Emotional Evolution</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {synthesis.emotionalShift}
            </p>
          </div>

          {/* Mindful Advice */}
          <div className="bg-emerald-50/70 rounded-3xl p-6 border border-emerald-200/70 space-y-2">
            <h4 className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
              Weekly Mindful Recommendation
            </h4>
            <p className="text-xs sm:text-sm text-emerald-950 font-serif leading-relaxed italic">
              "{synthesis.mindfulAdvice}"
            </p>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center space-y-4 border border-slate-200">
          <p className="text-xs text-slate-600">
            Click the button above to generate a comprehensive Gemini analysis of your {entries.length} journal {entries.length === 1 ? 'entry' : 'entries'}.
          </p>
        </div>
      )}

    </div>
  );
};
