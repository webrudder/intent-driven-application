import { Request, Response } from 'express';
import * as llmConfigDb from '../db/llmConfig';
import * as skillStoreDb from '../db/skillStore';
import * as logDb from '../db/log';
import { callLLMWithModel } from '../core/llm';
import { executeSkill } from '../core/skill';
import { validateSkillCode, validateJSON, validateURL, validateNotEmpty } from '../utils/validate';
import { addOperationLog } from '../db/log';
import type { ApiResponse, LLMConfig, Skill } from '../types';

function getOperator(req: Request): string {
  return (req as any).user?.username || 'unknown';
}

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return typeof val === 'string' ? val : val[0];
}

// ===== LLM Config =====

export function listLLMConfigs(req: Request, res: Response<ApiResponse<any>>): void {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const result = llmConfigDb.getAll(page, pageSize);
  res.json({ code: 0, data: result });
}

export function createLLMConfig(req: Request, res: Response<ApiResponse<LLMConfig>>): void {
  const { name, apiKey, baseUrl, model, isDefault } = req.body;

  const nameCheck = validateNotEmpty(name, 'Name');
  if (!nameCheck.valid) { res.json({ code: -1, error: nameCheck.error }); return; }
  const keyCheck = validateNotEmpty(apiKey, 'API Key');
  if (!keyCheck.valid) { res.json({ code: -1, error: keyCheck.error }); return; }
  const urlCheck = validateURL(baseUrl);
  if (!urlCheck.valid) { res.json({ code: -1, error: urlCheck.error }); return; }
  const modelCheck = validateNotEmpty(model, 'Model');
  if (!modelCheck.valid) { res.json({ code: -1, error: modelCheck.error }); return; }

  const config = llmConfigDb.create({ name, apiKey, baseUrl, model, isDefault });
  addOperationLog(getOperator(req), 'create_llm', `Created LLM config: ${name}`, 'success');
  res.json({ code: 0, data: config });
}

export function updateLLMConfig(req: Request, res: Response<ApiResponse<LLMConfig>>): void {
  const id = getParam(req, 'id');
  const input = req.body;

  if (input.baseUrl) {
    const urlCheck = validateURL(input.baseUrl);
    if (!urlCheck.valid) { res.json({ code: -1, error: urlCheck.error }); return; }
  }

  const config = llmConfigDb.update(id, input);
  if (!config) { res.json({ code: -1, error: 'Update failed. Model may not exist or default model cannot be disabled.' }); return; }

  addOperationLog(getOperator(req), 'update_llm', `Updated LLM config: ${id}`, 'success');
  res.json({ code: 0, data: config });
}

export function deleteLLMConfig(req: Request, res: Response<ApiResponse<never>>): void {
  const id = getParam(req, 'id');
  const success = llmConfigDb.deleteConfig(id);
  if (!success) {
    res.json({ code: -1, error: 'Delete failed. Default model cannot be deleted.' });
    return;
  }

  addOperationLog(getOperator(req), 'delete_llm', `Deleted LLM config: ${id}`, 'success');
  res.json({ code: 0 });
}

export function toggleLLMEnable(req: Request, res: Response<ApiResponse<LLMConfig>>): void {
  const id = getParam(req, 'id');
  const { enabled } = req.body;
  const config = llmConfigDb.toggleEnable(id, enabled);
  if (!config) { res.json({ code: -1, error: 'Model not found' }); return; }

  addOperationLog(getOperator(req), 'toggle_llm', `Set LLM ${id} enabled=${enabled}`, 'success');
  res.json({ code: 0, data: config });
}

export function setDefaultLLM(req: Request, res: Response<ApiResponse<LLMConfig>>): void {
  const id = getParam(req, 'id');
  const config = llmConfigDb.setDefault(id);
  if (!config) { res.json({ code: -1, error: 'Failed to set default. Model may be disabled or not found.' }); return; }

  addOperationLog(getOperator(req), 'set_default_llm', `Set default LLM: ${id}`, 'success');
  res.json({ code: 0, data: config });
}

export async function testLLMConfig(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  const id = getParam(req, 'id');
  const config = llmConfigDb.getById(id);
  if (!config) { res.json({ code: -1, error: 'Model not found' }); return; }

  try {
    const result = await callLLMWithModel(id, 'Reply with a simple JSON: {"status":"ok"}', 'Test connection');
    res.json({ code: 0, data: { success: true, message: 'Model call successful', response: result } });
  } catch (e) {
    res.json({ code: 0, data: { success: false, message: `Model call failed: ${(e as Error).message}` } });
  }
}

// ===== Skill Management =====

export function listSkills(req: Request, res: Response<ApiResponse<any>>): void {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const intent = req.query.intent as string;
  const status = req.query.status as string;
  const result = skillStoreDb.getAll(page, pageSize, intent, status);
  res.json({ code: 0, data: result });
}

