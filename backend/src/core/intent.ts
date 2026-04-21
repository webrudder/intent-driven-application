import { callLLM } from './llm';
import { getByIntent } from '../db/skillStore';
import { cacheInstance } from '../config/cache';
import type { IntentResult, Skill } from '../types';

const INTENT_SYSTEM_PROMPT = `You are an intent parsing engine. Given a user's natural language input, analyze it and output a structured JSON result.

Required output format:
{
  "intent": "a short identifier for the intent (e.g., query_order_amount, generate_sales_report)",
  "params": { key-value pairs extracted from the input },
  "needUI": true/false (whether a UI interface is needed to display results),
  "uiType": "card" | "table" | "chart" | "form" | "mixed" (the best UI component type for displaying the result)
}

Rules:
- intent should be a concise, descriptive identifier in lowercase with underscores
- params should extract all relevant data from the input (dates, names, quantities, etc.)
- needUI should be true if the result needs visual display, false for simple text answers
- uiType mapping: single number/statistic → card, list of items → table, trend/time-series → chart, input collection → form, multiple types → mixed
- Output MUST be valid JSON, no additional text`;

export async function parseIntent(userInput: string): Promise<IntentResult> {
  // Check cache
  const cacheKey = `intent:${userInput}`;
  const cached = cacheInstance.get<IntentResult>(cacheKey);
  if (cached) return cached;

  const response = await callLLM(INTENT_SYSTEM_PROMPT, userInput);

  let parsed: IntentResult;
  try {
    parsed = JSON.parse(response);
  } catch {
    // Fallback: try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse intent from LLM response');
    }
  }

  // Ensure required fields exist with defaults
  parsed.intent = parsed.intent || 'unknown_intent';
  parsed.params = parsed.params || {};
  parsed.needUI = parsed.needUI !== undefined ? parsed.needUI : true;
  parsed.uiType = parsed.uiType || 'card';

  // Cache the result
  cacheInstance.set(cacheKey, parsed);

  return parsed;
}

export async function matchIntent(intent: string): Promise<Skill | null> {
  return getByIntent(intent);
}