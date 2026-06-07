import { Outlet } from 'react-router-dom';

const EmployeeLayout = () => {
  return (
    <div className="employee-wrapper" style={{ minHeight: '100vh', position: 'relative' }}>
      <main className="employee-content" style={{ paddingBottom: '70px' }}>
        <Outlet />
      </main>
      <nav className="bottom-nav" style={{ position: 'fixed', bottom: 0, width: '100%', display: 'flex', justifyContent: 'space-around', background: 'var(--bg-deep)', padding: '10px' }}>
        <span>Beranda</span>
        <span>Absen</span>
        <span>Profil</span>
      </nav>
    </div>
  );
};

export default EmployeeLayout;
