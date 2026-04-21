import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../hooks/usePagination';
import * as llmApi from '../api/llm';
import type { LLMConfig, LLMConfigCreateInput } from '../types';

export default function LLMConfig() {
  const { page, pageSize, total, setTotal, onPageChange } = usePagination();
  const [data, setData] = useState<LLMConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<LLMConfig | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; loading: boolean; data?: { success: boolean; message: string } } | null>(null);
  const [form, setForm] = useState<LLMConfigCreateInput>({ name: '', apiKey: '', baseUrl: '', model: '', isDefault: false });
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await llmApi.listLLMConfigs(page, pageSize);
      if (res.data) { setData(res.data.list); setTotal(res.data.total); }
    } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    setForm({ name: '', apiKey: '', baseUrl: '', model: '', isDefault: false });
    setModalOpen(true);
    setError('');
  };

  const handleEdit = (item: LLMConfig) => {
    setEditItem(item);
    setForm({ name: item.name, apiKey: '', baseUrl: item.baseUrl, model: item.model, isDefault: item.isDefault });
    setModalOpen(true);
    setError('');
  };

  const handleModalOk = async () => {
    if (!form.name || !form.baseUrl || !form.model) { setError('请填写必要字段'); return; }
    if (!editItem && !form.apiKey) { setError('请填写 API Key'); return; }
    try {
      if (editItem) {
        const updateData: any = { name: form.name, baseUrl: form.baseUrl, model: form.model, isDefault: form.isDefault };
        if (form.apiKey) updateData.apiKey = form.apiKey;
        await llmApi.updateLLMConfig(editItem.id, updateData);
      } else {
        await llmApi.createLLMConfig(form);
      }
      setModalOpen(false);
      fetchData();
    } catch { /* handled */ }
  };

  const handleDelete = async (id: string) => {
    try { await llmApi.deleteLLMConfig(id); fetchData(); } catch { /* handled */ }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try { await llmApi.toggleLLMEnable(id, enabled); fetchData(); } catch { /* handled */ }
  };

  const handleSetDefault = async (id: string) => {
    try { await llmApi.setDefaultLLM(id); fetchData(); } catch { /* handled */ }
  };

  const handleTest = async (id: string) => {
    setTestResult({ id, loading: true });
    try {
      const res = await llmApi.testLLMConfig(id);
      setTestResult({ id, loading: false, data: res.data as any });
    } catch { setTestResult(null); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">大模型配置</h2>
        <button onClick={handleAdd} className="btn-primary text-sm">+ 新增模型</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-text-tertiary">加载中...</div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-text-tertiary">暂无数据</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-text-tertiary text-left">名称</th>
                <th className="py-3 px-4 text-text-tertiary text-left">模型</th>
                <th className="py-3 px-4 text-text-tertiary text-left">Base URL</th>
                <th className="py-3 px-4 text-text-tertiary text-left">状态</th>
                <th className="py-3 px-4 text-text-tertiary text-left">默认</th>
                <th className="py-3 px-4 text-text-tertiary text-left">创建时间</th>
                <th className="py-3 px-4 text-text-tertiary text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-bg-body/50 transition-colors">
                  <td className="py-3 px-4 text-text-primary font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-text-secondary">{item.model}</td>
                  <td className="py-3 px-4 text-text-tertiary text-xs">{item.baseUrl}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggle(item.id, !item.enabled)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${item.enabled ? 'bg-success/10 text-success' : 'bg-border text-text-tertiary'}`}
                    >
                      {item.enabled ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    {item.isDefault ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">默认</span>
                    ) : item.enabled ? (
                      <button onClick={() => handleSetDefault(item.id)} className="btn-text text-xs">设为默认</button>
                    ) : null}
                  </td>
                  <td className="py-3 px-4 text-text-tertiary text-xs">{item.createdAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(item)} className="btn-text text-xs">编辑</button>
                      {!item.isDefault && (
                        <button onClick={() => { if(confirm('确认删除？')) handleDelete(item.id); }} className="btn-text text-xs text-danger">删除</button>
                      )}
                      <button
                        onClick={() => handleTest(item.id)}
                        disabled={testResult?.id === item.id && testResult.loading}
                        className="btn-text text-xs"
                      >
                        {testResult?.id === item.id && testResult.loading ? '测试中...' : '测试'}
                      </button>
                    </div>
                    {testResult?.id === item.id && testResult.data && (
                      <div className={`mt-1 text-xs ${testResult.data.success ? 'text-success' : 'text-danger'}`}>
                        {testResult.data.message}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between py-3 px-4">
          <span className="text-xs text-text-tertiary">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-text text-xs disabled:opacity-50">上一页</button>
            <span className="text-xs text-text-secondary">{page}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= total} className="btn-text text-xs disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-card w-[480px] p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-4">{editItem ? '编辑大模型' : '新增大模型'}</h3>
            {error && <div className="text-danger text-sm mb-3">{error}</div>}
            <div className="space-y-3">
              <input placeholder="名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-base w-full" />
              {!editItem && <input type="password" placeholder="API Key" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} className="input-base w-full" />}
              <input placeholder="Base URL (如 https://api.deepseek.com/v1)" value={form.baseUrl} onChange={e => setForm({ ...form, baseUrl: e.target.value })} className="input-base w-full" />
              <input placeholder="模型名 (如 deepseek-chat)" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="input-base w-full" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-text-secondary">设为默认模型</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={handleModalOk} className="btn-primary text-sm">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}