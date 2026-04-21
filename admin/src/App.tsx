import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LLMConfig from './pages/LLMConfig';
import SkillManage from './pages/SkillManage';
import LogView from './pages/LogView';
import AppLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/llm" element={<LLMConfig />} />
          <Route path="/skill" element={<SkillManage />} />
          <Route path="/log" element={<LogView />} />
        </Route>
        <Route path="*" element={<Navigate to="/llm" replace />} />
      </Routes>
    </BrowserRouter>
  );
}