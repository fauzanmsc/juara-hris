import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';

const Beranda = () => {
  const navigate = useNavigate();
  const { toggleTheme, handleLogout, user, notifOpen, setNotifOpen, notifs, setNotifs, theme } = useOutletContext<any>();
  const [stats, setStats] = useState({ hadir: 0, terlambat: 0, cuti: 0, rate: 100 });
  const [todayLog, setTodayLog] = useState({ clockIn: '', clockOut: '', statusIn: '', statusOut: '' });
  const [activities, setActivities] = useState<any[]>([]);
  const [clockDate, setClockDate] = useState('');
  const [clockTime, setClockTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayHoliday, setTodayHoliday] = useState<string | null>(null);
  const [todayLeave, setTodayLeave] = useState<string | null>(null);

  // Edit Profile States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPin, setEditPin] = useState('');
  const [editPinVis, setEditPinVis] = useState(false);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);

  const handleEditProfileClick = () => {
    setEditPhotoPreview(user.profile_pic_url || null);
    setEditPin('');
    setEditPinVis(false);
    setEditModalOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setEditPhotoPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDayName = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userStr = localStorage.getItem('hris_user');
        if (!userStr) return;
        const u = JSON.parse(userStr);

        const res = await fetchApi('employeeDashboard', { user_id: u.user_id }, 'GET');
        if (res.success) {
          const st = res.stats || {};
          const hadir = st.hadir || 0;
          const terlambat = st.terlambat || 0;
          const rate = hadir > 0 ? Math.round(((hadir - terlambat) / hadir) * 100) : 100;
          setStats({
            hadir,
            terlambat,
            cuti: st.sisa_cuti || 0,
            rate
          });
          setTodayLog({
            clockIn: res.today_in || '',
            clockOut: res.today_out || '',
            statusIn: res.status_in || '',
            statusOut: res.status_out || '',
          });
          setTodayHoliday(res.today_holiday || null);
          setTodayLeave(res.today_leave || null);
          
          const mappedActivities = (res.activities || []).map((a: any) => ({
            ...a,
            type: a.title === 'Clock In' ? 'in' : a.title === 'Clock In & Out' ? 'out' : 'other'
          }));
          setActivities(mappedActivities);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      setClockDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
      setClockTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 20 }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <div className="header-top">
          <div className="brand-row">
            <span>JEF HRIS</span>
            <span className="live-badge">LIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <button className="theme-toggle-btn" onClick={() => setNotifOpen(!notifOpen)} title="Notifikasi"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 16, transition: 'all var(--transition)', cursor: 'pointer', position: 'relative' }}>
              <i className="bi bi-bell-fill"></i>
              {notifs.length > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, background: 'var(--danger)', color: 'white', fontSize: 9, fontWeight: 800, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card)' }}>
                  {notifs.length}
                </span>
              )}
            </button>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 16, transition: 'all var(--transition)', cursor: 'pointer' }}>
              <i className={theme === 'dark' ? "bi bi-brightness-high-fill" : "bi bi-moon-stars-fill"}></i>
            </button>
            <button className="btn-logout" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Keluar</button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <>
                <div style={{position: 'fixed', inset: 0, zIndex: 999}} onClick={() => setNotifOpen(false)}></div>
                <div style={{ position: 'absolute', top: 44, right: 0, width: 290, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-neu)', zIndex: 1000, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--text)' }}><i className="bi bi-bell-fill text-primary" style={{ marginRight: 4 }}></i> Notifikasi</span>
                  <button onClick={() => setNotifs([])} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 10, fontWeight: 800, cursor: 'pointer', padding: 0 }}>Baca Semua</button>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notifs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>Tidak ada notifikasi baru</div>
                  ) : (
                    notifs.map((n: any, i: number) => <div key={i}>{n.message}</div>)
                  )}
                </div>
              </div>
              </>
            )}
          </div>
        </div>
        <div className="profile-row">
          <div className="avatar-container" style={{ position: 'relative', flexShrink: 0 }}>
            {user.profile_pic_url ? (
              <img src={user.profile_pic_url} alt="Profile" className="avatar-emp" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="avatar-emp">{user.initial}</div>
            )}
            <button className="btn-edit-profile-avatar" onClick={handleEditProfileClick} style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--primary)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 10, cursor: 'pointer', zIndex: 10, boxShadow: 'var(--shadow-neu-soft)' }}>
              <i className="bi bi-pencil-fill"></i>
            </button>
          </div>
          <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ margin: 0 }}>{user.name}</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span className="status-chip chip-late" style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 50, background: 'rgba(255, 183, 3, 0.12)', color: 'var(--primary)', border: '1px solid rgba(255, 183, 3, 0.25)', display: 'inline-block', textTransform: 'uppercase' }}>{user.position}</span>
              <span className="status-chip chip-ok" style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 50, background: 'rgba(59, 130, 246, 0.12)', color: 'var(--info)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'inline-block', textTransform: 'uppercase' }}>{user.division || 'UMUM'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="content pb-nav">
      <div className="date-bar">
        <div className="date-info">
          <div className="day">{getDayName()}</div>
          <div className="date-full">{clockDate}</div>
        </div>
        <div className="live-clock">{clockTime}</div>
      </div>

      {/* Holiday / Leave Alert Banner */}
      {(todayHoliday || todayLeave) && (
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 'var(--radius-md)', background: todayHoliday ? 'rgba(255, 183, 3, 0.1)' : 'rgba(59, 130, 246, 0.1)', border: `1px solid ${todayHoliday ? 'rgba(255, 183, 3, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className={`bi ${todayHoliday ? 'bi-calendar-heart' : 'bi-emoji-sunglasses'}`} style={{ fontSize: 22, color: todayHoliday ? 'var(--primary)' : 'var(--info)' }}></i>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{todayHoliday ? '🎉 Hari Libur' : '🌴 Anda Sedang Cuti'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{todayHoliday || todayLeave}</div>
          </div>
        </div>
      )}

      <div className="section-label">Ringkasan Bulan Ini</div>
      <div className="stats-grid-wrapper stagger fade-in">
        <div className="stat-card-emp">
          <div className="stat-val val-green">{stats.hadir}</div>
          <div className="stat-lbl">Hadir</div>
        </div>
        <div className="stat-card-emp">
          <div className="stat-val val-dark">{stats.terlambat}</div>
          <div className="stat-lbl">Terlambat</div>
        </div>
        <div className="stat-card-emp">
          <div className="stat-val val-orange">{stats.cuti}</div>
          <div className="stat-lbl">Sisa Cuti</div>
        </div>
        <div className="stat-card-emp radial-stat">
          <div className="radial-chart-container">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="9" fill="transparent" className="radial-bg-ring" />
              <circle cx="50" cy="50" r="40" stroke="var(--success)" strokeWidth="9" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * stats.rate / 100)} style={{ strokeLinecap: 'round', transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </svg>
            <div className="radial-chart-text">
              <span>{stats.rate}%</span>
              <span className="radial-chart-lbl">On-Time</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-label">Kehadiran Hari Ini</div>
      <div className="today-card fade-in">
        <div className="today-header"><i className="bi bi-clock-history"></i> &nbsp;Log Absensi</div>
        <div className="time-row">
          <div className="time-item">
            <div className="time-lbl">Masuk</div>
            <div className={`time-val ${!todayLog.clockIn ? 'empty' : ''}`}>{todayLog.clockIn || '--:--'}</div>
            <div>
              {todayLog.clockIn ? (
                 <span className={`status-chip ${todayLog.statusIn === 'Terlambat' ? 'chip-warn' : 'chip-ok'}`}>{todayLog.statusIn || 'Tepat Waktu'}</span>
              ) : (
                <span className="status-chip chip-empty" onClick={() => navigate('/employee/attendance')} style={{ cursor: 'pointer' }}>Belum absen</span>
              )}
            </div>
          </div>
          <div className="time-divider"></div>
          <div className="time-item">
            <div className="time-lbl">Pulang</div>
            <div className={`time-val ${!todayLog.clockOut ? 'empty' : ''}`}>{todayLog.clockOut || '--:--'}</div>
            <div>
               {todayLog.statusOut ? (
                 <span className={`status-chip chip-ok`}>{todayLog.statusOut}</span>
              ) : (
                <span className="status-chip chip-empty">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="section-label">Menu Utama</div>
      <div className="menu-grid stagger fade-in">
        <NavLink to="/employee/attendance" className="menu-card" style={{ textDecoration: 'none' }}>
          <div className="menu-icon icon-yellow"><i className="bi bi-person-check-fill"></i></div>
          <h4>Absensi</h4>
          <p>Clock In &amp; Clock Out harian</p>
        </NavLink>
        <NavLink to="/employee/leave" className="menu-card" style={{ textDecoration: 'none' }}>
          <div className="menu-icon icon-success"><i className="bi bi-calendar-check-fill"></i></div>
          <h4>Pengajuan</h4>
          <p>Cuti, Sakit &amp; Izin</p>
        </NavLink>
        <NavLink to="/employee/history" className="menu-card" style={{ textDecoration: 'none' }}>
          <div className="menu-icon icon-blue"><i className="bi bi-clock-fill"></i></div>
          <h4>Riwayat</h4>
          <p>Histori kehadiran Anda</p>
        </NavLink>
        <NavLink to="/employee/leave?tab=history" className="menu-card" style={{ textDecoration: 'none' }}>
          <div className="menu-icon icon-danger"><i className="bi bi-folder-fill"></i></div>
          <h4>Status Ajuan</h4>
          <p>Tracking pengajuan</p>
        </NavLink>
      </div>

      <div className="section-label">Aktivitas Terakhir</div>
      <div className="activity-list">
        {activities.length > 0 ? activities.map((act, i) => (
          <div className="activity-item" key={i}>
            <div className={`act-dot ${act.type === 'in' ? 'act-dot-green' : act.type === 'out' ? 'act-dot-blue' : 'act-dot-yellow'}`}>
              <i className={`bi ${act.type === 'in' ? 'bi-box-arrow-in-right' : act.type === 'out' ? 'bi-box-arrow-right' : 'bi-info-circle'}`}></i>
            </div>
            <div className="act-content">
              <strong>{act.title}</strong>
              <span>{act.time}</span>
            </div>
          </div>
        )) : (
          <div className="activity-item">
             <div className="act-dot act-dot-yellow"><i className="bi bi-info-circle"></i></div>
             <div className="act-content">
                <strong>Belum ada aktivitas</strong>
                <span>Aktivitas hari ini akan muncul di sini</span>
             </div>
          </div>
        )}
      </div>
      </div>
      {editModalOpen && (
        <div className="overlay reg-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="reg-modal-container">
            <div className="reg-modal-card border-animated-modal" style={{ maxWidth: 400, width: '100%' }}>
              <div className="card-border-glow"></div>
              <button className="reg-modal-close" onClick={() => setEditModalOpen(false)} type="button">&times;</button>

              <div className="form-header" style={{ marginBottom: 24, textAlign: 'left', position: 'relative', zIndex: 2 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)', margin: 0 }}>
                  Edit Karyawan
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 2 }}>
                <div className="reg-avatar-upload-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer', marginBottom: 8 }}>
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <div className="reg-avatar-preview" style={{ width: 84, height: 84, borderRadius: '50%', border: '2px solid var(--primary)', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-deep)', transition: 'all var(--transition)', boxShadow: 'var(--shadow-neu-inset)' }}>
                      {editPhotoPreview ? (
                        <img src={editPhotoPreview} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Preview" />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, color: 'var(--primary)' }}>
                          {user.initial || 'U'}
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: 20, right: -4, background: 'var(--primary)', color: '#000', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-modal)' }}>
                       <i className="bi bi-camera-fill" style={{ fontSize: 12 }}></i>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>Klik ikon kamera untuk ganti foto</span>
                    <input type="file" hidden accept="image/*" onChange={handleEditPhotoChange} />
                  </label>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>NAMA LENGKAP</label>
                  <div className="input-wrap no-icon">
                    <input type="text" required value={user.name || ''} readOnly disabled style={{ color: 'var(--text-muted) !important' }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Nama hanya dapat diubah oleh administrator</span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>PIN / PASSWORD</label>
                  <div className="input-wrap no-icon">
                    <input type={editPinVis ? 'text' : 'password'} required value={editPin} onChange={e => setEditPin(e.target.value)} placeholder="Masukkan 6 digit PIN baru" maxLength={6} pattern="[0-9]*" inputMode="numeric" />
                    <button type="button" onClick={() => setEditPinVis(!editPinVis)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>
                      <i className={`bi ${editPinVis ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)}>Batal</button>
                  <button type="button" className="btn btn-primary" onClick={() => {
                    // Mock saving
                    setEditModalOpen(false);
                    alert("Profil berhasil diperbarui!");
                  }} style={{ padding: '8px 24px', borderRadius: 50, fontWeight: 700 }}>Simpan</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Beranda;
