// ===== LLM Config =====
export interface LLMConfig {
  id: string;
  name: string;
  apiKey: string;       // decrypted when returned, encrypted in DB
  baseUrl: string;
  model: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface LLMConfigCreateInput {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  isDefault?: boolean;
}

export interface LLMConfigUpdateInput {
  name?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  enabled?: boolean;
  isDefault?: boolean;
}

// ===== Skill =====
export interface Skill {
  id: string;
  name: string;
  intent: string;
  code: string;
  inputSchema: string;   // JSON string
  outputSchema: string;  // JSON string
  version: number;
  enabled: boolean;
  description: string;
  createdAt: string;
}

export interface SkillCreateInput {
  name: string;
  intent: string;
  code: string;
  inputSchema?: string;
  outputSchema?: string;
  version?: number;
  description?: string;
}

export interface SkillUpdateInput {
  name?: string;
  intent?: string;
  code?: string;
  inputSchema?: string;
  outputSchema?: string;
  version?: number;
  enabled?: boolean;
  description?: string;
}

// ===== Intent =====
export interface IntentResult {
  intent: string;
  params: Record<string, unknown>;
  needUI: boolean;
  uiType: 'card' | 'table' | 'chart' | 'form' | 'mixed';
}

// ===== UI Schema =====
export interface UIComponent {
  type: 'card' | 'table' | 'chart' | 'form';
  title?: string;
  data: unknown;
  style?: Record<string, unknown>;
}

export interface UISchema {
  title: string;
  components: UIComponent[];
}

// ===== Logs =====
export interface OperationLog {
  id: string;
  operator: string;
  type: string;
  content: string;
  result: string;
  createdAt: string;
}

export interface LLMCallLog {
  id: string;
  modelName: string;
  intent: string | null;
  userInput: string | null;
  responseTime: number;
  result: string;
  requestParams: string | null;
  responseContent: string | null;
  createdAt: string;
}

// ===== API =====
export interface ApiResponse<T> {
  code: number;
  data?: T;
  error?: string;
}

export interface RunIntentRequest {
  user_input: string;
}

export interface RunIntentResponse {
  uiSchema: UISchema | null;
  result: unknown;
  intent: string;
}

// ===== Auth =====
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export interface JwtPayload {
  username: string;
  role: 'admin';
  iat: number;
  exp: number;
}

// ===== Pagination =====
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}