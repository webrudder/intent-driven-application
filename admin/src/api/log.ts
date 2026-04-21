import request from './request';
import type { ApiResponse, PaginatedResult, OperationLog, LLMCallLog } from '../types';

export async function listOperationLogs(page: number = 1, pageSize: number = 10, operator?: string, type?: string): Promise<ApiResponse<PaginatedResult<OperationLog>>> {
  return request.get('/admin/log/operation', { params: { page, pageSize, operator, type } });
}

export async function listLLMCallLogs(page: number = 1, pageSize: number = 10, modelName?: string, result?: string): Promise<ApiResponse<PaginatedResult<LLMCallLog>>> {
  return request.get('/admin/log/llm', { params: { page, pageSize, modelName, result } });
}