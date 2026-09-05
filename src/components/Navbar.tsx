import React, { useState } from "react";
import { FirebaseUser, signOut, auth } from "../lib/firebase";
import { Feather, BookOpen, Sparkles, TrendingUp, ShieldCheck, LogOut, Settings } from "lucide-react";

interface NavbarProps {
  user: FirebaseUser;
  activeTab: 'entries' | 'prompts' | 'synthesis';
  setActiveTab: (tab: 'entries' | 'prompts' | 'synthesis') => void;
  onOpenSettings: () => void;
  geminiKeyAvailable: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenSettings,
  geminiKeyAvailable,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const isGuest = user.isAnonymous;
  const userDisplayName = user.displayName || (isGuest ? "Guest Reflector" : user.email?.split("@")[0] || "User");

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('entries')}>
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl border border-amber-200/70 shadow-2xs">
              <Feather className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-slate-900 tracking-tight block">
                Personal Gemini
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold block -mt-1">
                Reflective AI Journal
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 text-xs font-medium">
            <button
              onClick={() => setActiveTab('entries')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'entries'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>My Journal</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'prompts'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Prompts</span>
            </button>

            <button
              onClick={() => setActiveTab('synthesis')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'synthesis'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Growth Synthesis</span>
            </button>
          </nav>

          {/* User Controls & Security Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Secret Manager status indicator */}
            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              geminiKeyAvailable 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secret Manager Key: {geminiKeyAvailable ? 'Active' : 'Missing'}</span>
            </div>

            {/* Persona Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="AI Guide Persona Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-700 text-amber-50 font-bold text-xs flex items-center justify-center uppercase">
                  {userDisplayName.charAt(0)}
                </div>
                <span className="text-xs font-medium text-slate-800 hidden sm:inline max-w-[100px] truncate">
                  {userDisplayName}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-semibold text-slate-900 truncate">{userDisplayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email || (isGuest ? "Guest Anonymous Auth" : "")}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      UID: {user.uid.slice(0, 8)}...
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>AI Persona Settings</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              activeTab === 'entries' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Journal</span>
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              activeTab === 'prompts' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Prompts</span>
          </button>
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              activeTab === 'synthesis' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Synthesis</span>
          </button>
        </div>

      </div>
    </header>
  );
};
