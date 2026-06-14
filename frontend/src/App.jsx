import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dispensar from './pages/Dispensar.jsx';
import Historico from './pages/Historico.jsx';
import Medicamentos from './pages/Medicamentos.jsx';

function Protegida({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dispensar" element={<Protegida><Dispensar /></Protegida>} />
      <Route path="/historico" element={<Protegida><Historico /></Protegida>} />
      <Route path="/medicamentos" element={<Protegida><Medicamentos /></Protegida>} />
      <Route path="*" element={<Navigate to="/dispensar" replace />} />
    </Routes>
  );
}
