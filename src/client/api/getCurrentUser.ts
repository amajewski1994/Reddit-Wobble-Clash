import type { UserResponse } from '../../shared/api';

export async function getCurrentUser(): Promise<string | null> {
  try {
    const response = await fetch('/api/user');

    if (!response.ok) return null;

    const result = (await response.json()) as UserResponse;

    return result.username;
  } catch {
    return null;
  }
}
