import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

const EmployeeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('hris_theme') || 'dark');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [user, setUser] = useState<any>({ name: 'User', position: 'Employee', initial: 'U' });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hris_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Determine body class based on route
    let bodyClass = 'employee-page';
    if (location.pathname.includes('/attendance')) bodyClass = 'attendance-page';
    else if (location.pathname.includes('/leave')) bodyClass = 'leave-page';
    else if (location.pathname.includes('/history')) bodyClass = 'history-page';
    else if (location.pathname.includes('/tasks')) bodyClass = 'leave-page';

    document.body.className = '';
    document.body.classList.add(bodyClass);
    
    return () => {
      document.body.classList.remove(bodyClass);
    };
  }, [location.pathname]);

  useEffect(() => {
    // Check login
    const loggedUser = localStorage.getItem('hris_user');
    if (!loggedUser) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(loggedUser);
      setUser({
        name: parsedUser.name || 'Employee',
        position: parsedUser.position || 'Employee',
        initial: (parsedUser.name || 'E').charAt(0).toUpperCase()
      });
    }
  }, [navigate]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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

  return (
    <>
      <div className="wrap-employee">
        <Outlet context={{ toggleTheme, handleLogout, user, notifOpen, setNotifOpen, notifs, setNotifs, theme }} />

        <nav className="bottom-nav">
          <NavLink to="/employee/beranda" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="bi bi-house-fill"></i>Beranda
          </NavLink>
          <NavLink to="/employee/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <i className="bi bi-person-bounding-box"></i>
              <div className="nav-indicator"></div>
            </div>
            Absensi
          </NavLink>
          <NavLink to="/employee/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="bi bi-list-task"></i>Tugas
          </NavLink>
          <NavLink to="/employee/leave" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="bi bi-calendar2-check-fill"></i>Pengajuan
          </NavLink>
          <NavLink to="/employee/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="bi bi-clock-history"></i>Riwayat
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export default EmployeeLayout;
