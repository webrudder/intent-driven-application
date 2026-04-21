import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExperimentOutlined } from '@ant-design/icons';
import { usePagination } from '../hooks/usePagination';
import * as llmApi from '../api/llm';
import type { LLMConfig, LLMConfigCreateInput } from '../types';

export default function LLMConfig() {
  const { page, pageSize, total, setTotal, onPageChange } = usePagination();
  const [data, setData] = useState<LLMConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<LLMConfig | null>(null);
  const [testLoading, setTestLoading] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await llmApi.listLLMConfigs(page, pageSize);
      if (res.data) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (item: LLMConfig) => {
    setEditItem(item);
    form.setFieldsValue({ name: item.name, baseUrl: item.baseUrl, model: item.model, isDefault: item.isDefault });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    try {
      if (editItem) {
        await llmApi.updateLLMConfig(editItem.id, values);
        message.success('更新成功');
      } else {
        await llmApi.createLLMConfig(values as LLMConfigCreateInput);
        message.success('新增成功');
      }
      setModalOpen(false);
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await llmApi.deleteLLMConfig(id);
      if (res.code === 0) {
        message.success('删除成功');
        fetchData();
      }
    } catch { /* handled */ }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await llmApi.toggleLLMEnable(id, enabled);
      fetchData();
    } catch { /* handled */ }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await llmApi.setDefaultLLM(id);
      message.success('已设为默认模型');
      fetchData();
    } catch { /* handled */ }
  };

  const handleTest = async (id: string) => {
    setTestLoading(id);
    try {
      const res = await llmApi.testLLMConfig(id);
      if (res.data?.success) {
        message.success(`测试成功: ${res.data.message}`);
      } else {
        message.error(`测试失败: ${res.data?.message || '未知错误'}`);
      }
    } catch {
      message.error('测试请求失败');
    } finally {
      setTestLoading(null);
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '模型', dataIndex: 'model', key: 'model' },
    { title: 'Base URL', dataIndex: 'baseUrl', key: 'baseUrl', ellipsis: true },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled',
      render: (enabled: boolean, record: LLMConfig) => (
        <Switch checked={enabled} onChange={(v) => handleToggle(record.id, v)} />
      ),
    },
    {
      title: '默认', dataIndex: 'isDefault', key: 'isDefault',
      render: (isDefault: boolean) => isDefault ? <Tag color="blue">默认</Tag> : null,
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: LLMConfig) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {!record.isDefault && (
            <Popconfirm title="确认删除？删除后不可恢复" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
          {!record.isDefault && record.enabled && (
            <Button size="small" onClick={() => handleSetDefault(record.id)}>设为默认</Button>
          )}
          <Button size="small" icon={<ExperimentOutlined />} loading={testLoading === record.id} onClick={() => handleTest(record.id)}>测试</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        新增模型
      </Button>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: onPageChange }}
      />
      <Modal
        title={editItem ? '编辑大模型' : '新增大模型'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editItem && (
            <Form.Item name="apiKey" label="API Key" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true }]}>
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>
          <Form.Item name="model" label="模型名" rules={[{ required: true }]}>
            <Input placeholder="deepseek-chat" />
          </Form.Item>
          <Form.Item name="isDefault" label="设为默认模型" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}