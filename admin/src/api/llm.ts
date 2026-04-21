import request from './request';
import type { ApiResponse, PaginatedResult, LLMConfig, LLMConfigCreateInput, LLMConfigUpdateInput } from '../types';

export async function listLLMConfigs(page: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedResult<LLMConfig>>> {
  return request.get('/admin/llm', { params: { page, pageSize } });
}

export async function createLLMConfig(data: LLMConfigCreateInput): Promise<ApiResponse<LLMConfig>> {
  return request.post('/admin/llm', data);
}

export async function updateLLMConfig(id: string, data: LLMConfigUpdateInput): Promise<ApiResponse<LLMConfig>> {
  return request.put(`/admin/llm/${id}`, data);
}

export async function deleteLLMConfig(id: string): Promise<ApiResponse<never>> {
  return request.delete(`/admin/llm/${id}`);
}

export async function toggleLLMEnable(id: string, enabled: boolean): Promise<ApiResponse<LLMConfig>> {
  return request.patch(`/admin/llm/${id}/enable`, { enabled });
}

export async function setDefaultLLM(id: string): Promise<ApiResponse<LLMConfig>> {
  return request.patch(`/admin/llm/${id}/default`);
}

export async function testLLMConfig(id: string): Promise<ApiResponse<{ success: boolean; message: string; response?: string }>> {
  return request.post(`/admin/llm/${id}/test`);
}