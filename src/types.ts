export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  aiGuideStyle: 'empathetic' | 'socratic' | 'philosophical' | 'action_oriented' | 'mindful';
  createdAt: string;
}

export interface JournalEntry {
  entryId: string;
  userId: string;
  title: string;
  content: string;
  mood: 'joyful' | 'reflective' | 'anxious' | 'calm' | 'energetic' | 'bittersweet' | 'overwhelmed' | 'grateful' | 'neutral';
  tags: string[];
  aiSummary?: string;
  aiInsights?: string[];
  aiReframing?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  messageId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ReflectionResult {
  summary: string;
  moodAnalysis: string;
  insights: string[];
  followUpQuestions: string[];
  reframing: string;
  suggestedTags: string[];
}

export interface PromptItem {
  category: string;
  text: string;
  inspiration: string;
}

export interface SynthesisResult {
  headline: string;
  dominantThemes: string[];
  emotionalShift: string;
  strengthsObserved: string[];
  mindfulAdvice: string;
}
