import request from './request';
import type { ApiResponse, LoginRequest, LoginResponse } from '../types';

export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return request.post('/admin/login', data);
}