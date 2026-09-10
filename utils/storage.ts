import * as SecureStore from 'expo-secure-store';

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: unknown): Promise<void> {
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    await SecureStore.setItemAsync(key, raw);
  } catch {
    // Non-critical storage failure; app continues with in-memory state.
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore
  }
}
