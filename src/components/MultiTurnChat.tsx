import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, JournalEntry } from "../types";
import { subscribeChatMessages, saveChatMessage } from "../services/firestoreService";
import { sendChatMessage } from "../services/aiService";
import { MessageSquare, Send, Sparkles, User, Bot, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface MultiTurnChatProps {
  userId: string;
  entry: JournalEntry;
  aiStyle?: string;
}

export const MultiTurnChat: React.FC<MultiTurnChatProps> = ({
  userId,
  entry,
  aiStyle = "empathetic",
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [lastPendingText, setLastPendingText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat messages from Cloud Firestore
  useEffect(() => {
    const unsubscribe = subscribeChatMessages(userId, entry.entryId, (fetchedMsgs) => {
      setMessages(fetchedMsgs);
    });
    return () => unsubscribe();
  }, [userId, entry.entryId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const executeSend = async (textToSend: string) => {
    setLoading(true);
    setErrorNotice(null);

    try {
      // 1. Save user message to Firestore subcollection (if not already saved)
      const isAlreadyLastUserMsg = messages.length > 0 && 
        messages[messages.length - 1].role === 'user' && 
        messages[messages.length - 1].content === textToSend;

      if (!isAlreadyLastUserMsg) {
        await saveChatMessage(userId, entry.entryId, {
          role: "user",
          content: textToSend,
        });
      }

      // 2. Prepare multi-turn messages array for backend Gemini call
      const updatedMessagesForApi = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        ...(isAlreadyLastUserMsg ? [] : [{ role: "user", content: textToSend }]),
      ];

      // Context of entry
      const journalContext = `Entry Title: "${entry.title}"\nMood: ${entry.mood}\nEntry Content:\n${entry.content}`;

      // 3. Call server backend endpoint (/api/chat)
      const replyText = await sendChatMessage(updatedMessagesForApi, journalContext, aiStyle);

      // 4. Save model response to Firestore
      await saveChatMessage(userId, entry.entryId, {
        role: "model",
        content: replyText,
      });

      setLastPendingText(null);
    } catch (err: any) {
      console.error("Multi-turn chat error:", err);
      const errMsg = err?.message || "Failed to reach Gemini";
      setLastPendingText(textToSend);
      
      if (errMsg.includes("rate limit") || errMsg.includes("429") || errMsg.includes("quota")) {
        setErrorNotice("Gemini rate limit reached. The AI is cooling down — please wait ~30 seconds and click Retry.");
      } else {
        setErrorNotice(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    await executeSend(text);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Gemini Reflection Partner</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60 uppercase">
                Multi-Turn
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Ongoing conversation saved privately to your Firestore thread
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 bg-slate-800/80 text-amber-400 rounded-2xl border border-slate-700">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-300 font-medium max-w-xs">
              Start a conversation with Gemini about this journal entry.
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Try asking: "Why did I react this way?", "What can I learn from this experience?", or "Help me reframe this thought."
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.messageId}
              className={`flex items-start gap-2.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                  msg.role === "user"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-800 text-amber-400 border border-slate-700"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-700 text-amber-50 rounded-tr-xs"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-[9px] opacity-60 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-amber-400 p-2.5 bg-slate-800/60 rounded-xl w-fit border border-slate-700/50">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Gemini is reflecting...</span>
          </div>
        )}

        {errorNotice && (
          <div className="p-3 bg-amber-950/80 border border-amber-700/50 rounded-2xl text-amber-200 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{errorNotice}</span>
            </div>
            {lastPendingText && (
              <button
                type="button"
                onClick={() => executeSend(lastPendingText)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini to reflect deeper on this entry..."
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
};
