import { 
  db, 
  doc, 
  collection, 
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "../lib/firebase";
import { JournalEntry, ChatMessage, UserProfile } from "../types";

// Helper function to remove undefined properties before saving to Firestore
function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

// User Profile Operations
export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, "users", userId);
  const data = cleanUndefined({
    userId,
    ...profile,
    updatedAt: new Date().toISOString()
  });
  await setDoc(userRef, data, { merge: true });
}

// Journal Entry Operations (Strictly isolated to /users/{userId}/entries)
export function subscribeJournalEntries(
  userId: string, 
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) {
  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const entries: JournalEntry[] = snapshot.docs.map(doc => ({
      entryId: doc.id,
      ...(doc.data() as Omit<JournalEntry, 'entryId'>)
    }));
    onUpdate(entries);
  }, (err) => {
    console.error("Firestore entries subscription error:", err);
    if (onError) onError(err);
  });
}

export async function createJournalEntry(userId: string, entry: Omit<JournalEntry, 'entryId' | 'userId'>): Promise<string> {
  const entriesRef = collection(db, "users", userId, "entries");
  const data = cleanUndefined({
    ...entry,
    userId,
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const docRef = await addDoc(entriesRef, data);
  return docRef.id;
}

export async function updateJournalEntry(userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<void> {
  const entryRef = doc(db, "users", userId, "entries", entryId);
  const data = cleanUndefined({
    ...updates,
    updatedAt: new Date().toISOString()
  });
  await updateDoc(entryRef, data);
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const entryRef = doc(db, "users", userId, "entries", entryId);
  await deleteDoc(entryRef);
}

// Multi-turn Chat Message Operations (Isolated under /users/{userId}/entries/{entryId}/messages)
export function subscribeChatMessages(
  userId: string, 
  entryId: string, 
  onUpdate: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, "users", userId, "entries", entryId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map(doc => ({
      messageId: doc.id,
      ...(doc.data() as Omit<ChatMessage, 'messageId'>)
    }));
    onUpdate(messages);
  });
}

export async function saveChatMessage(
  userId: string, 
  entryId: string, 
  msg: { role: 'user' | 'model'; content: string }
): Promise<string> {
  const messagesRef = collection(db, "users", userId, "entries", entryId, "messages");
  const data = cleanUndefined({
    userId,
    role: msg.role,
    content: msg.content,
    timestamp: new Date().toISOString()
  });
  const docRef = await addDoc(messagesRef, data);
  return docRef.id;
}
