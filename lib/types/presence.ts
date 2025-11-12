/**
 * Presence Types
 * Types for real-time collaboration awareness
 */

export interface RemoteUser {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    start: number;
    end: number;
  };
  lastUpdate: Date;
}

export interface PresenceState {
  users: Record<string, RemoteUser>;
  currentUser: RemoteUser | null;
}
