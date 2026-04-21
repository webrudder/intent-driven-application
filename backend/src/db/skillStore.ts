import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index';
import { clearCacheByPrefix } from '../config/cache';
import type { Skill, SkillCreateInput, SkillUpdateInput, PaginatedResult } from '../types';

function rowToSkill(row: any): Skill {
  return {
    id: row.id,
    name: row.name,
    intent: row.intent,
    code: row.code,
    inputSchema: row.input_schema,
    outputSchema: row.output_schema,
    version: row.version,
    enabled: Boolean(row.enabled),
    description: row.description,
    createdAt: row.created_at,
  };
}

export function getAll(page: number = 1, pageSize: number = 10, intent?: string, status?: string): PaginatedResult<Skill> {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  let whereClause = '';
  const conditions: string[] = [];
  const params: any[] = [];

  if (intent) {
    conditions.push('intent = ?');
    params.push(intent);
  }
  if (status === 'enabled') {
    conditions.push('enabled = 1');
  } else if (status === 'disabled') {
    conditions.push('enabled = 0');
  }

  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM skill_store ${whereClause}`).get(...params) as any;
  const rows = db.prepare(`SELECT * FROM skill_store ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  return {
    list: rows.map(rowToSkill),
    total: total.count,
    page,
    pageSize,
  };
}

export function getById(id: string): Skill | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM skill_store WHERE id = ?').get(id);
  return row ? rowToSkill(row) : null;
}

export function getByIntent(intent: string): Skill | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM skill_store WHERE intent = ? AND enabled = 1 ORDER BY version DESC LIMIT 1').get(intent);
  return row ? rowToSkill(row) : null;
}

export function create(input: SkillCreateInput): Skill {
  const db = getDb();
  const id = uuidv4();
  const version = input.version || 1;

  db.prepare(`
    INSERT INTO skill_store (id, name, intent, code, input_schema, output_schema, version, enabled, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id, input.name, input.intent, input.code,
    input.inputSchema || '{}',
    input.outputSchema || '{}',
    version,
    input.description || ''
  );

  clearCacheByPrefix('skill:');
  return getById(id)!;
}

export function update(id: string, input: SkillUpdateInput): Skill | null {
  const db = getDb();
  const existing = getById(id);
  if (!existing) return null;

  // Version must increment
  if (input.version !== undefined) {
    if (input.version <= existing.version) {
      return null; // version cannot decrease or stay same
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name); }
  if (input.intent !== undefined) { updates.push('intent = ?'); values.push(input.intent); }
  if (input.code !== undefined) { updates.push('code = ?'); values.push(input.code); }
  if (input.inputSchema !== undefined) { updates.push('input_schema = ?'); values.push(input.inputSchema); }
  if (input.outputSchema !== undefined) { updates.push('output_schema = ?'); values.push(input.outputSchema); }
  if (input.version !== undefined) { updates.push('version = ?'); values.push(input.version); }
  if (input.enabled !== undefined) { updates.push('enabled = ?'); values.push(input.enabled ? 1 : 0); }
  if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description); }

  if (updates.length === 0) return existing;

  values.push(id);
  db.prepare(`UPDATE skill_store SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  clearCacheByPrefix('skill:');
  return getById(id);
}

export function deleteSkill(id: string): boolean {
  const db = getDb();
  const existing = getById(id);
  if (!existing) return false;

  db.prepare('DELETE FROM skill_store WHERE id = ?').run(id);
  clearCacheByPrefix('skill:');
  return true;
}

export function toggleEnable(id: string, enabled: boolean): Skill | null {
  return update(id, { enabled });
}

export function getVersions(intent: string): Skill[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM skill_store WHERE intent = ? ORDER BY version DESC').all(intent);
  return rows.map(rowToSkill);
}

export function rollback(id: string): Skill | null {
  const existing = getById(id);
  if (!existing) return null;

  // Create new version with same content (version increments)
  return update(id, {
    version: existing.version + 1,
  });
}