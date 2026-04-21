import { callLLM } from './llm';
import { cacheInstance } from '../config/cache';
import type { IntentResult, UISchema } from '../types';

const UI_SCHEMA_SYSTEM_PROMPT = `You are a UI Schema generator for Unreal Engine UMG (Unreal Motion Graphics). Given an intent and execution result data, generate a UI Schema that can be rendered in UE.

Required output format:
{
  "title": "page title describing the content",
  "components": [
    {
      "type": "card" | "table" | "chart" | "form",
      "title": "component title",
      "data": { the actual data to display },
      "style": { optional UE UMG style properties like fontSize, color, width, height }
    }
  ]
}

Component type mapping rules:
- Single numeric value or statistic → "card" type, data: { value: number, label: string, unit?: string }
- List/array of items → "table" type, data: { columns: [{key, label}], rows: [{key: value}] }
- Time series or trend data → "chart" type, data: { chartType: "line"|"bar"|"pie", series: [{name, data: [values]}], categories: [labels] }
- Form/input collection → "form" type, data: { fields: [{key, label, type, required}] }

Style defaults (UE UMG):
- fontSize: 14-18 for content, 24-28 for titles
- Use clean, minimal colors (dark background theme: #1a1a2e, accent: #0f3460)
- Layout: vertical stack for cards, full-width for tables/charts

Output MUST be valid JSON, no additional text.`;

export async function generateUISchema(intentResult: IntentResult, executionResult: unknown): Promise<UISchema> {
  const cacheKey = `ui:${intentResult.intent}:${JSON.stringify(executionResult)}`;
  const cached = cacheInstance.get<UISchema>(cacheKey);
  if (cached) return cached;

  const userPrompt = `Intent: ${intentResult.intent}
UI Type: ${intentResult.uiType}
Execution Result: ${JSON.stringify(executionResult)}
Please generate the UI Schema for displaying this result in UE UMG.`;

  const response = await callLLM(UI_SCHEMA_SYSTEM_PROMPT, userPrompt);

  let schema: UISchema;
  try {
    schema = JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      schema = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse UI Schema from LLM response');
    }
  }

  // Ensure required fields
  schema.title = schema.title || intentResult.intent;
  schema.components = schema.components || [];

  // Validate component types
  const validTypes = ['card', 'table', 'chart', 'form'];
  schema.components = schema.components.map(comp => ({
    ...comp,
    type: validTypes.includes(comp.type) ? comp.type : 'card',
  }));

  // Cache the result
  cacheInstance.set(cacheKey, schema);

  return schema;
}