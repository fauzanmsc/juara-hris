import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '../api';
import logoWhite from '../assets/juara-hris-logo-white.png';
import logoBlack from '../assets/juara-hris-logo-black.png';

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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>({ name: 'Admin', position: 'Administrator', initial: 'AD' });
  const [waAdmin, setWaAdmin] = useState('628123456789');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCategory, setNotifCategory] = useState('Semua');

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
        } catch (e) { }
      };
      loadLatestProfile();

      // Load Notifications
      const loadNotifs = async () => {
        try {
          const res = await fetchApi('getNotifications', { user_id: parsedUser.user_id, role: parsedUser.role }, 'GET');
          if (res.success && res.notifications) {
            setNotifications(res.notifications);
            setUnreadCount(res.notifications.filter((n: any) => !n.is_read).length);
          }
        } catch (e) { }
      };
      loadNotifs();

      // Load Config for WA Admin
      const loadConfigData = async () => {
        try {
          const res = await fetchApi('getConfig', {}, 'GET');
          if (res.success && res.config && res.config.wa_admin) {
            setWaAdmin(res.config.wa_admin);
          }
        } catch (e) { }
      };
      loadConfigData();
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
      (window as any).showModalConfirm('Keluar Akun', 'Apakah Anda yakin ingin keluar ?', () => {
        localStorage.removeItem('hris_user');
        navigate('/');
      });
    } else {
      if (confirm('Apakah Anda yakin ingin keluar ?')) {
        localStorage.removeItem('hris_user');
        navigate('/');
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setCompact(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
        e.preventDefault();
        handleLogout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

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
    if (path.includes('job-details')) return 'Detail Jabatan';
    if (path.includes('salary-structures')) return 'Struktur Upah';
    if (path.includes('deductions')) return 'Potongan Upah';
    if (path.includes('bank-accounts')) return 'Rekening Karyawan';
    if (path.includes('run')) return 'Run Payroll';
    return 'Admin Panel';
  };

  const handleHardReset = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus cache dan memuat ulang aplikasi untuk mendapatkan versi terbaru?")) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (let name of names) caches.delete(name);
        });
      }
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const getSearchMenu = () => {
    const menu = [
      { category: 'HR & Operasional', title: 'Dashboard Utama', path: '/admin/dashboard', icon: 'bi-grid-1x2-fill' },
      { category: 'HR & Operasional', title: 'Manajemen Karyawan', path: '/admin/users', icon: 'bi-people-fill' },
      { category: 'HR & Operasional', title: 'Persetujuan', path: '/admin/approval', icon: 'bi-check-circle-fill' },
      { category: 'HR & Operasional', title: 'Kehadiran', path: '/admin/attendance', icon: 'bi-clock-history' },
      { category: 'HR & Operasional', title: 'Cuti', path: '/admin/leave-report', icon: 'bi-file-earmark-bar-graph-fill' },
      { category: 'HR & Operasional', title: 'Jabatan', path: '/admin/positions', icon: 'bi-briefcase-fill' },
      { category: 'HR & Operasional', title: 'Tugas', path: '/admin/tasks', icon: 'bi-list-task' },
      { category: 'Keuangan & Payroll', title: 'Level Jabatan', path: '/admin/payroll/level-jabatan', icon: 'bi-bar-chart-steps' },
      { category: 'Keuangan & Payroll', title: 'Detail Jabatan', path: '/admin/payroll/job-details', icon: 'bi-person-vcard' },
      { category: 'Keuangan & Payroll', title: 'Struktur Upah', path: '/admin/payroll/salary-structures', icon: 'bi-cash-coin' },
      { category: 'Keuangan & Payroll', title: 'Potongan Upah', path: '/admin/payroll/deductions', icon: 'bi-dash-circle' },
      { category: 'Keuangan & Payroll', title: 'Rekening Karyawan', path: '/admin/payroll/bank-accounts', icon: 'bi-bank' },
      { category: 'Keuangan & Payroll', title: 'Run Payroll', path: '/admin/payroll/run', icon: 'bi-calculator-fill text-success' },
      { category: 'Sistem & Master Data', title: 'Hari Libur', path: '/admin/holidays', icon: 'bi-calendar2-x-fill' },
      { category: 'Sistem & Master Data', title: 'Pengaturan', path: '/admin/config', icon: 'bi-gear-fill' }
    ];
    return menu;
  };

  const filteredMenu = getSearchMenu().filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase()));

  // Group by category
  const groupedMenu = filteredMenu.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as any);

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
            <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '4px 0' }}>
              <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Juara HRIS" style={{ maxHeight: 54, maxWidth: '100%', objectFit: 'contain' }} />
            </div>

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

            <div className="nav-section-label">KEUANGAN & PAYROLL</div>
            <NavLink to="/admin/payroll/level-jabatan" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-bar-chart-steps"></i><span>Level Jabatan</span>
            </NavLink>
            <NavLink to="/admin/payroll/job-details" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-person-vcard"></i><span>Detail Jabatan</span>
            </NavLink>
            <NavLink to="/admin/payroll/salary-structures" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-cash-coin"></i><span>Struktur Upah</span>
            </NavLink>
            <NavLink to="/admin/payroll/deductions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-dash-circle"></i><span>Potongan Upah</span>
            </NavLink>
            <NavLink to="/admin/payroll/bank-accounts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-bank"></i><span>Rekening Karyawan</span>
            </NavLink>
            <NavLink to="/admin/payroll/run" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-calculator-fill text-success"></i><span>Run Payroll</span>
            </NavLink>

            <div className="nav-section-label">SISTEM</div>
            <NavLink to="/admin/holidays" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-calendar2-x-fill"></i><span>Hari Libur</span>
            </NavLink>
            <NavLink to="/admin/config" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-gear-fill"></i><span>Pengaturan</span>
            </NavLink>

            <div className="nav-section-label">INTEGRASI</div>
            <a className="sidebar-link" href="https://docs.google.com/spreadsheets/d/1EXmtgASni2x2dzdDhYIYyH7F_E_Jqi_wUncLrf2U1KM" target="_blank" rel="noopener noreferrer">
              <img src="/img/icons/g-sheets.svg" alt="Google Sheets" style={{ width: 20, height: 20, marginRight: 12, flexShrink: 0, display: 'block' }} />
              <span>Akses Database</span>
            </a>
            <a className="sidebar-link" href="https://drive.google.com/drive/folders/1wciBOc5tFFwzMPVI1G42bUmfpOxamlMQ" target="_blank" rel="noopener noreferrer">
              <img src="/img/icons/g-drive.svg" alt="Google Drive" style={{ width: 20, height: 20, marginRight: 12, flexShrink: 0, display: 'block' }} />
              <span>Akses Drive</span>
            </a>
          </nav>

          <div className="sidebar-footer" style={{ padding: '16px 20px', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div
              className="workspace-selector"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--bg-input-focus)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--bg-input)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div
                className="workspace-icon"
                style={{
                  position: 'relative',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 16,
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                🏢
                <div className="status-indicator-dot online" title="Online Jaringan"
                  style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--bg-surface)', boxShadow: '0 0 8px rgba(0,0,0,0.3)', zIndex: 10 }}>
                </div>
              </div>
              <div className="workspace-info" style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 700, textTransform: 'uppercase' }}>Workspace</span>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>JEF GROUP ID</h4>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar (⌘ X)"
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: 4, transition: 'color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)}>
                <i className="bi bi-list"></i>
              </button>

              <button className="btn-compact-sidebar" onClick={() => setCompact(!compact)} data-tooltip="Toggle Sidebar (⌘ S)"
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  width: 38, height: 38, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', transition: 'all var(--transition)'
                }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  {!compact && <path d="M9 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h4V3z" fill="currentColor" stroke="none"></path>}
                </svg>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div 
                  onClick={() => setSearchModalOpen(true)}
                  className="global-search-input-wrap"
                >
                  <i className="bi bi-search" style={{ fontSize: 16 }}></i>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cari data, menu, atau akses...</span>
                  <div className="hide-on-mobile" style={{ background: 'var(--bg-deep)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid var(--border)' }}>⌘ K</div>
                </div>
              </div>
            </div>
            <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="user-dropdown-wrap hover-dropdown hide-on-mobile">
                <button className="topbar-btn" data-tooltip="Notifikasi">
                  <i className="bi bi-bell"></i>
                  {unreadCount > 0 && <span className="topbar-badge" id="notifBadgeCount">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                <div className="user-dropdown-menu" id="notifDropdownMenu" style={{ width: 380, right: -120, padding: 0, cursor: 'default' }}>
                  <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Notifikasi</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => setUnreadCount(0)} style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, padding: 0 }}><i className="bi bi-envelope-open" style={{ marginRight: 4 }}></i> Tandai semua dibaca</button>
                  </div>
                  <div className="notif-categories scroll-x" style={{ display: 'flex', gap: 16, padding: '16px 20px', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
                    {['Semua', 'Kehadiran', 'Pengajuan', 'Sistem'].map(cat => {
                      const count = cat === 'Semua'
                        ? notifications.length
                        : notifications.filter(n => n.type === cat).length;

                      let icon = 'bi-grid-fill';
                      let color = '#0ea5e9';
                      if (cat === 'Kehadiran') { icon = 'bi-person-bounding-box'; color = '#22c55e'; }
                      if (cat === 'Pengajuan') { icon = 'bi-file-earmark-text-fill'; color = '#f59e0b'; }
                      if (cat === 'Sistem') { icon = 'bi-gear-fill'; color = '#8b5cf6'; }

                      return (
                        <div key={cat} className={`notif-cat-item ${notifCategory === cat ? 'active' : ''}`} onClick={() => setNotifCategory(cat)}>
                          <div className="notif-cat-icon" style={notifCategory === cat ? { background: `${color}1A`, color: color } : {}}>
                            <i className={`bi ${icon}`}></i>
                            {count > 0 && <span className="topbar-badge">{count > 99 ? '99+' : count}</span>}
                          </div>
                          <span className="notif-cat-label">{cat}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="notif-list" id="notifList" style={{ maxHeight: 380, overflowY: 'auto', background: 'var(--bg-deep)', padding: 12 }}>
                    {notifications.filter(n => notifCategory === 'Semua' || n.type === notifCategory).length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <i className="bi bi-bell-slash" style={{ fontSize: 32, opacity: 0.3, marginBottom: 12, display: 'block' }}></i>
                        <p style={{ margin: 0, fontSize: 13 }}>Tidak ada notifikasi {notifCategory !== 'Semua' ? `untuk ${notifCategory}` : ''}</p>
                      </div>
                    ) : (
                      notifications.filter(n => notifCategory === 'Semua' || n.type === notifCategory).map((notif, i) => (
                        <div key={notif.id || i} className="notif-card" style={{ display: 'flex', gap: 12, padding: 16, background: 'var(--bg-surface)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--border)', cursor: 'pointer', position: 'relative' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${notif.color}1A`, color: notif.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                            <i className={`bi ${notif.icon}`}></i>
                          </div>
                          <div className="notif-card-content" style={{ flex: 1, minWidth: 0 }}>
                            <h4 className="notif-card-title" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>{notif.title}</span>
                              {!notif.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>}
                            </h4>
                            <p className="notif-card-body" style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{notif.body}</p>
                            <span className="notif-card-time" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'block' }}>{notif.timeStr}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <button
                className="topbar-btn hide-on-mobile"
                data-tooltip="Pusat Bantuan"
                onClick={() => window.open(`https://wa.me/${waAdmin}?text=Halo%20Admin,%20saya%20membutuhkan%20bantuan%20terkait%20sistem%20JUARA%20HRIS.`, '_blank')}
              >
                <i className="bi bi-question-circle"></i>
              </button>

              <button className="topbar-btn hide-on-mobile" onClick={handleHardReset} data-tooltip="Bersihkan Cache & Refresh">
                <i className="bi bi-arrow-clockwise"></i>
              </button>

              <button className="topbar-btn" onClick={toggleTheme} data-tooltip="Beralih mode (⌘ L)">
                <i className={theme === 'dark' ? "bi bi-brightness-high" : "bi bi-moon"}></i>
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
                  <NavLink to="/admin/config" className="dropdown-item" onClick={() => document.getElementById('userDropdownMenu')?.classList.remove('show')}><i className="bi bi-gear"></i> Pengaturan</NavLink>
                  <div className="dropdown-divider"></div>
                  <a href="#!" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="dropdown-item" style={{ justifyContent: 'center', color: 'var(--danger)', fontWeight: 600 }}>Log Keluar</a>
                </div>
              </div>
            </div>
          </header>

          <div className="overlay" style={{ display: sidebarOpen ? 'block' : 'none' }} onClick={() => setSidebarOpen(false)}></div>

          {searchModalOpen && (
            <div className="global-search-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSearchModalOpen(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', backdropFilter: 'blur(4px)' }}>
              <div className="global-search-modal fade-in" style={{ background: 'var(--bg-surface)', width: '90%', maxWidth: 500, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                <div className="search-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <i className="bi bi-search text-muted" style={{ fontSize: 18 }}></i>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Ketik untuk mencari menu atau data..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 15, outline: 'none' }}
                  />
                  <button onClick={() => setSearchModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', background: 'var(--bg-deep)', fontWeight: 700 }}>ESC</button>
                </div>
                <div className="search-body scroll-y" style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
                  {Object.keys(groupedMenu).length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <i className="bi bi-search" style={{ fontSize: 32, opacity: 0.2, marginBottom: 16, display: 'block' }}></i>
                      Tidak ada hasil ditemukan
                    </div>
                  ) : (
                    Object.keys(groupedMenu).map(category => (
                      <div key={category} className="search-category" style={{ marginBottom: 8 }}>
                        <div style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{category.toUpperCase()}</div>
                        {groupedMenu[category].map((item: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => { navigate(item.path); setSearchModalOpen(false); }}
                            className="search-item"
                          >
                            <i className={item.icon + ' text-muted'} style={{ fontSize: 16 }}></i>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</span>
                            <i className="bi bi-chevron-right text-muted" style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.5 }}></i>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLayout;
