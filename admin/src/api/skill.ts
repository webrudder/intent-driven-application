import request from './request';
import type { ApiResponse, PaginatedResult, Skill, SkillCreateInput, SkillUpdateInput } from '../types';

export async function listSkills(page: number = 1, pageSize: number = 10, intent?: string, status?: string): Promise<ApiResponse<PaginatedResult<Skill>>> {
  return request.get('/admin/skill', { params: { page, pageSize, intent, status } });
}

export async function createSkill(data: SkillCreateInput): Promise<ApiResponse<Skill>> {
  return request.post('/admin/skill', data);
}

export async function updateSkill(id: string, data: SkillUpdateInput): Promise<ApiResponse<Skill>> {
  return request.put(`/admin/skill/${id}`, data);
}

export async function deleteSkill(id: string): Promise<ApiResponse<never>> {
  return request.delete(`/admin/skill/${id}`);
}

export async function toggleSkillEnable(id: string, enabled: boolean): Promise<ApiResponse<Skill>> {
  return request.patch(`/admin/skill/${id}/enable`, { enabled });
}

export async function getSkillVersions(intent: string): Promise<ApiResponse<Skill[]>> {
  return request.get(`/admin/skill/versions/${intent}`);
}

export async function rollbackSkill(id: string): Promise<ApiResponse<Skill>> {
  return request.post(`/admin/skill/${id}/rollback`);
}

export async function testSkill(id: string, params: Record<string, unknown>): Promise<ApiResponse<{ success: boolean; result?: unknown; error?: string }>> {
  return request.post(`/admin/skill/${id}/test`, { params });
}