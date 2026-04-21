import { callLLM } from './llm';
import * as skillStore from '../db/skillStore';
import { validateSkillCode, validateJSON, wrapSkillCode } from '../utils/validate';
import { cacheInstance } from '../config/cache';
import type { Skill, IntentResult } from '../types';

const SKILL_GENERATE_SYSTEM_PROMPT = `You are a Skill code generator. Given an intent and its parameters, generate a TypeScript function that can execute the skill and return results.

Required output format:
{
  "name": "descriptive skill name",
  "code": "a TypeScript function. The function receives 'params' as input and must return a result. Use async/await if needed. Example: function(params) { return { value: 12345.67, label: \"今日订单总额\", unit: \"元\" }; }",
  "inputSchema": "JSON Schema describing the expected input parameters",
  "outputSchema": "JSON Schema describing the expected output format",
  "description": "brief description of what this skill does"
}

Rules:
- The function must be self-contained and not import external modules
- Do NOT use fs, child_process, require, process, or any system-level APIs
- The function should simulate or mock data retrieval for demonstration purposes
- Output MUST be valid JSON`;

export async function matchSkill(intent: string): Promise<Skill | null> {
  const cacheKey = `skill:match:${intent}`;
  const cached = cacheInstance.get<Skill | null>(cacheKey);
  if (cached !== undefined) return cached;

  const skill = skillStore.getByIntent(intent);
  cacheInstance.set(cacheKey, skill);
  return skill;
}

export async function generateSkill(intentResult: IntentResult): Promise<Skill> {
  const userPrompt = `Intent: ${intentResult.intent}\nParameters: ${JSON.stringify(intentResult.params)}\nUI Type: ${intentResult.uiType}\nPlease generate a skill that handles this intent.`;

  const response = await callLLM(SKILL_GENERATE_SYSTEM_PROMPT, userPrompt);

  let parsed: any;
  try {
    parsed = JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse skill from LLM response');
    }
  }

  // Validate generated code
  const codeValidation = validateSkillCode(parsed.code || '');
  if (!codeValidation.valid) {
    throw new Error(`Generated skill code is invalid: ${codeValidation.error}`);
  }

  // Save to skill store
  const skill = skillStore.create({
    name: parsed.name || intentResult.intent,
    intent: intentResult.intent,
    code: parsed.code,
    inputSchema: typeof parsed.inputSchema === 'string' ? parsed.inputSchema : JSON.stringify(parsed.inputSchema || {}),
    outputSchema: typeof parsed.outputSchema === 'string' ? parsed.outputSchema : JSON.stringify(parsed.outputSchema || {}),
    version: 1,
    description: parsed.description || '',
  });

  // Invalidate skill match cache for this intent
  cacheInstance.del(`skill:match:${intentResult.intent}`);

  return skill;
}

export function executeSkill(skill: Skill, params: Record<string, unknown>): unknown {
  // Validate input params against schema
  if (skill.inputSchema && skill.inputSchema !== '{}') {
    const schemaValidation = validateJSON(skill.inputSchema);
    if (!schemaValidation.valid) {
      throw new Error(`Invalid input schema: ${schemaValidation.error}`);
    }
  }

  // Validate code before execution
  const codeValidation = validateSkillCode(skill.code);
  if (!codeValidation.valid) {
    throw new Error(`Skill code validation failed: ${codeValidation.error}`);
  }

  // Wrap skill code for execution via new Function
  const wrappedCode = wrapSkillCode(skill.code);

  // Create sandboxed execution context with params as first arg
  const sandboxContext = {
    params,
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Map,
    Set,
    parseInt,
    parseFloat,
    isNaN,
    encodeURIComponent,
    decodeURIComponent,
  };

  try {
    const fn = new Function(
      ...Object.keys(sandboxContext),
      wrappedCode
    );

    const result = fn(...Object.values(sandboxContext));

    // Handle async functions
    if (result && typeof result.then === 'function') {
      return result;
    }

    return result;
  } catch (e) {
    throw new Error(`Skill execution error: ${(e as Error).message}`);
  }
}