import { Layout, Menu, Button, Typography } from 'antd';
import { RobotOutlined, CodeOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/llm', icon: <RobotOutlined />, label: '大模型配置' },
  { key: '/skill', icon: <CodeOutlined />, label: 'Skill管理' },
  { key: '/log', icon: <FileTextOutlined />, label: '日志管理' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearToken } = useAuth();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ padding: '16px 24px' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            ID-App Runtime
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text strong>ID-App Runtime 管理后台</Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>退出登录</Button>
        </Header>
        <Content style={{ margin: '24px', padding: '24px', background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}