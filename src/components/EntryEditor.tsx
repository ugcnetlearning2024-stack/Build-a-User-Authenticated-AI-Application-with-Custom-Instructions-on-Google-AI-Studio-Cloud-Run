import React, { useState } from "react";
import { JournalEntry } from "../types";
import { generateEntryReflection } from "../services/aiService";
import { Sparkles, Save, X, Tag, Heart, AlertCircle } from "lucide-react";

interface EntryEditorProps {
  initialEntry?: JournalEntry | null;
  initialContent?: string;
  onSave: (entry: Omit<JournalEntry, 'entryId' | 'userId'>) => Promise<void>;
  onClose: () => void;
}

const MOOD_OPTIONS: Array<{ id: JournalEntry['mood']; label: string; icon: string; bg: string }> = [
  { id: 'calm', label: 'Calm', icon: '🍃', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'reflective', label: 'Reflective', icon: '🌊', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'grateful', label: 'Grateful', icon: '🙏', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'joyful', label: 'Joyful', icon: '☀️', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { id: 'energetic', label: 'Energetic', icon: '⚡', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
  { id: 'bittersweet', label: 'Bittersweet', icon: '🌅', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'anxious', label: 'Anxious', icon: '🌧️', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '🌪️', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  { id: 'neutral', label: 'Neutral', icon: '☁️', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const EntryEditor: React.FC<EntryEditorProps> = ({
  initialEntry,
  initialContent,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || initialContent || "");
  const [mood, setMood] = useState<JournalEntry['mood']>(initialEntry?.mood || "reflective");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || ["Reflections"]);
  const [autoReflect, setAutoReflect] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setStatusMessage("Saving to private Cloud Firestore...");

    try {
      let aiSummary = initialEntry?.aiSummary;
      let aiInsights = initialEntry?.aiInsights;
      let aiReframing = initialEntry?.aiReframing;

      if (autoReflect) {
        setStatusMessage("Generating AI reflection & insights with Gemini...");
        try {
          const reflection = await generateEntryReflection(title || "Untitled Entry", content, mood);
          aiSummary = reflection.summary;
          aiInsights = reflection.insights;
          aiReframing = reflection.reframing;
          
          if (reflection.suggestedTags) {
            const combinedTags = Array.from(new Set([...tags, ...reflection.suggestedTags]));
            setTags(combinedTags);
          }
        } catch (aiErr) {
          console.warn("AI reflection error (proceeding to save entry anyway):", aiErr);
        }
      }

      await onSave({
        title: title.trim() || "Untitled Reflection",
        content: content.trim(),
        mood,
        tags,
        aiSummary,
        aiInsights,
        aiReframing,
        createdAt: initialEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      onClose();
    } catch (err: any) {
      console.error("Save entry error:", err);
      setStatusMessage(`Error saving entry: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              {initialEntry ? "Edit Entry" : "Write Journal Entry"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title (e.g. Quiet Morning Thoughts)..."
              className="w-full text-xl font-serif font-semibold text-slate-900 placeholder:text-slate-400 border-b border-slate-200 pb-2 focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              How are you feeling right now?
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                    mood === m.id
                      ? `${m.bg} ring-2 ring-amber-500/30 font-semibold shadow-xs scale-105`
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Entry Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely. What is occupying your mind today? What did you experience or learn?"
              rows={8}
              required
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm text-slate-900 leading-relaxed font-sans resize-none"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
              <span>Saved privately in Cloud Firestore</span>
              <span>{content.length} characters</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tags & Themes
            </label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag (e.g. Mindset, Work, Gratitude)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 text-xs"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* AI Reflection Option */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Gemini AI Immediate Reflection
                </span>
                <span className="text-[11px] text-slate-600 block">
                  Generates emotional insights, themes, and cognitive reframes automatically upon save.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoReflect}
              onChange={(e) => setAutoReflect(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300"
            />
          </div>

          {statusMessage && (
            <div className="text-xs text-amber-800 font-medium bg-amber-100/80 p-2.5 rounded-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Processing..." : "Save Journal Entry"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
