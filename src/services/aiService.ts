import { ReflectionResult, PromptItem, SynthesisResult, ChatMessage } from "../types";

export async function checkBackendHealth(): Promise<{ status: string; geminiKeyAvailable: boolean }> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error("Backend server not responding.");
    return await res.json();
  } catch (err) {
    console.error("Health check error:", err);
    return { status: "error", geminiKeyAvailable: false };
  }
}

export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  journalContext?: string,
  aiStyle?: string
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, journalContext, aiStyle }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.reply;
}

export async function generateEntryReflection(
  title: string,
  content: string,
  mood?: string
): Promise<ReflectionResult> {
  const res = await fetch("/api/reflect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, mood }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.reflection;
}

export async function generatePersonalizedPrompts(
  recentMoods?: string[],
  recentTags?: string[],
  aiStyle?: string
): Promise<PromptItem[]> {
  const res = await fetch("/api/prompts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recentMoods, recentTags, aiStyle }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.prompts || [];
}

export async function synthesizeGrowthInsights(
  entries: Array<{ title: string; content: string; mood: string; createdAt: string }>
): Promise<SynthesisResult> {
  const res = await fetch("/api/insights/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.synthesis;
}
