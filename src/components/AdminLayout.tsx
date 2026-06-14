import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '../api';

function getInitials(name: string) {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('hris_theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [user, setUser] = useState<any>({ name: 'Admin', position: 'Administrator', initial: 'AD' });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hris_theme', theme);
  }, [theme]);

  useEffect(() => {
    const loggedUser = localStorage.getItem('hris_user');
    if (!loggedUser) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(loggedUser);
      if (parsedUser.role !== 'Admin') {
        navigate('/employee/beranda');
      }
      setUser({
        ...parsedUser,
        name: parsedUser.name || 'Admin',
        position: 'Administrator',
        initial: getInitials(parsedUser.name || 'Admin')
      });

      // Load latest profile from DB
      const loadLatestProfile = async () => {
        try {
          const res = await fetchApi('getUsers', {});
          if (res.success && res.users) {
            const me = res.users.find((u: any) => String(u.user_id) === String(parsedUser.user_id));
            if (me) {
              const updated = { ...parsedUser, ...me, role: parsedUser.role };
              localStorage.setItem('hris_user', JSON.stringify(updated));
              setUser({
                ...updated,
                name: updated.name || 'Admin',
                position: 'Administrator',
                initial: getInitials(updated.name || 'Admin')
              });
            }
          }
        } catch (e) {}
      };
      loadLatestProfile();
    }
  }, [navigate]);

  useEffect(() => {
    // Set page body class
    document.body.classList.add('admin-layout');
    return () => {
      document.body.classList.remove('admin-layout');
    };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const handleLogout = () => {
    if ((window as any).showModalConfirm) {
      (window as any).showModalConfirm('Keluar Akun', 'Apakah Anda yakin ingin keluar dari sistem HRIS?', () => {
        localStorage.removeItem('hris_user');
        navigate('/');
      });
    } else {
      if (confirm('Apakah Anda yakin ingin keluar dari sistem HRIS?')) {
        localStorage.removeItem('hris_user');
        navigate('/');
      }
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard HC';
    if (path.includes('users')) return 'Manajemen Karyawan';
    if (path.includes('approval')) return 'Persetujuan';
    if (path.includes('attendance')) return 'Data Kehadiran';
    if (path.includes('leave-report')) return 'Laporan Cuti';
    if (path.includes('positions')) return 'Data Jabatan';
    if (path.includes('tasks')) return 'Tugas Karyawan';
    if (path.includes('holidays')) return 'Hari Libur';
    if (path.includes('config')) return 'Pengaturan Sistem';
    return 'Admin Panel';
  };

  return (
    <>
      <div className="bg-animated">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-grid"></div>
      </div>

      <div className={`admin-layout ${compact ? 'sidebar-compact' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>

        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: 'block' }}></div>
        )}

        <aside className="sidebar" id="sidebar">
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <img src="/img/logomark.png" alt="JEF" className="sidebar-brand-icon" />
              <div className="sidebar-brand-text">
                <h3>Juara HRIS</h3>
                <p>HC Admin Panel</p>
              </div>
            </div>
            <button className="btn-compact-sidebar" onClick={() => setCompact(!compact)} title="Minimize Sidebar"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 'auto', transition: 'all var(--transition)', flexShrink: 0 }}>
              <i className={compact ? "bi bi-chevron-right" : "bi bi-chevron-left"}></i>
            </button>
            <button className="btn-close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close Sidebar" style={{ flexShrink: 0 }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">HUB UTAMA</div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-grid-1x2-fill"></i><span>Dashboard</span>
            </NavLink>

            <div className="nav-section-label">TENAGA KERJA</div>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-people-fill"></i><span>Karyawan</span>
            </NavLink>
            <NavLink to="/admin/approval" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-clipboard-check-fill"></i><span>Persetujuan</span>
            </NavLink>
            <NavLink to="/admin/attendance" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-clock-history"></i><span>Kehadiran</span>
            </NavLink>
            <NavLink to="/admin/leave-report" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-file-earmark-bar-graph-fill"></i><span>Cuti</span>
            </NavLink>
            <NavLink to="/admin/positions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-briefcase-fill"></i><span>Jabatan</span>
            </NavLink>
            <NavLink to="/admin/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-list-task"></i><span>Tugas</span>
            </NavLink>

            <div className="nav-section-label">SISTEM</div>
            <NavLink to="/admin/holidays" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-calendar2-x-fill"></i><span>Hari Libur</span>
            </NavLink>
            <NavLink to="/admin/config" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-gear-fill"></i><span>Pengaturan</span>
            </NavLink>

            <div className="nav-section-label">INTEGRASI</div>
            <a className="sidebar-link" href="https://docs.google.com/spreadsheets/d/1wQ7PB5Zl7UpXE8kVuAD6fZDyPGxY1_pPMNJS5NiHg9E/" target="_blank" rel="noopener noreferrer">
              <img src="/img/icons/g-sheets.svg" alt="Google Sheets" style={{ width: 20, height: 20, marginRight: 12, flexShrink: 0, display: 'block' }} />
              <span>Akses Database</span>
            </a>
            <a className="sidebar-link" href="https://drive.google.com/drive/folders/1BGiuWcUZlIQSSFsnqfsfRjZC6ZoO7iRq" target="_blank" rel="noopener noreferrer">
              <img src="/img/icons/g-drive.svg" alt="Google Drive" style={{ width: 20, height: 20, marginRight: 12, flexShrink: 0, display: 'block' }} />
              <span>Akses Drive</span>
            </a>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user" onClick={handleLogout}>
              <div className="avatar-wrapper" style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
                {user.profile_pic_url ? (
                  <img src={user.profile_pic_url} alt="Profile" className="avatar avatar-sm" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <div className="avatar avatar-sm" style={{ width: '100%', height: '100%' }}>{user.initial}</div>
                )}
                <div className="status-indicator-dot online" title="Online Jaringan"
                  style={{ position: 'absolute', bottom: -2, right: -2, width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--bg-surface)', boxShadow: '0 0 8px rgba(0,0,0,0.3)', zIndex: 10, transition: 'all var(--transition)' }}>
                </div>
              </div>
              <div className="sidebar-user-info">
                <h4>{user.name}</h4>
                <p>Administrator</p>
              </div>
              <i className="bi bi-box-arrow-right text-danger" style={{ marginLeft: 'auto' }}></i>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)}>
                <i className="bi bi-list"></i>
              </button>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <h2 className="topbar-title" style={{ margin: 0 }}>{getPageTitle()}</h2>
              </div>
            </div>
            <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="user-dropdown-wrap hover-dropdown">
                <button className="topbar-btn" data-tooltip="Notifikasi">
                  <i className="bi bi-bell"></i>
                  <span className="topbar-badge" id="notifBadgeCount">99+</span>
                </button>
                <div className="user-dropdown-menu" id="notifDropdownMenu" style={{ width: 380, right: -120, padding: 0, cursor: 'default' }}>
                  <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Notifikasi</h3>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, padding: 0 }}><i className="bi bi-envelope-open" style={{ marginRight: 4 }}></i> Tandai semua sebagai sudah dibaca</button>
                  </div>
                  <div className="notif-categories scroll-x" style={{ display: 'flex', gap: 16, padding: '16px 20px', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
                    <div className="notif-cat-item active">
                      <div className="notif-cat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                        <i className="bi bi-grid-fill"></i>
                        <span className="topbar-badge">99+</span>
                      </div>
                      <span className="notif-cat-label">Semua</span>
                    </div>
                    <div className="notif-cat-item">
                      <div className="notif-cat-icon">
                        <i className="bi bi-people-fill"></i>
                        <span className="topbar-badge">80</span>
                      </div>
                      <span className="notif-cat-label">Kreator</span>
                    </div>
                    <div className="notif-cat-item">
                      <div className="notif-cat-icon">
                        <i className="bi bi-shield-exclamation-fill"></i>
                        <span className="topbar-badge">99+</span>
                      </div>
                      <span className="notif-cat-label">Pelanggar...</span>
                    </div>
                    <div className="notif-cat-item">
                      <div className="notif-cat-icon">
                        <i className="bi bi-star-fill"></i>
                        <span className="topbar-badge">18</span>
                      </div>
                      <span className="notif-cat-label">Operasi</span>
                    </div>
                    <div className="notif-cat-item">
                      <div className="notif-cat-icon">
                        <i className="bi bi-briefcase-fill"></i>
                      </div>
                      <span className="notif-cat-label">Administr...</span>
                    </div>
                  </div>
                  <div className="notif-list" id="notifList" style={{ maxHeight: 380, overflowY: 'auto', background: 'var(--bg-deep)', padding: 12 }}>
                    <div className="notif-card">
                      <div className="notif-card-content">
                        <h4 className="notif-card-title">Permohonan pengunduran diri <span className="notif-dot"></span></h4>
                        <p className="notif-card-body">Permohonan pengunduran diri <span>ixsan</span> telah ditolak. Hubungan manajemen antara host dan agensi Anda akan berlanjut.</p>
                        <span className="notif-card-time">2 jam lalu</span>
                      </div>
                      <i className="bi bi-chevron-right notif-card-arrow"></i>
                    </div>
                    <div className="notif-card">
                      <div className="notif-card-content">
                        <h4 className="notif-card-title">Tata kelola konten: pelanggaran dengan tingkat keparahan tertinggi oleh kreator agensi <span className="notif-dot"></span></h4>
                        <p className="notif-card-body">japlen_, kreator LIVE yang Anda kelola, melakukan pelanggaran dengan tingkat keparahan tertinggi berdasarkan aturan tata kelola konten.</p>
                        <span className="notif-card-time">3 jam lalu</span>
                      </div>
                      <i className="bi bi-chevron-right notif-card-arrow"></i>
                    </div>
                    <div className="notif-card">
                      <div className="notif-card-content">
                        <h4 className="notif-card-title">Permohonan pengunduran diri <span className="notif-dot"></span></h4>
                        <p className="notif-card-body">Permohonan pengunduran diri OM RECORD telah ditolak. Hubungan manajemen antara host dan agensi Anda akan berlanjut.</p>
                        <span className="notif-card-time">3 jam lalu</span>
                      </div>
                      <i className="bi bi-chevron-right notif-card-arrow"></i>
                    </div>
                  </div>
                </div>
              </div>

              <button className="topbar-btn" data-tooltip="Pusat Bantuan">
                <i className="bi bi-question-circle"></i>
              </button>

              <button className="topbar-btn" onClick={toggleTheme} data-tooltip="Beralih ke mode gelap">
                <i className={theme === 'dark' ? "bi bi-brightness-high" : "bi bi-moon-fill"}></i>
              </button>

              <div className="topbar-divider hide-on-mobile"></div>

              <div className="user-dropdown-wrap hover-dropdown">
                <button className="topbar-btn user-btn" style={{ padding: user.profile_pic_url ? 2 : undefined, overflow: 'hidden' }}>
                  {user.profile_pic_url ? (
                    <img src={user.profile_pic_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <i className="bi bi-person"></i>
                  )}
                </button>
                <div className="user-dropdown-menu" id="userDropdownMenu">
                  <div className="dropdown-header">{user.name || 'Juara Agency'}</div>
                  <a href="#!" onClick={(e) => e.preventDefault()} className="dropdown-item"><i className="bi bi-shield-exclamation"></i> Laporkan pelanggaran</a>
                  <a href="#!" onClick={(e) => e.preventDefault()} className="dropdown-item"><i className="bi bi-file-earmark-text"></i> Ketentuan dan kebijakan</a>
                  <a href="#!" onClick={(e) => { e.preventDefault(); navigate('/admin/config'); }} className="dropdown-item"><i className="bi bi-gear"></i> Pengaturan</a>
                  <div className="dropdown-divider"></div>
                  <a href="#!" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="dropdown-item" style={{ justifyContent: 'center', color: 'var(--danger)', fontWeight: 600 }}>Log Keluar</a>
                </div>
              </div>
            </div>
          </header>

          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLayout;
