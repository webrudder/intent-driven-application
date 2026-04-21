import OpenAI from 'openai';
import * as llmConfigDb from '../db/llmConfig';
import * as logDb from '../db/log';
import { retryFn } from '../utils/retry';
import { cacheInstance } from '../config/cache';
import type { LLMConfig } from '../types';

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const defaultConfig = llmConfigDb.getDefault();
  if (!defaultConfig) {
    throw new Error('No default LLM model configured. Please add and enable a model in the admin panel.');
  }
  return callLLMWithConfig(defaultConfig, systemPrompt, userPrompt);
}

export async function callLLMWithModel(modelId: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const modelConfig = llmConfigDb.getById(modelId);
  if (!modelConfig) {
    throw new Error(`LLM model not found: ${modelId}`);
  }
  if (!modelConfig.enabled) {
    throw new Error(`LLM model is disabled: ${modelConfig.name}`);
  }
  return callLLMWithConfig(modelConfig, systemPrompt, userPrompt);
}

async function callLLMWithConfig(
  modelConfig: LLMConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const startTime = Date.now();
  let result: string = '';
  let success = true;
  let errorMsg = '';

  // Check cache first
  const cacheKey = `llm:${modelConfig.id}:${systemPrompt}:${userPrompt}`;
  const cached = cacheInstance.get<string>(cacheKey);
  if (cached) {
    return cached;
  }

  const client = new OpenAI({
    apiKey: modelConfig.apiKey,
    baseURL: modelConfig.baseUrl,
  });

  try {
    result = await retryFn(async () => {
      const response = await client.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }
      return content;
    }, 1, 1000);

    // Cache the result
    cacheInstance.set(cacheKey, result);
  } catch (e) {
    success = false;
    errorMsg = (e as Error).message;
    throw e;
  } finally {
    // Log the call regardless of success/failure
    const responseTime = Date.now() - startTime;
    logDb.addLLMCallLog(
      modelConfig.name,
      null,
      userPrompt,
      responseTime,
      success ? 'success' : 'failed',
      JSON.stringify({ system: systemPrompt, model: modelConfig.model }),
      success ? result : errorMsg
    );
  }

  return result;
}