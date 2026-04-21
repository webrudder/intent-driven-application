import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

const navItems = [
  { key: '/workbench', label: '工作台', icon: '⚡' },
  { key: '/llm', label: '大模型配置', icon: '🤖' },
  { key: '/skill', label: 'Skill管理', icon: '🔧' },
  { key: '/log', label: '执行日志', icon: '📋' },
  { key: '/settings', label: '设置', icon: '⚙' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearToken } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 64 : 240;

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-bg-body">
      {/* Sidebar */}
      <div
        className="bg-[#1D2129] text-white flex flex-col transition-all duration-200"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-[#333]">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">ID</div>
          {!collapsed && <span className="font-semibold text-sm tracking-wide">ID-App Runtime</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
                ${location.pathname.startsWith(item.key)
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-tertiary hover:text-white hover:bg-white/5'}`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse + Logout */}
        <div className="border-t border-[#333] py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-tertiary hover:text-white transition-colors"
          >
            <span>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>折叠</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-tertiary hover:text-danger transition-colors"
          >
            <span>⎋</span>
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>

        {/* Version */}
        {!collapsed && (
          <div className="px-4 py-2 text-xs text-text-tertiary/50">
            v1.0.0
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}