import React, { useState, useEffect } from "react";
import { PromptItem, JournalEntry } from "../types";
import { generatePersonalizedPrompts } from "../services/aiService";
import { Sparkles, RefreshCw, PenTool, Lightbulb, Compass, HeartHandshake } from "lucide-react";

interface PromptsViewProps {
  entries: JournalEntry[];
  aiStyle?: string;
  onUsePrompt: (promptText: string) => void;
}

export const PromptsView: React.FC<PromptsViewProps> = ({
  entries,
  aiStyle = "empathetic",
  onUsePrompt,
}) => {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const recentMoods = entries.slice(0, 5).map(e => e.mood);
      const allTags: string[] = entries.flatMap((e): string[] => e.tags || []);
      const recentTags: string[] = Array.from(new Set(allTags)).slice(0, 5);

      const generated = await generatePersonalizedPrompts(recentMoods, recentTags, aiStyle);
      setPrompts(generated);
    } catch (err: any) {
      console.error("Fetch prompts error:", err);
      setError(err.message || "Failed to generate AI prompts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [aiStyle]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-amber-900 text-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-800 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-800/80 border border-amber-700/80 text-amber-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Personalized for Your Mindset</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Daily AI Journaling Prompts
          </h2>

          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed max-w-xl">
            Gemini synthesizes your recent emotional patterns and tags to curate thought-provoking prompts designed to deepen clarity and spark self-reflection.
          </p>

          <button
            onClick={fetchPrompts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-white text-amber-950 rounded-xl font-medium text-xs shadow-sm transition-colors disabled:opacity-50 mt-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-800 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? "Curating New Prompts..." : "Refresh Prompts"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-8 bg-slate-200 rounded-xl" />
            </div>
          ))
        ) : prompts.length === 0 ? (
          <div className="col-span-3 bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
            <Compass className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-sm font-medium text-slate-700">No prompts generated yet.</p>
            <button
              onClick={fetchPrompts}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium"
            >
              Generate First Prompts
            </button>
          </div>
        ) : (
          prompts.map((p, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 text-[11px] font-semibold">
                  {p.category || "Reflective Prompt"}
                </span>

                <h3 className="font-serif font-semibold text-slate-900 text-base leading-snug">
                  "{p.text}"
                </h3>

                {p.inspiration && (
                  <p className="text-xs text-slate-500 italic border-l-2 border-amber-200 pl-2.5 py-0.5">
                    {p.inspiration}
                  </p>
                )}
              </div>

              <button
                onClick={() => onUsePrompt(p.text)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                <span>Write Entry with Prompt</span>
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
