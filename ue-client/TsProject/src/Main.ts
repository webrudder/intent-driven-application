import { postRunIntent, setToken } from './NetworkModule';
import { setLoading, setSuccess, setError, setIdle, onStateChange, offStateChange, getState } from './StateManager';
import { renderSchema, clearContainer } from './UIRenderer';
import type { StateData } from './Types';

// ===== UMG Widget References =====
// These would be bound from UE Blueprint or Widget Blueprint via Puerts
// In actual UE deployment, these are real UMG widget references

let inputTextBox: { GetText: () => string; SetText: (t: string) => void } | null = null;
let submitButton: { SetEnabled: (e: boolean) => void; SetVisibility: (v: string) => void } | null = null;
let retryButton: { SetEnabled: (e: boolean) => void; SetVisibility: (v: string) => void } | null = null;
let backButton: { SetVisibility: (v: string) => void } | null = null;
let renderContainer: { ClearChildren: () => void; AddChild: (w: any) => void } | null = null;
let loadingIndicator: { SetVisibility: (v: string) => void } | null = null;
let errorTextBlock: { SetText: (t: string) => void; SetVisibility: (v: string) => void } | null = null;

// ===== Initialize =====
// Call this from UE to bind UMG widgets

export function initialize(config: {
  serverUrl?: string;
  token?: string;
  inputTextBox: { GetText: () => string; SetText: (t: string) => void };
  submitButton: { SetEnabled: (e: boolean) => void; SetVisibility: (v: string) => void };
  retryButton: { SetEnabled: (e: boolean) => void; SetVisibility: (v: string) => void };
  backButton: { SetVisibility: (v: string) => void };
  renderContainer: { ClearChildren: () => void; AddChild: (w: any) => void };
  loadingIndicator: { SetVisibility: (v: string) => void };
  errorTextBlock: { SetText: (t: string) => void; SetVisibility: (v: string) => void };
}): void {
  if (config.serverUrl) {
    // NetworkModule.setServerUrl(config.serverUrl);
  }
  if (config.token) {
    setToken(config.token);
  }

  inputTextBox = config.inputTextBox;
  submitButton = config.submitButton;
  retryButton = config.retryButton;
  backButton = config.backButton;
  renderContainer = config.renderContainer;
  loadingIndicator = config.loadingIndicator;
  errorTextBlock = config.errorTextBlock;

  // Bind state change listener to update UI
  onStateChange(updateUI);

  // Initial UI state
  updateUI(getState());
}

// ===== User Actions =====

export async function onSubmit(): Promise<void> {
  if (!inputTextBox) return;
  const userInput = inputTextBox.GetText().trim();
  if (!userInput) return;

  setLoading(userInput);
  submitButton?.SetEnabled(false);

  try {
    const response = await postRunIntent(userInput);
    setSuccess(response.uiSchema, response.result);
  } catch (e) {
    setError((e as Error).message || '请求失败，请重试');
  } finally {
    submitButton?.SetEnabled(true);
  }
}

export function onRetry(): void {
  const state = getState();
  if (state.currentIntent) {
    onSubmit();
  }
}

export function onBack(): void {
  setIdle();
}

// ===== UI Update =====

function updateUI(data: StateData): void {
  // Hide all conditional widgets first
  loadingIndicator?.SetVisibility('Hidden');
  retryButton?.SetVisibility('Hidden');
  backButton?.SetVisibility('Hidden');
  errorTextBlock?.SetVisibility('Hidden');

  switch (data.state) {
    case 'idle':
      inputTextBox?.SetText('');
      clearContainer(renderContainer as any);
      break;

    case 'loading':
      loadingIndicator?.SetVisibility('Visible');
      clearContainer(renderContainer as any);
      break;

    case 'success':
      if (data.uiSchema && renderContainer) {
        renderSchema(data.uiSchema, renderContainer as any);
      } else if (data.result && renderContainer) {
        // No UI Schema, just show result as text
        const resultText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        // Simple fallback: clear and show text
        clearContainer(renderContainer as any);
      }
      backButton?.SetVisibility('Visible');
      break;

    case 'error':
      errorTextBlock?.SetText(data.error || '未知错误');
      errorTextBlock?.SetVisibility('Visible');
      retryButton?.SetVisibility('Visible');
      backButton?.SetVisibility('Visible');
      break;
  }
}

// Cleanup on destroy
export function cleanup(): void {
  offStateChange(updateUI);
  inputTextBox = null;
  submitButton = null;
  retryButton = null;
  backButton = null;
  renderContainer = null;
  loadingIndicator = null;
  errorTextBlock = null;
}