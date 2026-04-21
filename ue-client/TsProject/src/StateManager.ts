import type { AppState, StateData, UISchema } from './Types';

type StateChangeCallback = (data: StateData) => void;

const initialState: StateData = {
  state: 'idle',
  uiSchema: null,
  result: null,
  error: null,
  currentIntent: '',
};

let currentData: StateData = { ...initialState };
let listeners: StateChangeCallback[] = [];

export function getState(): StateData {
  return currentData;
}

export function setState(state: AppState, extras?: Partial<StateData>): void {
  currentData = {
    ...currentData,
    state,
    ...extras,
  };
  notifyListeners();
}

export function resetState(): void {
  currentData = { ...initialState };
  notifyListeners();
}

export function onStateChange(callback: StateChangeCallback): void {
  listeners.push(callback);
}

export function offStateChange(callback: StateChangeCallback): void {
  listeners = listeners.filter(l => l !== callback);
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(currentData);
  }
}

// Convenience state setters
export function setLoading(intent: string): void {
  setState('loading', { currentIntent: intent, error: null });
}

export function setSuccess(uiSchema: UISchema | null, result: unknown): void {
  setState('success', { uiSchema, result, error: null });
}

export function setError(error: string): void {
  setState('error', { error });
}

export function setIdle(): void {
  resetState();
}