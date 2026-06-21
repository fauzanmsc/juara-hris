import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '../api';

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Check login
    const loggedUser = localStorage.getItem('hris_user');
    if (!loggedUser) {
      navigate('/');
    } else {
      const parsedUser = JSON.parse(loggedUser);
      setUser({
        ...parsedUser,
        name: parsedUser.name || 'Employee',
        position: parsedUser.position || 'Employee',
        initial: getInitials(parsedUser.name || 'Employee')
      });

      // Load latest profile from DB
      const loadLatestProfile = async () => {
        try {
          const res = await fetchApi('getUsers', {});
          if (res.success && res.users) {
            const me = res.users.find((u: any) => String(u.user_id) === String(parsedUser.user_id));
            if (me) {
              const updated = { ...parsedUser, ...me };
              localStorage.setItem('hris_user', JSON.stringify(updated));
              setUser({
                ...updated,
                name: updated.name || 'Employee',
                position: updated.position || 'Employee',
                initial: getInitials(updated.name || 'Employee')
              });
            }
          }
        } catch (e) { }
      };
      loadLatestProfile();
    }
  }, [navigate]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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

  return (
    <>
      <div className="wrap-employee">
        <Outlet context={{ toggleTheme, handleLogout, user, notifOpen, setNotifOpen, notifs, setNotifs, theme }} />

        <nav className="employee-bottom-nav">
          <NavLink to="/employee/beranda" className={({ isActive }) => `emp-nav-icon ${isActive ? 'active' : ''}`}>
            <i className="bi bi-house-door-fill"></i>
          </NavLink>
          <NavLink to="/employee/leave" className={({ isActive }) => `emp-nav-icon ${isActive ? 'active' : ''}`}>
            <i className="bi bi-journal-text"></i>
          </NavLink>

          <NavLink to="/employee/attendance" className="scan-btn-center">
            <i className="bi bi-person-bounding-box"></i>
          </NavLink>

          <NavLink to="/employee/history" className={({ isActive }) => `emp-nav-icon ${isActive ? 'active' : ''}`}>
            <i className="bi bi-calendar4-week"></i>
          </NavLink>
          <NavLink to="/employee/profile" className={({ isActive }) => `emp-nav-icon ${isActive ? 'active' : ''}`}>
            <i className="bi bi-person"></i>
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export default EmployeeLayout;
