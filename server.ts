import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Helper to get Gemini AI instance safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Resilient helper that attempts supported models with retry and fallback
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  const modelsToTry = [
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    // Try up to 2 attempts per model with a small delay for transient 503/high-demand
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || "";
        const isUnavailable = err?.status === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
        const isRateLimit = err?.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
        
        console.warn(`Model attempt [${model}] attempt ${attempt + 1} failed: ${errMsg}`);

        if (isUnavailable && attempt === 0) {
          // Wait 600ms before retrying or falling back
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }

        // Break inner loop to try next fallback model
        break;
      }
    }
  }

  throw lastError;
}

// Uniform API error handler
function handleApiError(res: express.Response, error: any, defaultMessage: string) {
  console.error("Gemini API error:", error);
  const errMsg = error?.message || "";
  const isRateLimit = error?.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
  const isUnavailable = error?.status === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");

  if (isRateLimit) {
    return res.status(429).json({
      error: "Gemini API rate limit reached. Please wait a few moments and try again.",
      isRateLimit: true,
    });
  }

  if (isUnavailable) {
    return res.status(503).json({
      error: "Gemini service is currently experiencing temporary high demand. Please try again shortly.",
      isUnavailable: true,
    });
  }

  return res.status(500).json({
    error: errMsg || defaultMessage,
  });
}

// System instruction generator based on user persona preference
function getPersonaInstruction(aiStyle?: string): string {
  const base = `You are Personal Gemini, a warm, non-judgmental, deeply empathetic, and introspective AI Journal Companion. Your role is to help the user explore their thoughts, feelings, patterns, and growth with compassionate curiosity. Maintain strict confidentiality tone, speak authentically, avoid hollow advice, and ask gentle, clarifying questions that encourage emotional clarity and mindfulness.`;
  
  switch (aiStyle) {
    case 'socratic':
      return `${base} Primary style: Socratic questioning. Ask thought-provoking, deep questions that help the user examine their assumptions and discover their own clarity.`;
    case 'philosophical':
      return `${base} Primary style: Philosophical & Stoic perspective. Offer timeless reflections on resilience, perspective, acceptance, and personal values.`;
    case 'action_oriented':
      return `${base} Primary style: Action-oriented growth coach. Help the user turn raw thoughts into practical reframes, small achievable steps, and positive habits.`;
    case 'mindful':
      return `${base} Primary style: Mindful & Somatic focus. Encourage grounding, self-compassion, breath awareness, and gentle acceptance of present emotions.`;
    case 'empathetic':
    default:
      return `${base} Primary style: Empathetic listener. Offer deep validation, warm active listening, and gentle reframes.`;
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiKeyAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// Multi-turn conversational journal assistant
app.post("/api/chat", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please configure your API key in Secrets.",
      });
    }

    const { messages, journalContext, aiStyle } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const systemInstruction = getPersonaInstruction(aiStyle) + 
      (journalContext ? `\n\nContext of current journal entry being discussed:\n"""\n${journalContext}\n"""` : "");

    // Format history for Gemini API using standard SDK structure
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await generateContentWithFallback(ai, {
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    });

    const replyText = response.text || "I'm listening. Could you share a bit more about how that made you feel?";

    res.json({ reply: replyText });
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate AI chat response.");
  }
});

// Generate deep structured reflection for a journal entry
app.post("/api/reflect", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please configure your API key in Secrets.",
      });
    }

    const { title, content, mood } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Journal content is required for reflection." });
    }

    const prompt = `Analyze the following journal entry written by the user and produce a structured reflection in JSON format.
Entry Title: ${title || "Untitled"}
Stated Mood: ${mood || "Not specified"}
Content:
"""
${content}
"""

Return ONLY a valid JSON object matching this schema:
{
  "summary": "Concise 1-2 sentence reflection of the core thought or event",
  "moodAnalysis": "Compassionate summary of the emotional tone and undercurrents",
  "insights": ["Insight 1: psychological pattern or positive takeaway", "Insight 2: mindful observation"],
  "followUpQuestions": ["Question 1 to deepen introspection", "Question 2"],
  "reframing": "A gentle, constructive cognitive reframe or supportive perspective",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("No output generated from Gemini.");
    }

    const parsed = JSON.parse(rawJson);
    res.json({ reflection: parsed });
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate entry reflection.");
  }
});

// Generate personalized daily journaling prompts
app.post("/api/prompts/generate", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please configure your API key in Secrets.",
      });
    }

    const { recentMoods, recentTags, aiStyle } = req.body;

    const prompt = `Generate 3 inspirational, deep, personalized journaling prompts based on the user's recent journaling state.
Recent Moods: ${recentMoods?.join(", ") || "Reflective, Quiet"}
Recent Tags/Themes: ${recentTags?.join(", ") || "Growth, Work, Relationships"}
Preferred AI Guide Persona: ${aiStyle || "empathetic"}

Return ONLY a valid JSON object with the array "prompts":
{
  "prompts": [
    {
      "category": "Emotional Exploration",
      "text": "The prompt text here...",
      "inspiration": "Brief note on why this reflection matters"
    },
    {
      "category": "Mindfulness & Gratitude",
      "text": "The prompt text here...",
      "inspiration": "..."
    },
    {
      "category": "Growth & Core Values",
      "text": "The prompt text here...",
      "inspiration": "..."
    }
  ]
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate prompts.");
  }
});

// Weekly / Periodic synthesis of entries
app.post("/api/insights/synthesize", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please configure your API key in Secrets.",
      });
    }

    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "At least one journal entry is required for synthesis." });
    }

    const formattedEntries = entries
      .slice(0, 15)
      .map(
        (e: any, i: number) =>
          `[Entry ${i + 1}] (${e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "Date N/A"}) - Mood: ${e.mood || "N/A"}\nTitle: ${e.title || "Untitled"}\nContent snippet: ${e.content?.slice(0, 300)}...`
      )
      .join("\n---\n");

    const prompt = `Perform a holistic personal growth & emotional trajectory synthesis across these recent journal entries:
${formattedEntries}

Return ONLY a valid JSON object matching this schema:
{
  "headline": "Empowering high-level summary of the user's recent journey",
  "dominantThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "emotionalShift": "Analysis of mood patterns and evolution over time",
  "strengthsObserved": ["Strength 1 (e.g. self-awareness)", "Strength 2"],
  "mindfulAdvice": "A supportive 2-sentence encouraging note for the upcoming week"
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ synthesis: parsed });
  } catch (error: any) {
    handleApiError(res, error, "Failed to synthesize insights.");
  }
});

// -------------------------------------------------------------
// VITE / STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
