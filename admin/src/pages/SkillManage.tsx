import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Select, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExperimentOutlined, HistoryOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { usePagination } from '../hooks/usePagination';
import * as skillApi from '../api/skill';
import type { Skill, SkillCreateInput } from '../types';

export default function SkillManage() {
  const { page, pageSize, total, setTotal, onPageChange } = usePagination();
  const [data, setData] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Skill | null>(null);
  const [codeValue, setCodeValue] = useState('');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testSkillId, setTestSkillId] = useState('');
  const [testParams, setTestParams] = useState('{}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState<Skill[]>([]);
  const [filterIntent, setFilterIntent] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await skillApi.listSkills(page, pageSize, filterIntent, filterStatus);
      if (res.data) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterIntent, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    form.resetFields();
    setCodeValue('');
    setModalOpen(true);
  };

  const handleEdit = (item: Skill) => {
    setEditItem(item);
    form.setFieldsValue({ name: item.name, intent: item.intent, description: item.description, version: item.version + 1 });
    setCodeValue(item.code);
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    values.code = codeValue;
    try {
      if (editItem) {
        await skillApi.updateSkill(editItem.id, values);
        message.success('更新成功');
      } else {
        await skillApi.createSkill(values as SkillCreateInput);
        message.success('新增成功');
      }
      setModalOpen(false);
      fetchData();
    } catch { /* handled */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await skillApi.deleteSkill(id);
      message.success('删除成功');
      fetchData();
    } catch { /* handled */ }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await skillApi.toggleSkillEnable(id, enabled);
      fetchData();
    } catch { /* handled */ }
  };

  const handleTest = (id: string) => {
    setTestSkillId(id);
    setTestParams('{}');
    setTestResult(null);
    setTestModalOpen(true);
  };

  const executeTest = async () => {
    setTestLoading(true);
    try {
      let params = {};
      try { params = JSON.parse(testParams); } catch { message.error('参数JSON格式错误'); return; }
      const res = await skillApi.testSkill(testSkillId, params);
      if (res.data) {
        setTestResult(JSON.stringify(res.data, null, 2));
        if (res.data.success) message.success('执行成功');
        else message.error(`执行失败: ${res.data.error}`);
      }
    } catch { /* handled */ }
    finally { setTestLoading(false); }
  };

  const handleVersions = async (intent: string) => {
    try {
      const res = await skillApi.getSkillVersions(intent);
      if (res.data) { setVersions(res.data); setVersionModalOpen(true); }
    } catch { /* handled */ }
  };

  const columns = [
    { title: '技能名', dataIndex: 'name', key: 'name' },
    { title: '意图', dataIndex: 'intent', key: 'intent' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled',
      render: (enabled: boolean, record: Skill) => (
        <Switch checked={enabled} onChange={(v) => handleToggle(record.id, v)} />
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Skill) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
          <Button size="small" icon={<ExperimentOutlined />} onClick={() => handleTest(record.id)}>测试</Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleVersions(record.intent)}>版本</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增Skill</Button>
        <Input placeholder="按意图搜索" allowClear onChange={(e) => setFilterIntent(e.target.value || undefined)} style={{ width: 200 }} />
        <Select placeholder="状态筛选" allowClear onChange={(v) => setFilterStatus(v)} style={{ width: 120 }}
          options={[{ value: 'enabled', label: '启用' }, { value: 'disabled', label: '禁用' }]} />
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: onPageChange }} />

      {/* Create/Edit Modal */}
      <Modal title={editItem ? '编辑Skill' : '新增Skill'} open={modalOpen} onOk={handleModalOk}
        onCancel={() => setModalOpen(false)} width={720} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="技能名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="intent" label="绑定意图" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {editItem && (
            <Form.Item name="version" label="版本号(需递增)" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
          )}
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Skill代码">
            <Editor height={300} language="typescript" theme="vs-dark" value={codeValue} onChange={(v) => setCodeValue(v || '')}
              options={{ minimap: { enabled: false }, fontSize: 14 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Test Modal */}
      <Modal title="Skill测试" open={testModalOpen} onCancel={() => setTestModalOpen(false)}
        onOk={executeTest} confirmLoading={testLoading} width={600}>
        <div style={{ marginBottom: 16 }}>
          <Typography.Text>输入参数 (JSON格式):</Typography.Text>
          <Editor height={150} language="json" theme="vs-dark" value={testParams}
            onChange={(v) => setTestParams(v || '{}')} options={{ minimap: { enabled: false } }} />
        </div>
        {testResult && (
          <div>
            <Typography.Text>执行结果:</Typography.Text>
            <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
              {testResult}
            </pre>
          </div>
        )}
      </Modal>

      {/* Version Modal */}
      <Modal title="Skill版本列表" open={versionModalOpen} onCancel={() => setVersionModalOpen(false)} footer={null}>
        <Table columns={[
          { title: '版本', dataIndex: 'version', key: 'version' },
          { title: '技能名', dataIndex: 'name', key: 'name' },
          { title: '更新时间', dataIndex: 'createdAt', key: 'createdAt' },
        ]} dataSource={versions} rowKey="id" size="small" pagination={false} />
      </Modal>
    </div>
  );
}