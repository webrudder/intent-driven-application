import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index';
import type { OperationLog, LLMCallLog, PaginatedResult } from '../types';

function rowToOperationLog(row: any): OperationLog {
  return {
    id: row.id,
    operator: row.operator,
    type: row.type,
    content: row.content,
    result: row.result,
    createdAt: row.created_at,
  };
}

function rowToLLMCallLog(row: any): LLMCallLog {
  return {
    id: row.id,
    modelName: row.model_name,
    intent: row.intent,
    userInput: row.user_input,
    responseTime: row.response_time,
    result: row.result,
    requestParams: row.request_params,
    responseContent: row.response_content,
    createdAt: row.created_at,
  };
}

// ===== Operation Log =====

export function addOperationLog(operator: string, type: string, content: string, result: string): void {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO operation_log (id, operator, type, content, result)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, operator, type, content, result);
}

export function getOperationLogs(
  page: number = 1,
  pageSize: number = 10,
  operator?: string,
  type?: string
): PaginatedResult<OperationLog> {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  const conditions: string[] = [];
  const params: any[] = [];

  if (operator) { conditions.push('operator = ?'); params.push(operator); }
  if (type) { conditions.push('type = ?'); params.push(type); }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as count FROM operation_log ${whereClause}`).get(...params) as any;
  const rows = db.prepare(`SELECT * FROM operation_log ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  return {
    list: rows.map(rowToOperationLog),
    total: total.count,
    page,
    pageSize,
  };
}

export function getOperationLogById(id: string): OperationLog | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM operation_log WHERE id = ?').get(id);
  return row ? rowToOperationLog(row) : null;
}

export function getLLMCallLogById(id: string): LLMCallLog | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM llm_call_log WHERE id = ?').get(id);
  return row ? rowToLLMCallLog(row) : null;
}

// ===== LLM Call Log =====

export function addLLMCallLog(
  modelName: string,
  intent: string | null,
  userInput: string | null,
  responseTime: number,
  result: string,
  requestParams: string | null,
  responseContent: string | null
): void {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO llm_call_log (id, model_name, intent, user_input, response_time, result, request_params, response_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, modelName, intent, userInput, responseTime, result, requestParams, responseContent);
}

export function getLLMCallLogs(
  page: number = 1,
  pageSize: number = 10,
  modelName?: string,
  result?: string
): PaginatedResult<LLMCallLog> {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  const conditions: string[] = [];
  const params: any[] = [];

  if (modelName) { conditions.push('model_name = ?'); params.push(modelName); }
  if (result) { conditions.push('result = ?'); params.push(result); }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as count FROM llm_call_log ${whereClause}`).get(...params) as any;
  const rows = db.prepare(`SELECT * FROM llm_call_log ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  return {
    list: rows.map(rowToLLMCallLog),
    total: total.count,
    page,
    pageSize,
  };
}