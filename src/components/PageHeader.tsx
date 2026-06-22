import React from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  backUrl?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, backUrl = "/employee/beranda" }) => {
  const { toggleTheme, handleLogout, theme } = useOutletContext<any>();

  return (
    <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-deep)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 12 }}>
        <NavLink to={backUrl} className="back-btn" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 18, transition: 'all 0.3s', flexShrink: 0 }}>
          <i className="bi bi-arrow-left"></i>
        </NavLink>
        <div className="header-info" style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 22px)', margin: 0, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </h2>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: 'var(--shadow-neu)' }}>
          <i className={theme === 'dark' ? "bi bi-moon-fill" : "bi bi-brightness-high-fill"}></i>
        </button>
        <button onClick={handleLogout} style={{ width: 32, height: 32, borderRadius: '50%', background: '#EF4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)', transition: 'all 0.3s' }}>
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default PageHeader;
