import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { usePagination } from '../hooks/usePagination';
import * as skillApi from '../api/skill';
import type { Skill, SkillCreateInput } from '../types';

export default function SkillManage() {
  const { page, pageSize, total, setTotal, onPageChange } = usePagination();
  const [data, setData] = useState<Skill[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Skill | null>(null);
  const [codeValue, setCodeValue] = useState('');
  const [form, setForm] = useState<Partial<SkillCreateInput> & { name: string; intent: string }>({ name: '', intent: '', code: '' });
  const [error, setError] = useState('');
  const [filterIntent, setFilterIntent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [testModal, setTestModal] = useState<{ id: string; params: string; result: string | null; loading: boolean } | null>(null);
  const [versionModal, setVersionModal] = useState<Skill[] | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await skillApi.listSkills(page, pageSize, filterIntent, filterStatus);
      if (res.data) { setData(res.data.list); setTotal(res.data.total); }
    } catch { /* handled */ }
  }, [page, pageSize, filterIntent, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    setForm({ name: '', intent: '', code: '', inputSchema: '{}', outputSchema: '{}', description: '' });
    setCodeValue('');
    setModalOpen(true);
    setError('');
  };

  const handleEdit = (item: Skill) => {
    setEditItem(item);
    setForm({ name: item.name, intent: item.intent, description: item.description, version: item.version + 1, inputSchema: item.inputSchema, outputSchema: item.outputSchema, code: item.code });
    setCodeValue(item.code);
    setModalOpen(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.name || !form.intent) { setError('请填写技能名和意图'); return; }
    if (!codeValue) { setError('请填写 Skill 代码'); return; }
    const saveForm = { ...form, code: codeValue };
    try {
      if (editItem) {
        await skillApi.updateSkill(editItem.id, saveForm);
      } else {
        await skillApi.createSkill(saveForm as SkillCreateInput);
      }
      setModalOpen(false);
      fetchData();
    } catch { /* handled */ }
  };

  const handleDelete = async (id: string) => {
    try { await skillApi.deleteSkill(id); fetchData(); } catch { /* handled */ }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try { await skillApi.toggleSkillEnable(id, enabled); fetchData(); } catch { /* handled */ }
  };

  const handleTest = async () => {
    if (!testModal) return;
    let params = {};
    try { params = JSON.parse(testModal.params); } catch { setError('参数 JSON 格式错误'); return; }
    setTestModal({ ...testModal, loading: true, result: null });
    try {
      const res = await skillApi.testSkill(testModal.id, params);
      setTestModal({ ...testModal, loading: false, result: JSON.stringify(res.data, null, 2) });
    } catch { setTestModal({ ...testModal, loading: false }); }
  };

  const handleVersions = async (intent: string) => {
    try {
      const res = await skillApi.getSkillVersions(intent);
      if (res.data) setVersionModal(res.data);
    } catch { /* handled */ }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Skill 管理</h2>
        <button onClick={handleAdd} className="btn-primary text-sm">+ 新增 Skill</button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input placeholder="按意图搜索" value={filterIntent} onChange={e => setFilterIntent(e.target.value)} className="input-base w-[200px]" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-base w-[120px]">
          <option value="">全部状态</option>
          <option value="enabled">启用</option>
          <option value="disabled">禁用</option>
        </select>
        <button onClick={() => fetchData()} className="btn-secondary text-sm">刷新</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 text-text-tertiary text-left">技能名</th>
              <th className="py-3 px-4 text-text-tertiary text-left">意图</th>
              <th className="py-3 px-4 text-text-tertiary text-left">版本</th>
              <th className="py-3 px-4 text-text-tertiary text-left">描述</th>
              <th className="py-3 px-4 text-text-tertiary text-left">状态</th>
              <th className="py-3 px-4 text-text-tertiary text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-bg-body/50 transition-colors">
                <td className="py-3 px-4 text-text-primary font-medium">{item.name}</td>
                <td className="py-3 px-4 text-secondary font-medium">{item.intent}</td>
                <td className="py-3 px-4 text-text-tertiary">v{item.version}</td>
                <td className="py-3 px-4 text-text-tertiary text-xs max-w-[200px] truncate">{item.description}</td>
                <td className="py-3 px-4">
                  <button onClick={() => handleToggle(item.id, !item.enabled)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${item.enabled ? 'bg-success/10 text-success' : 'bg-border text-text-tertiary'}`}>
                    {item.enabled ? '启用' : '禁用'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(item)} className="btn-text text-xs">编辑</button>
                    <button onClick={() => { if(confirm('确认删除？')) handleDelete(item.id); }} className="btn-text text-xs text-danger">删除</button>
                    <button onClick={() => setTestModal({ id: item.id, params: '{}', result: null, loading: false })} className="btn-text text-xs">测试</button>
                    <button onClick={() => handleVersions(item.intent)} className="btn-text text-xs">版本</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between py-3 px-4">
          <span className="text-xs text-text-tertiary">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-text text-xs disabled:opacity-50">上一页</button>
            <span className="text-xs">{page}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= total} className="btn-text text-xs disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-card w-[720px] p-6 shadow-card max-h-[80vh] overflow-auto">
            <h3 className="text-base font-bold text-text-primary mb-4">{editItem ? '编辑 Skill' : '新增 Skill'}</h3>
            {error && <div className="text-danger text-sm mb-3">{error}</div>}
            <div className="space-y-3">
              <input placeholder="技能名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-base w-full" />
              <input placeholder="绑定意图 (如 query_order_amount)" value={form.intent} onChange={e => setForm({ ...form, intent: e.target.value })} className="input-base w-full" />
              {editItem && <input type="number" placeholder="版本号 (需递增)" value={form.version} onChange={e => setForm({ ...form, version: parseInt(e.target.value) })} className="input-base w-full" />}
              <textarea placeholder="描述" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-base w-full" rows={2} />
              <div>
                <div className="text-sm text-text-secondary mb-2">Skill 代码</div>
                <div className="border border-border rounded-code overflow-hidden">
                  <Editor height={250} language="typescript" theme="vs-dark" value={codeValue} onChange={v => setCodeValue(v || '')}
                    options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={handleSave} className="btn-primary text-sm">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {testModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-card w-[600px] p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-4">Skill 测试</h3>
            <div className="text-sm text-text-secondary mb-2">输入参数 (JSON):</div>
            <textarea value={testModal.params} onChange={e => setTestModal({ ...testModal, params: e.target.value })}
              className="input-base w-full h-[80px] font-mono text-xs" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setTestModal(null)} className="btn-secondary text-sm">关闭</button>
              <button onClick={handleTest} disabled={testModal.loading} className="btn-primary text-sm">
                {testModal.loading ? '执行中...' : '执行'}
              </button>
            </div>
            {testModal.result && (
              <div className="mt-4">
                <div className="text-sm text-text-secondary mb-2">执行结果:</div>
                <div className="code-block p-4 text-xs"><pre>{testModal.result}</pre></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version Modal */}
      {versionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-card w-[500px] p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-4">Skill 版本列表</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="py-2 px-3 text-text-tertiary text-left">版本</th>
                <th className="py-2 px-3 text-text-tertiary text-left">技能名</th>
                <th className="py-2 px-3 text-text-tertiary text-left">更新时间</th>
              </tr></thead>
              <tbody>
                {versionModal.map(v => (
                  <tr key={v.id} className="border-b border-border/50">
                    <td className="py-2 px-3 text-text-primary">v{v.version}</td>
                    <td className="py-2 px-3 text-text-secondary">{v.name}</td>
                    <td className="py-2 px-3 text-text-tertiary text-xs">{v.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button onClick={() => setVersionModal(null)} className="btn-secondary text-sm">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}