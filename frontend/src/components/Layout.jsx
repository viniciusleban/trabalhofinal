import { NavLink, useNavigate } from 'react-router-dom';

const linkEstilo = ({ isActive }) => ({
  display: 'block',
  padding: '0.7rem 1rem',
  borderRadius: '8px',
  color: isActive ? '#ffffff' : '#d7ece9',
  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.92rem',
  marginBottom: '0.3rem'
});

export default function Layout({ children }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '240px',
        background: 'var(--petroleo-900)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Farmácia</div>
          <div style={{ color: 'var(--petroleo-300)', fontSize: '0.78rem' }}>Sistema de Saúde Integrado</div>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/dispensar" style={linkEstilo}>Nova dispensação</NavLink>
          <NavLink to="/historico" style={linkEstilo}>Histórico</NavLink>
          <NavLink to="/medicamentos" style={linkEstilo}>Medicamentos</NavLink>
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>{usuario.nome}</div>
          <div style={{ color: 'var(--petroleo-300)', fontSize: '0.78rem', marginBottom: '0.8rem', textTransform: 'capitalize' }}>{usuario.papel}</div>
          <button className="btn-secundario" style={{ width: '100%' }} onClick={sair}>Sair</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: '1100px' }}>
        {children}
      </main>
    </div>
  );
}
