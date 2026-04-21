import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import type { LoginRequest } from '../types';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { saveToken } = useAuth();
  const [form, setForm] = useState<LoginRequest>({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('请输入用户名和密码'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      if (res.data) {
        saveToken(res.data.token);
        navigate('/workbench');
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-code flex items-center justify-center">
      <div className="w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">ID</div>
          <div>
            <div className="text-white text-xl font-bold">ID-App Runtime</div>
            <div className="text-text-tertiary text-sm">意图驱动动态应用运行时</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="用户名"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-input px-4 py-3 text-white text-sm
                focus:border-primary focus:outline-none transition-colors placeholder:text-text-tertiary"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-input px-4 py-3 text-white text-sm
                focus:border-primary focus:outline-none transition-colors placeholder:text-text-tertiary"
            />
          </div>

          {error && <div className="text-danger text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="text-center text-text-tertiary/50 text-xs mt-8">
          ID-App Runtime v1.0.0
        </div>
      </div>
    </div>
  );
}