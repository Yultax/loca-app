import type { ActionEntry } from './types';

const MAX_ENTRIES = 50;
let actions: ActionEntry[] = [];
let idCounter = 0;

export function addAction(entry: Omit<ActionEntry, 'id' | 'timestamp'>): ActionEntry {
  const action: ActionEntry = {
    ...entry,
    id: `action-${++idCounter}`,
    timestamp: new Date().toISOString(),
  };
  actions.unshift(action);
  if (actions.length > MAX_ENTRIES) actions = actions.slice(0, MAX_ENTRIES);
  return action;
}

export function getActions(limit = 10): ActionEntry[] {
  return actions.slice(0, limit);
}

export function clearActions(): void {
  actions = [];
  idCounter = 0;
}

// Phase dedup — prevent duplicate log entries during polling
const loggedPhases = new Map<string, string>();

export function shouldLogPhase(locaId: string, phase: string): boolean {
  if (loggedPhases.get(locaId) === phase) return false;
  loggedPhases.set(locaId, phase);
  return true;
}

export function clearPhaseLog(locaId: string): void {
  loggedPhases.delete(locaId);
}
