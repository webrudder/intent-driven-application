import { Request, Response } from 'express';
import { parseIntent, matchIntent } from '../core/intent';
import { generateSkill, executeSkill } from '../core/skill';
import { generateUISchema } from '../core/ui';
import type { ApiResponse, RunIntentRequest, RunIntentResponse } from '../types';

export async function runIntentHandler(req: Request, res: Response<ApiResponse<RunIntentResponse>>): Promise<void> {
  const { user_input } = req.body as RunIntentRequest;

  if (!user_input || user_input.trim().length === 0) {
    res.json({ code: -1, error: 'Please enter your request' });
    return;
  }

  try {
    // Step 1: Parse intent
    const intentResult = await parseIntent(user_input.trim());

    // Step 2: Match or generate skill
    let skill = await matchIntent(intentResult.intent);
    if (!skill) {
      skill = await generateSkill(intentResult);
    }

    // Step 3: Execute skill
    const executionResult = executeSkill(skill, intentResult.params);

    // Handle async execution results
    const resolvedResult = executionResult && typeof (executionResult as any).then === 'function'
      ? await executionResult
      : executionResult;

    // Step 4: Generate UI Schema (if needed)
    let uiSchema = null;
    if (intentResult.needUI) {
      uiSchema = await generateUISchema(intentResult, resolvedResult);
    }

    res.json({
      code: 0,
      data: {
        uiSchema,
        result: resolvedResult,
        intent: intentResult.intent,
      },
    });
  } catch (e) {
    const error = (e as Error).message;
    res.json({
      code: -1,
      error: `Processing failed: ${error}. Please try again.`,
    });
  }
}