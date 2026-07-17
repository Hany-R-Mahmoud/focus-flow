/**
 * IndexedDB persistence layer for FocusSessionFlow
 * Handles all local data storage and retrieval
 */

export interface SessionTemplate {
  id: string;
  name: string;
  duration: number; // in minutes
  description: string;
  color: string; // hex color
  createdAt: number;
}

export interface Distraction {
  id: string;
  sessionId: string;
  time: number; // timestamp
  category: string; // e.g., "phone", "email", "thoughts", "other"
  note: string;
}

export interface FocusSession {
  id: string;
  templateId: string;
  templateName: string;
  startTime: number; // timestamp
  endTime: number | null; // null if not finished
  pausedTime: number; // total paused duration in ms
  taskIntention: string;
  outcome: string;
  distractions: Distraction[];
  status: "active" | "paused" | "completed" | "abandoned";
  createdAt: number;
}

export interface DailyReview {
  id: string;
  date: string; // YYYY-MM-DD
  sessionsCompleted: number;
  totalFocusTime: number; // in minutes
  notes: string;
  createdAt: number;
}

export interface GroupSession {
  id: string;
  payloadVersion: number;
  title: string;
  sharedObjective?: string;
  startsAt: string; // ISO 8601
  focusMinutes: number;
  breakMinutes?: number;
  meetingUrl?: string;
  organizerName?: string;
  openingMessage?: string;
  source: "created" | "joined";
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = "FocusSessionFlow";
const DB_VERSION = 2;

const STORES = {
  TEMPLATES: "sessionTemplates",
  SESSIONS: "focusSessions",
  REVIEWS: "dailyReviews",
  GROUP_SESSIONS: "groupSessions",
};

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!database.objectStoreNames.contains(STORES.TEMPLATES)) {
        const templateStore = database.createObjectStore(STORES.TEMPLATES, {
          keyPath: "id",
        });
        templateStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionStore = database.createObjectStore(STORES.SESSIONS, {
          keyPath: "id",
        });
        sessionStore.createIndex("startTime", "startTime", { unique: false });
        sessionStore.createIndex("status", "status", { unique: false });
        sessionStore.createIndex("templateId", "templateId", { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.REVIEWS)) {
        const reviewStore = database.createObjectStore(STORES.REVIEWS, {
          keyPath: "id",
        });
        reviewStore.createIndex("date", "date", { unique: true });
      }

      if (!database.objectStoreNames.contains(STORES.GROUP_SESSIONS)) {
        const groupStore = database.createObjectStore(STORES.GROUP_SESSIONS, {
          keyPath: "id",
        });
        groupStore.createIndex("startsAt", "startsAt", { unique: false });
        groupStore.createIndex("source", "source", { unique: false });
        groupStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

function getDB(): IDBDatabase {
  if (!db) throw new Error("Database not initialized. Call initDB() first.");
  return db;
}

// Template operations
export async function createTemplate(
  template: Omit<SessionTemplate, "id" | "createdAt">
): Promise<SessionTemplate> {
  const database = getDB();
  const newTemplate: SessionTemplate = {
    ...template,
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TEMPLATES], "readwrite");
    const store = transaction.objectStore(STORES.TEMPLATES);
    const request = store.add(newTemplate);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(newTemplate);
  });
}

export async function getTemplates(): Promise<SessionTemplate[]> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TEMPLATES], "readonly");
    const store = transaction.objectStore(STORES.TEMPLATES);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () =>
      resolve(request.result.sort((a, b) => a.createdAt - b.createdAt));
  });
}

export async function getTemplate(id: string): Promise<SessionTemplate | null> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TEMPLATES], "readonly");
    const store = transaction.objectStore(STORES.TEMPLATES);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function updateTemplate(
  id: string,
  updates: Partial<Omit<SessionTemplate, "id" | "createdAt">>
): Promise<SessionTemplate> {
  const database = getDB();
  const existing = await getTemplate(id);
  if (!existing) throw new Error(`Template ${id} not found`);

  const updated = { ...existing, ...updates };
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TEMPLATES], "readwrite");
    const store = transaction.objectStore(STORES.TEMPLATES);
    const request = store.put(updated);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TEMPLATES], "readwrite");
    const store = transaction.objectStore(STORES.TEMPLATES);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Session operations
export async function createSession(
  session: Omit<FocusSession, "id" | "createdAt">
): Promise<FocusSession> {
  const database = getDB();
  const newSession: FocusSession = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.SESSIONS);
    const request = store.add(newSession);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(newSession);
  });
}

export async function getSessions(): Promise<FocusSession[]> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SESSIONS], "readonly");
    const store = transaction.objectStore(STORES.SESSIONS);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () =>
      resolve(request.result.sort((a, b) => b.startTime - a.startTime));
  });
}

export async function getSession(id: string): Promise<FocusSession | null> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SESSIONS], "readonly");
    const store = transaction.objectStore(STORES.SESSIONS);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function updateSession(
  id: string,
  updates: Partial<Omit<FocusSession, "id" | "createdAt">>
): Promise<FocusSession> {
  const database = getDB();
  const existing = await getSession(id);
  if (!existing) throw new Error(`Session ${id} not found`);

  const updated = { ...existing, ...updates };
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.SESSIONS);
    const request = store.put(updated);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
}

export async function deleteSession(id: string): Promise<void> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.SESSIONS);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getSessionsByDate(date: string): Promise<FocusSession[]> {
  const sessions = await getSessions();
  const dateStart = new Date(date).getTime();
  const dateEnd = dateStart + 24 * 60 * 60 * 1000;
  return sessions.filter(
    (s) => s.startTime >= dateStart && s.startTime < dateEnd
  );
}

