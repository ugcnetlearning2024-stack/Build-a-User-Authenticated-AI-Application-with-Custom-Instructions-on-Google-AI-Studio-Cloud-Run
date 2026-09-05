/**
 * Personal Gemini Journal
 * @license Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { auth, onAuthStateChanged, FirebaseUser } from "./lib/firebase";
import { subscribeJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry } from "./services/firestoreService";
import { checkBackendHealth } from "./services/aiService";
import { JournalEntry, UserProfile } from "./types";

import { AuthScreen } from "./components/AuthScreen";
import { Navbar } from "./components/Navbar";
import { EntryCard } from "./components/EntryCard";
import { EntryEditor } from "./components/EntryEditor";
import { EntryDetailView } from "./components/EntryDetailView";
import { PromptsView } from "./components/PromptsView";
import { SynthesisView } from "./components/SynthesisView";
import { SettingsModal } from "./components/SettingsModal";
import { SecurityBadge } from "./components/SecurityBadge";

import { Plus, Feather, Sparkles, BookOpen, Search, ShieldCheck, Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [geminiKeyAvailable, setGeminiKeyAvailable] = useState(true);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'entries' | 'prompts' | 'synthesis'>('entries');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [prefilledContent, setPrefilledContent] = useState<string>("");

  const [showSettings, setShowSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>("all");

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Check Backend Server Health & Secret Manager Key
  useEffect(() => {
    checkBackendHealth().then((res) => {
      setGeminiKeyAvailable(res.geminiKeyAvailable);
    });
  }, []);

  // 3. Subscribe to user's private Firestore entries
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    const unsubscribe = subscribeJournalEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setEntriesLoading(false);

        // Keep selected entry updated if edited
        if (selectedEntry) {
          const updated = fetchedEntries.find(e => e.entryId === selectedEntry.entryId);
          if (updated) setSelectedEntry(updated);
        }
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setEntriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle saving new or updated entry
  const handleSaveEntry = async (entryData: Omit<JournalEntry, 'entryId' | 'userId'>) => {
    if (!user) return;
    if (editingEntry) {
      await updateJournalEntry(user.uid, editingEntry.entryId, entryData);
    } else {
      await createJournalEntry(user.uid, entryData);
    }
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteJournalEntry(user.uid, entryId);
  };

  // Handle prompt use
  const handleUsePrompt = (promptText: string) => {
    setPrefilledContent(`Prompt: ${promptText}\n\nReflection:\n`);
    setEditingEntry(null);
    setShowEditor(true);
  };

  // Filtered entries
  const filteredEntries = entries.filter((e) => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesMood = selectedMoodFilter === "all" || e.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span className="font-serif font-semibold text-lg">Initializing Personal Gemini Journal...</span>
        </div>
      </div>
    );
  }

  // Not signed in -> Show Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedEntry(null);
          setActiveTab(tab);
        }}
        onOpenSettings={() => setShowSettings(true)}
        geminiKeyAvailable={geminiKeyAvailable}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Selected Entry Detail View */}
        {selectedEntry ? (
          <EntryDetailView
            userId={user.uid}
            entry={selectedEntry}
            onBack={() => setSelectedEntry(null)}
            onEdit={(entry) => {
              setEditingEntry(entry);
              setPrefilledContent("");
              setShowEditor(true);
            }}
            onDelete={handleDeleteEntry}
            aiStyle={userProfile?.aiGuideStyle || "empathetic"}
          />
        ) : (
          <>
            {/* TABS CONTENT */}

            {activeTab === 'entries' && (
              <div className="space-y-6">
                
                {/* Hero / Action Header Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>My Personal Journal</span>
                      <span className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {entries.length} {entries.length === 1 ? 'Entry' : 'Entries'}
                      </span>
                    </h1>
                    <p className="text-xs text-slate-500">
                      Private, encrypted Cloud Firestore storage with multi-turn Gemini reflections.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingEntry(null);
                      setPrefilledContent("");
                      setShowEditor(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>New Reflection Entry</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                {entries.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search entries, keywords, or #tags..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <select
                      value={selectedMoodFilter}
                      onChange={(e) => setSelectedMoodFilter(e.target.value)}
                      className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">All Moods</option>
                      <option value="calm">🍃 Calm</option>
                      <option value="reflective">🌊 Reflective</option>
                      <option value="grateful">🙏 Grateful</option>
                      <option value="joyful">☀️ Joyful</option>
                      <option value="energetic">⚡ Energetic</option>
                      <option value="bittersweet">🌅 Bittersweet</option>
                      <option value="anxious">🌧️ Anxious</option>
                      <option value="overwhelmed">🌪️ Overwhelmed</option>
                      <option value="neutral">☁️ Neutral</option>
                    </select>
                  </div>
                )}

                {/* Entries Grid */}
                {entriesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-6 bg-slate-200 rounded w-3/4" />
                        <div className="h-16 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center space-y-4 border border-slate-200 max-w-lg mx-auto my-8">
                    <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
                      <Feather className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-lg text-slate-900">
                        {entries.length === 0 ? "Your Journal is Empty" : "No Matching Entries Found"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {entries.length === 0
                          ? "Write your first entry to unlock multi-turn Gemini reflections and private Cloud Firestore tracking."
                          : "Try adjusting your search terms or mood filter."}
                      </p>
                    </div>

                    {entries.length === 0 && (
                      <button
                        onClick={() => {
                          setEditingEntry(null);
                          setPrefilledContent("");
                          setShowEditor(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Create First Entry</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEntries.map((entry) => (
                      <EntryCard
                        key={entry.entryId}
                        entry={entry}
                        onClick={() => setSelectedEntry(entry)}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}

            {activeTab === 'prompts' && (
              <PromptsView
                entries={entries}
                aiStyle={userProfile?.aiGuideStyle || "empathetic"}
                onUsePrompt={handleUsePrompt}
              />
            )}

            {activeTab === 'synthesis' && (
              <SynthesisView entries={entries} />
            )}

          </>
        )}

      </main>

      {/* Editor Modal */}
      {showEditor && (
        <EntryEditor
          initialEntry={editingEntry}
          initialContent={prefilledContent}
          onSave={handleSaveEntry}
          onClose={() => {
            setShowEditor(false);
            setEditingEntry(null);
            setPrefilledContent("");
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          userId={user.uid}
          currentProfile={userProfile}
          onClose={() => setShowSettings(false)}
          onProfileUpdated={(updated) => setUserProfile({ ...userProfile, ...updated })}
        />
      )}

      {/* Global Security Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Personal Gemini Journal — Firebase Auth & Cloud Firestore Enforced</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Server-side Secret Manager Integration</span>
            <span>•</span>
            <span>Gemini 2.5 AI Powered</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
