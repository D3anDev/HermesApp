
const GREETING_CACHE_KEY = 'hermes_usedGreetings';
const MAX_CACHE_SIZE = 20; // Number of unique greetings to remember

interface UsedGreeting {
  id: string;
  timestamp: number;
}

export const loadUsedGreetings = (): UsedGreeting[] => {
  try {
    const cached = localStorage.getItem(GREETING_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error("Failed to load used greetings from localStorage:", error);
    return [];
  }
};

export const saveUsedGreetings = (greetings: UsedGreeting[]): void => {
  try {
    localStorage.setItem(GREETING_CACHE_KEY, JSON.stringify(greetings));
  } catch (error) {
    console.error("Failed to save used greetings to localStorage:", error);
  }
};

export const addUsedGreeting = (id: string): void => {
  let used = loadUsedGreetings();
  
  // Remove existing entry if it's already in the list to move it to the end (most recent)
  used = used.filter(g => g.id !== id);

  used.push({ id, timestamp: Date.now() });

  // Keep only the last MAX_CACHE_SIZE greetings
  if (used.length > MAX_CACHE_SIZE) {
    used = used.slice(used.length - MAX_CACHE_SIZE);
  }
  saveUsedGreetings(used);
};

export const isGreetingRecentlyUsed = (id: string): boolean => {
  const used = loadUsedGreetings();
  return used.some(g => g.id === id);
};

export const clearUsedGreetingsCache = (): void => {
  localStorage.removeItem(GREETING_CACHE_KEY);
};
