import { useState, useEffect, useCallback } from 'react';
import { Table, Tabs, Input, Select, Space, Modal, Typography, Button } from 'antd';
import { usePagination } from '../hooks/usePagination';
import * as logApi from '../api/log';
import type { OperationLog, LLMCallLog } from '../types';

export default function LogView() {
  const opPagination = usePagination();
  const llmPagination = usePagination();
  const [opData, setOpData] = useState<OperationLog[]>([]);
  const [llmData, setLlmData] = useState<LLMCallLog[]>([]);
  const [opLoading, setOpLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [opFilter, setOpFilter] = useState<{ operator?: string; type?: string }>({});
  const [llmFilter, setLlmFilter] = useState<{ modelName?: string; result?: string }>({});
  const [detailModal, setDetailModal] = useState<{ open: boolean; title: string; content: string }>({ open: false, title: '', content: '' });

  const fetchOpLogs = useCallback(async () => {
    setOpLoading(true);
    try {
      const res = await logApi.listOperationLogs(opPagination.page, opPagination.pageSize, opFilter.operator, opFilter.type);
      if (res.data) {
        setOpData(res.data.list);
        opPagination.setTotal(res.data.total);
      }
    } finally { setOpLoading(false); }
  }, [opPagination.page, opPagination.pageSize, opFilter]);

  const fetchLlmLogs = useCallback(async () => {
    setLlmLoading(true);
    try {
      const res = await logApi.listLLMCallLogs(llmPagination.page, llmPagination.pageSize, llmFilter.modelName, llmFilter.result);
      if (res.data) {
        setLlmData(res.data.list);
        llmPagination.setTotal(res.data.total);
      }
    } finally { setLlmLoading(false); }
  }, [llmPagination.page, llmPagination.pageSize, llmFilter]);

  useEffect(() => { fetchOpLogs(); }, [fetchOpLogs]);

  const opColumns = [
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '结果', dataIndex: 'result', key: 'result' },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '详情', key: 'detail',
      render: (_: any, record: OperationLog) => (
        <Typography.Link onClick={() => setDetailModal({ open: true, title: '操作日志详情', content: JSON.stringify(record, null, 2) })}>
          查看
        </Typography.Link>
      ),
    },
  ];

  const llmColumns = [
    { title: '模型', dataIndex: 'modelName', key: 'modelName' },
    { title: '意图', dataIndex: 'intent', key: 'intent' },
    { title: '响应时间(ms)', dataIndex: 'responseTime', key: 'responseTime' },
    { title: '结果', dataIndex: 'result', key: 'result' },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '详情', key: 'detail',
      render: (_: any, record: LLMCallLog) => (
        <Typography.Link onClick={() => setDetailModal({ open: true, title: 'LLM调用日志详情', content: JSON.stringify(record, null, 2) })}>
          查看
        </Typography.Link>
      ),
    },
  ];

  const opLogTypes = ['create_llm', 'update_llm', 'delete_llm', 'toggle_llm', 'set_default_llm', 'create_skill', 'update_skill', 'delete_skill', 'toggle_skill', 'rollback_skill'];

  const tabItems = [
    {
      key: 'operation',
      label: '操作日志',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Input placeholder="操作人" allowClear onChange={(e) => setOpFilter({ ...opFilter, operator: e.target.value })} style={{ width: 150 }} />
            <Select placeholder="操作类型" allowClear onChange={(v) => setOpFilter({ ...opFilter, type: v })} style={{ width: 160 }}
              options={opLogTypes.map(t => ({ value: t, label: t }))} />
            <Button onClick={fetchOpLogs}>刷新</Button>
          </Space>
          <Table columns={opColumns} dataSource={opData} rowKey="id" loading={opLoading}
            pagination={{ current: opPagination.page, pageSize: opPagination.pageSize, total: opPagination.total, onChange: opPagination.onPageChange }} />
        </div>
      ),
    },
    {
      key: 'llm',
      label: 'LLM调用日志',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Input placeholder="模型名" allowClear onChange={(e) => setLlmFilter({ ...llmFilter, modelName: e.target.value })} style={{ width: 150 }} />
            <Select placeholder="调用结果" allowClear onChange={(v) => setLlmFilter({ ...llmFilter, result: v })} style={{ width: 120 }}
              options={[{ value: 'success', label: '成功' }, { value: 'failed', label: '失败' }]} />
            <Button onClick={fetchLlmLogs}>刷新</Button>
          </Space>
          <Table columns={llmColumns} dataSource={llmData} rowKey="id" loading={llmLoading}
            pagination={{ current: llmPagination.page, pageSize: llmPagination.pageSize, total: llmPagination.total, onChange: llmPagination.onPageChange }} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs items={tabItems} onChange={(key) => { if (key === 'llm') fetchLlmLogs(); }} />
      <Modal title={detailModal.title} open={detailModal.open} onCancel={() => setDetailModal({ ...detailModal, open: false })} footer={null} width={600}>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 4, maxHeight: 400, overflow: 'auto' }}>
          {detailModal.content}
        </pre>
      </Modal>
    </div>
  );
}