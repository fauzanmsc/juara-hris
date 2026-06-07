import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="admin-wrapper" style={{ display: 'flex' }}>
      <aside className="admin-sidebar" style={{ width: '250px', background: 'var(--bg-deep)', height: '100vh' }}>
        <h2>Admin Panel</h2>
        {/* Sidebar content here */}
      </aside>
      <main className="admin-main" style={{ flex: 1, padding: '20px' }}>
        <header className="admin-topbar">
          <h3>Dashboard</h3>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
