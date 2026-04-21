import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../hooks/usePagination';
import * as logApi from '../api/log';
import type { OperationLog, LLMCallLog } from '../types';

export default function LogView() {
  const [activeTab, setActiveTab] = useState<'operation' | 'llm'>('operation');
  const opPagination = usePagination();
  const llmPagination = usePagination();
  const [opData, setOpData] = useState<OperationLog[]>([]);
  const [llmData, setLlmData] = useState<LLMCallLog[]>([]);
  const [detailModal, setDetailModal] = useState<string | null>(null);

  const fetchOpLogs = useCallback(async () => {
    try {
      const res = await logApi.listOperationLogs(opPagination.page, opPagination.pageSize);
      if (res.data) { setOpData(res.data.list); opPagination.setTotal(res.data.total); }
    } catch { /* handled */ }
  }, [opPagination.page, opPagination.pageSize]);

  const fetchLlmLogs = useCallback(async () => {
    try {
      const res = await logApi.listLLMCallLogs(llmPagination.page, llmPagination.pageSize);
      if (res.data) { setLlmData(res.data.list); llmPagination.setTotal(res.data.total); }
    } catch { /* handled */ }
  }, [llmPagination.page, llmPagination.pageSize]);

  useEffect(() => { fetchOpLogs(); }, [fetchOpLogs]);

  const handleTabChange = (tab: 'operation' | 'llm') => {
    setActiveTab(tab);
    if (tab === 'llm') fetchLlmLogs();
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-text-primary">执行日志</h2>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button onClick={() => handleTabChange('operation')}
          className={`px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === 'operation' ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>
          操作日志
        </button>
        <button onClick={() => handleTabChange('llm')}
          className={`px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === 'llm' ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>
          LLM 调用日志
        </button>
      </div>

      {activeTab === 'operation' ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="py-3 px-4 text-text-tertiary text-left">操作人</th>
              <th className="py-3 px-4 text-text-tertiary text-left">类型</th>
              <th className="py-3 px-4 text-text-tertiary text-left">内容</th>
              <th className="py-3 px-4 text-text-tertiary text-left">结果</th>
              <th className="py-3 px-4 text-text-tertiary text-left">时间</th>
              <th className="py-3 px-4 text-text-tertiary text-left">详情</th>
            </tr></thead>
            <tbody>
              {opData.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-bg-body/50">
                  <td className="py-2 px-4 text-text-primary">{item.operator}</td>
                  <td className="py-2 px-4"><span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs">{item.type}</span></td>
                  <td className="py-2 px-4 text-text-secondary max-w-[200px] truncate">{item.content}</td>
                  <td className="py-2 px-4"><span className={`text-xs ${item.result === 'success' ? 'text-success' : 'text-danger'}`}>{item.result}</span></td>
                  <td className="py-2 px-4 text-text-tertiary text-xs">{item.createdAt}</td>
                  <td className="py-2 px-4"><button onClick={() => setDetailModal(JSON.stringify(item, null, 2))} className="btn-text text-xs">查看</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between py-3 px-4">
            <span className="text-xs text-text-tertiary">共 {opPagination.total} 条</span>
            <div className="flex gap-2">
              <button onClick={() => { opPagination.onPageChange(opPagination.page - 1); }} disabled={opPagination.page <= 1} className="btn-text text-xs disabled:opacity-50">上一页</button>
              <span className="text-xs">{opPagination.page}</span>
              <button onClick={() => { opPagination.onPageChange(opPagination.page + 1); }} disabled={opPagination.page * opPagination.pageSize >= opPagination.total} className="btn-text text-xs disabled:opacity-50">下一页</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="py-3 px-4 text-text-tertiary text-left">模型</th>
              <th className="py-3 px-4 text-text-tertiary text-left">意图</th>
              <th className="py-3 px-4 text-text-tertiary text-left">响应时间</th>
              <th className="py-3 px-4 text-text-tertiary text-left">结果</th>
              <th className="py-3 px-4 text-text-tertiary text-left">时间</th>
              <th className="py-3 px-4 text-text-tertiary text-left">详情</th>
            </tr></thead>
            <tbody>
              {llmData.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-bg-body/50">
                  <td className="py-2 px-4 text-text-primary font-medium">{item.modelName}</td>
                  <td className="py-2 px-4 text-secondary">{item.intent || '-'}</td>
                  <td className="py-2 px-4 text-text-tertiary">{item.responseTime}ms</td>
                  <td className="py-2 px-4"><span className={`text-xs ${item.result === 'success' ? 'text-success' : 'text-danger'}`}>{item.result}</span></td>
                  <td className="py-2 px-4 text-text-tertiary text-xs">{item.createdAt}</td>
                  <td className="py-2 px-4"><button onClick={() => setDetailModal(JSON.stringify(item, null, 2))} className="btn-text text-xs">查看</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between py-3 px-4">
            <span className="text-xs text-text-tertiary">共 {llmPagination.total} 条</span>
            <div className="flex gap-2">
              <button onClick={() => { llmPagination.onPageChange(llmPagination.page - 1); }} disabled={llmPagination.page <= 1} className="btn-text text-xs disabled:opacity-50">上一页</button>
              <span className="text-xs">{llmPagination.page}</span>
              <button onClick={() => { llmPagination.onPageChange(llmPagination.page + 1); }} disabled={llmPagination.page * llmPagination.pageSize >= llmPagination.total} className="btn-text text-xs disabled:opacity-50">下一页</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-card w-[600px] p-6 shadow-card max-h-[80vh] overflow-auto">
            <h3 className="text-base font-bold text-text-primary mb-4">日志详情</h3>
            <div className="code-block p-4 text-sm"><pre>{detailModal}</pre></div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setDetailModal(null)} className="btn-secondary text-sm">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}