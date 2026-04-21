import type { RunIntentRequest, RunIntentResponse, ApiResponse } from './Types';

// Configuration — should be set from UE side or config file
let SERVER_URL = 'http://localhost:8700/api/v1/run-intent';
let authToken = '';

export function setServerUrl(url: string): void {
  SERVER_URL = url;
}

export function setToken(token: string): void {
  authToken = token;
}

export function getToken(): string {
  return authToken;
}

export async function postRunIntent(userInput: string): Promise<RunIntentResponse> {
  const requestBody: RunIntentRequest = { user_input: userInput };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Use UE's HttpModule or Puerts-compatible fetch
  // This implementation uses a generic HTTP request pattern
  // that can be adapted to UE's HttpRequest or browser fetch
  const response = await httpRequest('POST', SERVER_URL, requestBody, headers);

  if (response.code !== 0) {
    throw new Error(response.error || '请求失败，请重试');
  }

  return response.data as RunIntentResponse;
}

// Generic HTTP request function — to be adapted for UE environment
// In Puerts/UE, replace with UE.HttpRequest implementation
async function httpRequest(
  method: string,
  url: string,
  body: unknown,
  headers: Record<string, string>
): Promise<ApiResponse<RunIntentResponse>> {
  // Placeholder: in actual UE deployment, replace this with:
  // - UE's FHttpModule synchronous/asynchronous request
  // - Or Puerts bridge to UE's network module
  //
  // For development/testing in browser context:
  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  return response.json();
}