export function createSkill(req: Request, res: Response<ApiResponse<Skill>>): void {
  const { name, intent, code, inputSchema, outputSchema, version, description } = req.body;

  const nameCheck = validateNotEmpty(name, 'Skill name');
  if (!nameCheck.valid) { res.json({ code: -1, error: nameCheck.error }); return; }
  const intentCheck = validateNotEmpty(intent, 'Intent');
  if (!intentCheck.valid) { res.json({ code: -1, error: intentCheck.error }); return; }
  const codeCheck = validateNotEmpty(code, 'Skill code');
  if (!codeCheck.valid) { res.json({ code: -1, error: codeCheck.error }); return; }

  const skillCodeCheck = validateSkillCode(code);
  if (!skillCodeCheck.valid) { res.json({ code: -1, error: skillCodeCheck.error }); return; }

  if (inputSchema) {
    const schemaCheck = validateJSON(inputSchema);
    if (!schemaCheck.valid) { res.json({ code: -1, error: `Input schema: ${schemaCheck.error}` }); return; }
  }

  if (outputSchema) {
    const schemaCheck = validateJSON(outputSchema);
    if (!schemaCheck.valid) { res.json({ code: -1, error: `Output schema: ${schemaCheck.error}` }); return; }
  }

  const skill = skillStoreDb.create({ name, intent, code, inputSchema, outputSchema, version, description });
  addOperationLog(getOperator(req), 'create_skill', `Created skill: ${name}`, 'success');
  res.json({ code: 0, data: skill });
}

export function updateSkill(req: Request, res: Response<ApiResponse<Skill>>): void {
  const id = getParam(req, 'id');
  const input = req.body;

  if (input.code) {
    const codeCheck = validateSkillCode(input.code);
    if (!codeCheck.valid) { res.json({ code: -1, error: codeCheck.error }); return; }
  }

  if (input.inputSchema) {
    const schemaCheck = validateJSON(input.inputSchema);
    if (!schemaCheck.valid) { res.json({ code: -1, error: `Input schema: ${schemaCheck.error}` }); return; }
  }

  if (input.outputSchema) {
    const schemaCheck = validateJSON(input.outputSchema);
    if (!schemaCheck.valid) { res.json({ code: -1, error: `Output schema: ${schemaCheck.error}` }); return; }
  }

  const skill = skillStoreDb.update(id, input);
  if (!skill) { res.json({ code: -1, error: 'Update failed. Skill may not exist or version cannot decrease.' }); return; }

  addOperationLog(getOperator(req), 'update_skill', `Updated skill: ${id}`, 'success');
  res.json({ code: 0, data: skill });
}

export function deleteSkill(req: Request, res: Response<ApiResponse<never>>): void {
  const id = getParam(req, 'id');
  const success = skillStoreDb.deleteSkill(id);
  if (!success) { res.json({ code: -1, error: 'Skill not found' }); return; }

  addOperationLog(getOperator(req), 'delete_skill', `Deleted skill: ${id}`, 'success');
  res.json({ code: 0 });
}

export function toggleSkillEnable(req: Request, res: Response<ApiResponse<Skill>>): void {
  const id = getParam(req, 'id');
  const { enabled } = req.body;
  const skill = skillStoreDb.toggleEnable(id, enabled);
  if (!skill) { res.json({ code: -1, error: 'Skill not found' }); return; }

  addOperationLog(getOperator(req), 'toggle_skill', `Set skill ${id} enabled=${enabled}`, 'success');
  res.json({ code: 0, data: skill });
}

export function getSkillVersions(req: Request, res: Response<ApiResponse<any>>): void {
  const intent = getParam(req, 'intent');
  const versions = skillStoreDb.getVersions(intent);
  res.json({ code: 0, data: versions });
}

export function rollbackSkill(req: Request, res: Response<ApiResponse<Skill>>): void {
  const id = getParam(req, 'id');
  const skill = skillStoreDb.rollback(id);
  if (!skill) { res.json({ code: -1, error: 'Rollback failed. Skill not found.' }); return; }

  addOperationLog(getOperator(req), 'rollback_skill', `Rolled back skill: ${id}`, 'success');
  res.json({ code: 0, data: skill });
}

export async function testSkill(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  const id = getParam(req, 'id');
  const { params } = req.body;

  const skill = skillStoreDb.getById(id);
  if (!skill) { res.json({ code: -1, error: 'Skill not found' }); return; }

  try {
    const result = executeSkill(skill, params || {});
    const resolvedResult = result && typeof (result as any).then === 'function'
      ? await (result as Promise<any>)
      : result;

    res.json({ code: 0, data: { success: true, result: resolvedResult } });
  } catch (e) {
    res.json({ code: 0, data: { success: false, error: (e as Error).message } });
  }
}

// ===== Log Management =====

export function listOperationLogs(req: Request, res: Response<ApiResponse<any>>): void {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const operator = req.query.operator as string;
  const type = req.query.type as string;
  const result = logDb.getOperationLogs(page, pageSize, operator, type);
  res.json({ code: 0, data: result });
}

export function listLLMCallLogs(req: Request, res: Response<ApiResponse<any>>): void {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const modelName = req.query.modelName as string;
  const result = req.query.result as string;
  const logs = logDb.getLLMCallLogs(page, pageSize, modelName, result);
  res.json({ code: 0, data: logs });
}