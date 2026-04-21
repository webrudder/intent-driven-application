import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index';
import { encrypt, decrypt } from '../utils/encrypt';
import { clearCacheByPrefix } from '../config/cache';
import type { LLMConfig, LLMConfigCreateInput, LLMConfigUpdateInput, PaginatedResult } from '../types';

function rowToConfig(row: any): LLMConfig {
  return {
    id: row.id,
    name: row.name,
    apiKey: decrypt(row.api_key),
    baseUrl: row.base_url,
    model: row.model,
    enabled: Boolean(row.enabled),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

function rowToConfigMasked(row: any): LLMConfig {
  return {
    id: row.id,
    name: row.name,
    apiKey: '***masked***',
    baseUrl: row.base_url,
    model: row.model,
    enabled: Boolean(row.enabled),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

export function getAll(page: number = 1, pageSize: number = 10): PaginatedResult<LLMConfig> {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  const total = db.prepare('SELECT COUNT(*) as count FROM llm_config').get() as any;
  const rows = db.prepare('SELECT * FROM llm_config ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(pageSize, offset);
  return {
    list: rows.map(rowToConfigMasked),
    total: total.count,
    page,
    pageSize,
  };
}

export function getById(id: string): LLMConfig | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM llm_config WHERE id = ?').get(id);
  return row ? rowToConfigMasked(row) : null;
}

export function getDefault(): LLMConfig | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM llm_config WHERE is_default = 1 AND enabled = 1').get();
  return row ? rowToConfig(row) : null; // default model needs real apiKey for LLM calls
}

export function create(input: LLMConfigCreateInput): LLMConfig {
  const db = getDb();
  const id = uuidv4();

  if (input.isDefault) {
    db.prepare('UPDATE llm_config SET is_default = 0 WHERE is_default = 1').run();
  }

  db.prepare(`
    INSERT INTO llm_config (id, name, api_key, base_url, model, enabled, is_default)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(id, input.name, encrypt(input.apiKey), input.baseUrl, input.model, input.isDefault ? 1 : 0);

  clearCacheByPrefix('llm:');
  return getById(id)!;
}

export function update(id: string, input: LLMConfigUpdateInput): LLMConfig | null {
  const db = getDb();

  // Need real config to check conditions
  const row = db.prepare('SELECT * FROM llm_config WHERE id = ?').get(id);
  if (!row) return null;
  const existing = rowToConfig(row);

  if (input.isDefault && input.isDefault !== existing.isDefault) {
    if (input.enabled === false) {
      return null; // Cannot set disabled model as default
    }
    db.prepare('UPDATE llm_config SET is_default = 0 WHERE is_default = 1').run();
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name); }
  if (input.apiKey !== undefined) { updates.push('api_key = ?'); values.push(encrypt(input.apiKey)); }
  if (input.baseUrl !== undefined) { updates.push('base_url = ?'); values.push(input.baseUrl); }
  if (input.model !== undefined) { updates.push('model = ?'); values.push(input.model); }
  if (input.enabled !== undefined) { updates.push('enabled = ?'); values.push(input.enabled ? 1 : 0); }
  if (input.isDefault !== undefined) {
    updates.push('is_default = ?');
    values.push(input.isDefault ? 1 : 0);
  }

  if (updates.length === 0) return getById(id);

  values.push(id);
  db.prepare(`UPDATE llm_config SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  // If model was disabled and was default, clear default
  if (input.enabled === false) {
    db.prepare('UPDATE llm_config SET is_default = 0 WHERE id = ?').run(id);
  }

  clearCacheByPrefix('llm:');
  return getById(id);
}

export function deleteConfig(id: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT * FROM llm_config WHERE id = ?').get(id);
  if (!row) return false;
  if (Boolean((row as any).is_default)) return false; // cannot delete default model

  db.prepare('DELETE FROM llm_config WHERE id = ?').run(id);
  clearCacheByPrefix('llm:');
  return true;
}

export function toggleEnable(id: string, enabled: boolean): LLMConfig | null {
  return update(id, { enabled });
}

export function setDefault(id: string): LLMConfig | null {
  return update(id, { isDefault: true });
}