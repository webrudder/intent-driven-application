// ===== UI Schema =====
export interface UIComponent {
  type: 'card' | 'table' | 'chart' | 'form';
  title?: string;
  data: unknown;
  style?: Record<string, string | number>;
}

export interface UISchema {
  title: string;
  components: UIComponent[];
}

// ===== Intent =====
export interface IntentResult {
  intent: string;
  params: Record<string, unknown>;
  needUI: boolean;
  uiType: 'card' | 'table' | 'chart' | 'form' | 'mixed';
}

// ===== Run Intent =====
export interface RunIntentRequest {
  user_input: string;
}

export interface RunIntentResponse {
  uiSchema: UISchema | null;
  result: unknown;
  intent: string;
}

// ===== API =====
export interface ApiResponse<T> {
  code: number;
  data?: T;
  error?: string;
}

// ===== State =====
export type AppState = 'idle' | 'loading' | 'success' | 'error';

export interface StateData {
  state: AppState;
  uiSchema: UISchema | null;
  result: unknown;
  error: string | null;
  currentIntent: string;
}