// Review operations
export async function createReview(
  review: Omit<DailyReview, "id" | "createdAt">
): Promise<DailyReview> {
  const database = getDB();
  const newReview: DailyReview = {
    ...review,
    id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.REVIEWS], "readwrite");
    const store = transaction.objectStore(STORES.REVIEWS);
    const request = store.add(newReview);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(newReview);
  });
}

export async function getReviews(): Promise<DailyReview[]> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.REVIEWS], "readonly");
    const store = transaction.objectStore(STORES.REVIEWS);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () =>
      resolve(request.result.sort((a, b) => b.date.localeCompare(a.date)));
  });
}

export async function getReview(date: string): Promise<DailyReview | null> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.REVIEWS], "readonly");
    const store = transaction.objectStore(STORES.REVIEWS);
    const index = store.index("date");
    const request = index.get(date);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function updateReview(
  date: string,
  updates: Partial<Omit<DailyReview, "id" | "createdAt" | "date">>
): Promise<DailyReview> {
  const database = getDB();
  const existing = await getReview(date);
  if (!existing) throw new Error(`Review for ${date} not found`);

  const updated = { ...existing, ...updates };
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.REVIEWS], "readwrite");
    const store = transaction.objectStore(STORES.REVIEWS);
    const request = store.put(updated);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
}

// Group session operations
export async function createGroupSession(
  session: Omit<GroupSession, "id" | "createdAt" | "updatedAt">
): Promise<GroupSession> {
  const database = getDB();
  const now = new Date().toISOString();
  const newSession: GroupSession = {
    ...session,
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.GROUP_SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.GROUP_SESSIONS);
    const request = store.add(newSession);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(newSession);
  });
}

export async function getGroupSessions(): Promise<GroupSession[]> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.GROUP_SESSIONS], "readonly");
    const store = transaction.objectStore(STORES.GROUP_SESSIONS);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () =>
      resolve(request.result.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()));
  });
}

export async function getGroupSession(id: string): Promise<GroupSession | null> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.GROUP_SESSIONS], "readonly");
    const store = transaction.objectStore(STORES.GROUP_SESSIONS);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function updateGroupSession(
  id: string,
  updates: Partial<Omit<GroupSession, "id" | "createdAt">>
): Promise<GroupSession> {
  const database = getDB();
  const existing = await getGroupSession(id);
  if (!existing) throw new Error(`Group session ${id} not found`);

  const updated: GroupSession = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.GROUP_SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.GROUP_SESSIONS);
    const request = store.put(updated);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
}

export async function deleteGroupSession(id: string): Promise<void> {
  const database = getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.GROUP_SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.GROUP_SESSIONS);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Seeding function
export async function seedDatabase(): Promise<void> {
  try {
    const { generateSeedData } = await import("./seed");
    const { groupSessions: seedGroupSessions } = generateSeedData();
    
    // Check if group sessions already exist
    const existing = await getGroupSessions();
    if (existing.length > 0) {
      return; // Already seeded
    }

    // Add seed group sessions
    for (const session of seedGroupSessions) {
      await createGroupSession(session);
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

// Export/Import (updated for group sessions)
export async function exportData(): Promise<{
  templates: SessionTemplate[];
  sessions: FocusSession[];
  reviews: DailyReview[];
  groupSessions?: GroupSession[];
}> {
  const [templates, sessions, reviews, groupSessions] = await Promise.all([
    getTemplates(),
    getSessions(),
    getReviews(),
    getGroupSessions(),
  ]);

  return { templates, sessions, reviews, groupSessions };
}

export async function importData(data: {
  templates?: SessionTemplate[];
  sessions?: FocusSession[];
  reviews?: DailyReview[];
  groupSessions?: GroupSession[];
}): Promise<void> {
  const database = getDB();

  // Clear existing data
  const transaction = database.transaction(
    [STORES.TEMPLATES, STORES.SESSIONS, STORES.REVIEWS, STORES.GROUP_SESSIONS],
    "readwrite"
  );
  transaction.objectStore(STORES.TEMPLATES).clear();
  transaction.objectStore(STORES.SESSIONS).clear();
  transaction.objectStore(STORES.REVIEWS).clear();
  transaction.objectStore(STORES.GROUP_SESSIONS).clear();

  // Import new data
  if (data.templates) {
    for (const template of data.templates) {
      transaction.objectStore(STORES.TEMPLATES).add(template);
    }
  }
  if (data.sessions) {
    for (const session of data.sessions) {
      transaction.objectStore(STORES.SESSIONS).add(session);
    }
  }
  if (data.reviews) {
    for (const review of data.reviews) {
      transaction.objectStore(STORES.REVIEWS).add(review);
    }
  }
  if (data.groupSessions) {
    for (const groupSession of data.groupSessions) {
      transaction.objectStore(STORES.GROUP_SESSIONS).add(groupSession);
    }
  }

  return new Promise((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const database = getDB();
  const transaction = database.transaction(
    [STORES.TEMPLATES, STORES.SESSIONS, STORES.REVIEWS, STORES.GROUP_SESSIONS],
    "readwrite"
  );

  transaction.objectStore(STORES.TEMPLATES).clear();
  transaction.objectStore(STORES.SESSIONS).clear();
  transaction.objectStore(STORES.REVIEWS).clear();
  transaction.objectStore(STORES.GROUP_SESSIONS).clear();

  return new Promise((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}
