import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import logoWhite from '../../assets/juara-hris-logo-white.png';
import logoBlack from '../../assets/juara-hris-logo-black.png';

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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.profile_pic_url]);

  // Edit Profile States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPin, setEditPin] = useState('');
  const [editPinVis, setEditPinVis] = useState(false);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const handleEditProfileClick = () => {
    setEditPhotoPreview(user.profile_pic_url || null);
    setEditPhotoFile(null);
    setEditPin('');
    setEditPinVis(false);
    setEditModalOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setEditPhotoPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDayName = (dateVal?: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = dateVal ? new Date(dateVal) : new Date();
    return !isNaN(d.getTime()) ? days[d.getDay()] : 'Hari ini';
  };

  const getFormatDateStr = (dateVal?: string) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) return dateVal || '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  };

  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);

  const handleHardReset = () => {
    setShowRefreshConfirm(true);
  };

  const executeHardReset = () => {
    setShowRefreshConfirm(false);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          for (let registration of registrations) {
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
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userStr = localStorage.getItem('hris_user');
        if (!userStr) return;
        const u = JSON.parse(userStr);

        // STALE-WHILE-REVALIDATE: Load from cache first for instant UI
        const cachedStr = localStorage.getItem(`hris_dash_cache_${u.user_id}`);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            if (cached.stats) setStats(cached.stats);
            if (cached.todayLog) setTodayLog(cached.todayLog);
            if (cached.todayHoliday) setTodayHoliday(cached.todayHoliday);
            if (cached.todayLeave) setTodayLeave(cached.todayLeave);
            if (cached.activities) setActivities(cached.activities);
            setLoading(false); // UI is ready immediately!
          } catch (e) {}
        }

        // Fetch both APIs concurrently
        const [dashRes, histRes] = await Promise.all([
          fetchApi('employeeDashboard', { user_id: u.user_id }, 'GET').catch(e => ({ success: false, error: e })),
          fetchApi('getAttendance', { user_id: u.user_id }, 'GET').catch(e => ({ success: false, error: e }))
        ]);

        if (dashRes.success) {
          const st = dashRes.stats || {};
          const hadir = st.hadir || 0;
          const terlambat = st.terlambat || 0;
          const rate = hadir > 0 ? Math.round(((hadir - terlambat) / hadir) * 100) : 100;
          
          const newStats = { hadir, terlambat, cuti: st.sisa_cuti || 0, rate };
          const newTodayLog = {
            clockIn: dashRes.today_in || '',
            clockOut: dashRes.today_out || '',
            statusIn: dashRes.status_in || '',
            statusOut: dashRes.status_out || '',
          };
          const newHoliday = dashRes.today_holiday || null;
          const newLeave = dashRes.today_leave || null;

          setStats(newStats);
          setTodayLog(newTodayLog);
          setTodayHoliday(newHoliday);
          setTodayLeave(newLeave);

          let mappedActivities: any[] = [];
          if (histRes.success && histRes.data && histRes.data.length > 0) {
            mappedActivities = histRes.data.slice(0, 5).map((r: any) => {
              const hasOut = !!r.clock_out_time;
              const inTime = r.clock_in_time ? String(r.clock_in_time).substring(0, 5) : '--:--';
              const outTime = hasOut ? String(r.clock_out_time).substring(0, 5) : '--:--';
              return {
                date: r.date,
                title: hasOut ? 'Clock In & Out' : (r.clock_in_time ? 'Clock In' : 'Belum Absen'),
                time: r.clock_in_time ? `${inTime} - ${outTime}` : 'Tidak Hadir',
                type: hasOut ? 'out' : (r.clock_in_time ? 'in' : 'other')
              };
            });
          } else {
            mappedActivities = (dashRes.activities || []).map((a: any) => ({
              ...a,
              type: a.title === 'Clock In' ? 'in' : a.title === 'Clock In & Out' ? 'out' : 'other'
            }));
          }
          setActivities(mappedActivities);

          // Save to cache
          localStorage.setItem(`hris_dash_cache_${u.user_id}`, JSON.stringify({
            stats: newStats,
            todayLog: newTodayLog,
            todayHoliday: newHoliday,
            todayLeave: newLeave,
            activities: mappedActivities
          }));
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

  return (
    <>
      <div className="header" style={{ borderBottom: 'none', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-surface)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, boxShadow: '0px 8px 20px 0px rgb(2 2 2 / 14%)', marginBottom: 24 }}>
        <div className="header-top">
          <div className="brand-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Juara HRIS" style={{ height: 38, objectFit: 'contain' }} />
            <span className="live-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ADE80', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 50, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, background: '#4ADE80', borderRadius: '50%' }}></div> LIVE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button className="theme-toggle-btn" onClick={handleHardReset} title="Bersihkan Cache & Refresh"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-neu)' }}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-neu)' }}>
              <i className={theme === 'dark' ? "bi bi-moon-fill" : "bi bi-brightness-high-fill"}></i>
            </button>
            <button onClick={handleLogout} style={{ width: 32, height: 32, borderRadius: '50%', background: '#EF4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="profile-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar-container" style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #F59E0B', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
              {user.profile_pic_url && !imgError ? (
                <img src={user.profile_pic_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgError(true)} />
              ) : (
                <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{user.initial || user.name.charAt(0)}</span>
              )}
            </div>
            <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{user.name}</h3>
                <i className="bi bi-patch-check-fill" style={{ color: '#F59E0B', fontSize: 16 }}></i>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 50, background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', color: '#111' }}>{user.position || 'Head Manager'}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 50, background: '#222', color: '#FFF' }}>{user.division || 'Manajemen'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)' }}>
              <i className="bi bi-chat-text-fill"></i>
            </button>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: 'none', position: 'relative', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)' }}>
              <i className="bi bi-bell-fill"></i>
              {notifs.length > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, background: '#EF4444', color: 'white', fontSize: 9, fontWeight: 800, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #D97706' }}>
                  {notifs.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setNotifOpen(false)}></div>
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
      </div>
      <div className="red-hero-wrapper" style={{ position: 'relative', paddingBottom: 24 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150%', height: '100%', background: 'radial-gradient(circle, rgba(217, 119, 6, 0.15) 0%, rgba(30, 30, 30, 0) 65%)', zIndex: 0, pointerEvents: 'none' }}></div>
        {loading ? (
          <div style={{ padding: '0 24px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '20vh', gap: 20 }}>
              <div style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Memuat Dashboard...</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 24px', position: 'relative', zIndex: 10 }}>
            {/* Unified Golden Card */}
            <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', marginBottom: 24 }}>
              {/* Top part: Masuk / Pulang */}
              <div className="golden-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>Masuk</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 900, color: '#111', letterSpacing: '-2px', marginBottom: 12 }}>
                      {todayLog.clockIn || '--:--'}
                    </div>
                    {todayLog.clockIn ? (
                      <div style={{ background: todayLog.statusIn === 'Terlambat' ? '#EF4444' : '#22C55E', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>{todayLog.statusIn || 'Tepat Waktu'}</div>
                    ) : (
                      <div style={{ background: '#EF4444', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>Terlambat</div>
                    )}
                  </div>
                  <div style={{ width: 1, height: 80, background: 'rgba(0,0,0,0.1)' }}></div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>Pulang</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 900, color: '#111', letterSpacing: '-2px', marginBottom: 12 }}>
                      {todayLog.clockOut || '--:--'}
                    </div>
                    {todayLog.clockOut ? (
                      <div style={{ background: '#22C55E', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>{todayLog.statusOut || 'Tepat Waktu'}</div>
                    ) : (
                      <div style={{ background: '#22C55E', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>Tepat Waktu</div>
                    )}
                  </div>
                </div>
              </div>
              {/* Bottom part: Date & Live Clock */}
              <div style={{ background: '#2A2A2A', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', lineHeight: 1.2 }}>{getDayName()}</div>
                  <div style={{ fontSize: 13, color: '#FFF', opacity: 0.9 }}>{clockDate}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', color: '#111', padding: '8px 20px', borderRadius: 50, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>
                  <i className="bi bi-clock"></i> {clockTime.replace(/:/g, '.')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 100px 24px', position: 'relative' }}>
        <div className="red-bg-bottom"></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          {loading ? null : (
            <>
              {/* Ringkasan Bulan Ini */}
              <div className="section-label" style={{ color: '#D97706', fontSize: 16, textTransform: 'none', marginBottom: 16, fontWeight: 800 }}>Ringkasan Bulan Ini</div>
              <div className="ringkasan-wrapper" style={{ display: 'flex', marginBottom: 32 }}>
                {/* Radial Chart */}
                <div className="golden-card ringkasan-chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', borderRadius: 24, padding: 16 }}>
                  <div className="radial-chart-container">
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', display: 'block' }}>
                      <circle cx="50" cy="50" r="44" stroke="rgba(0,0,0,0.2)" strokeWidth="12" fill="#31220a" />
                      <circle cx="50" cy="50" r="44" stroke="#22C55E" strokeWidth="12" fill="transparent" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * stats.rate / 100)} style={{ strokeLinecap: 'round', transition: 'stroke-dashoffset 1s ease-out' }} />
                    </svg>
                    <div className="radial-chart-text">
                      <span className="radial-chart-val">{stats.rate}%</span>
                      <span className="radial-chart-label">ON-TIME</span>
                    </div>
                  </div>
                </div>

                {/* Pills */}
                <div className="ringkasan-grid-pills" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="mini-stat-pill">
                    <div className="mini-stat-val" style={{ background: '#22C55E' }}>{stats.hadir}</div>
                    <span style={{ fontWeight: 600 }}>Hadir</span>
                  </div>
                  <div className="mini-stat-pill">
                    <div className="mini-stat-val" style={{ background: '#EF4444' }}>{stats.gakHadir || 3}</div>
                    <span style={{ fontWeight: 600 }}>Gak Hadir</span>
                  </div>
                  <div className="mini-stat-pill">
                    <div className="mini-stat-val" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }}>{stats.terlambat}</div>
                    <span style={{ fontWeight: 600 }}>Terlambat</span>
                  </div>
                  <div className="mini-stat-pill">
                    <div className="mini-stat-val" style={{ background: '#3B82F6' }}>{stats.cuti}</div>
                    <span style={{ fontWeight: 600 }}>Sisa Cuti</span>
                  </div>
                </div>
              </div>

              {/* Menu Utama */}
              <div className="section-label" style={{ color: '#D97706', fontSize: 16, textTransform: 'none', marginBottom: 16, fontWeight: 800 }}>Menu Utama</div>
              <div className="menu-grid stagger fade-in" style={{ gap: 12, marginBottom: 32 }}>
                <NavLink to="/employee/attendance" className="golden-menu-card">
                  <div className="golden-menu-icon"><i className="bi bi-fingerprint"></i></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#FFF' }}>Absensi</h4>
                    <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>Clock In &amp; Clock Out harian</p>
                  </div>
                </NavLink>
                <NavLink to="/employee/leave" className="golden-menu-card">
                  <div className="golden-menu-icon"><i className="bi bi-calendar-check-fill"></i></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#FFF' }}>Pengajuan</h4>
                    <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>Cuti, Sakit &amp; Izin</p>
                  </div>
                </NavLink>
                <NavLink to="/employee/history" className="golden-menu-card">
                  <div className="golden-menu-icon"><i className="bi bi-clock-history"></i></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#FFF' }}>Riwayat</h4>
                    <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>Histori Kehadiran Anda</p>
                  </div>
                </NavLink>
                <NavLink to="/employee/tasks" className="golden-menu-card">
                  <div className="golden-menu-icon"><i className="bi bi-journal-text"></i></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#FFF' }}>Status Ajuan</h4>
                    <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>Tracking Pengajuan</p>
                  </div>
                </NavLink>
              </div>

              {/* Aktivitas Absensi */}
              <div className="section-label" style={{ color: '#D97706', fontSize: 16, textTransform: 'none', marginBottom: 16, fontWeight: 800 }}>Aktivitas Absensi Minggu Ini</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activities.length > 0 ? activities.map((act, i) => {
                  const dayName = getDayName(act.date);
                  const dateStr = getFormatDateStr(act.date);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                      <div style={{ width: 60, height: 60, borderRadius: 16, background: '#222', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginRight: 20, flexShrink: 0 }}>
                        <i className="bi bi-box-arrow-right"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, color: '#111', fontWeight: 600 }}>{dayName}</span>
                          <span style={{ fontSize: 12, color: '#111', fontWeight: 600 }}>{act.title}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{dateStr}</span>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#111' }}>{act.time || '09:00 AM - 05:00 PM'}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, color: '#FFF', marginBottom: 8 }}><i className="bi bi-info-circle"></i></div>
                    <strong style={{ fontSize: 14, color: '#FFF' }}>Belum ada aktivitas</strong>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Aktivitas absensi akan muncul di sini</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {editModalOpen && (
        <div className="overlay reg-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="reg-modal-container">
            <div className="reg-modal-card border-animated-modal" style={{ maxWidth: 400, width: '100%' }}>
              <div className="card-border-glow"></div>
              <button className="reg-modal-close" onClick={() => setEditModalOpen(false)} type="button"><i className="bi bi-x-lg"></i></button>

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
                  <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)} disabled={editSaving}>Batal</button>
                  <button type="button" className="btn btn-primary" disabled={editSaving} onClick={async () => {
                    setEditSaving(true);
                    try {
                      let base64Photo = undefined;
                      if (editPhotoFile) {
                        const reader = new FileReader();
                        base64Photo = await new Promise((resolve, reject) => {
                          reader.onload = (e) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              let width = img.width;
                              let height = img.height;
                              const max_size = 150;
                              if (width > height && width > max_size) { height *= max_size / width; width = max_size; }
                              else if (height > max_size) { width *= max_size / height; height = max_size; }
                              canvas.width = width; canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.7)); }
                              else resolve(e.target?.result as string);
                            };
                            img.onerror = () => reject(new Error('Gagal memuat gambar'));
                            img.src = e.target?.result as string;
                          };
                          reader.onerror = error => reject(error);
                          reader.readAsDataURL(editPhotoFile);
                        });
                      }

                      const payload: any = { user_id: user.user_id, name: user.name, email: user.email };
                      if (editPin) payload.password_pin = editPin;
                      if (base64Photo) payload.profile_pic_base64 = base64Photo;

                      const res = await fetchApi('updateUser', payload);
                      if (res.success) {
                        const loggedUser = localStorage.getItem('hris_user');
                        if (loggedUser) {
                          const parsed = JSON.parse(loggedUser);
                          if (editPin) parsed.password_pin = editPin;
                          if (res.profile_pic_url) parsed.profile_pic_url = res.profile_pic_url;
                          localStorage.setItem('hris_user', JSON.stringify(parsed));
                        }
                        setEditModalOpen(false);
                        alert("Profil berhasil diperbarui!");
                        setTimeout(() => window.location.reload(), 1500);
                      } else {
                        alert(res.message || 'Gagal menyimpan data');
                      }
                    } catch (err) {
                      alert('Terjadi kesalahan koneksi');
                    } finally {
                      setEditSaving(false);
                    }
                  }} style={{ padding: '8px 24px', borderRadius: 50, fontWeight: 700 }}>{editSaving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRefreshConfirm && (
        <div className="overlay reg-modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', padding: 20 }}>
          <div className="reg-modal-container scale-in" style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, maxWidth: 320, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setShowRefreshConfirm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-x-lg"></i>
            </button>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ef4444', fontSize: 24 }}>
              <i className="bi bi-arrow-clockwise"></i>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--text)', letterSpacing: '-0.3px' }}>Muat Ulang Aplikasi</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus cache dan memuat ulang aplikasi untuk mendapatkan versi terbaru?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={executeHardReset} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 16px rgba(239,68,68,0.2)', transition: 'all 0.2s' }}>Oke, Muat Ulang</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Beranda;
