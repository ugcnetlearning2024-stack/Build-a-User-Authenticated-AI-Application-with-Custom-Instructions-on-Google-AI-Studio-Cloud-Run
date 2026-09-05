import React from "react";
import { ShieldCheck, Key, Lock, Database } from "lucide-react";

interface SecurityBadgeProps {
  compact?: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Firebase Auth & Secret Manager Secured</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Security Architecture</h4>
            <p className="text-xs text-slate-400">Google Cloud & Firebase Enterprise Standards</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
          Live Protected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
          <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-slate-200 block">Firebase Auth</span>
            <span className="text-[11px] text-slate-400">Per-user identity isolation & session tokens</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
          <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-slate-200 block">Private Firestore</span>
            <span className="text-[11px] text-slate-400">Strict ABAC rules guarantee zero cross-leakage</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
          <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-slate-200 block">Secret Manager</span>
            <span className="text-[11px] text-slate-400">Server-side proxy; API keys never touch browser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
