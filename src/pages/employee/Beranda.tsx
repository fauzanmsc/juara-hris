import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import logoWhite from '../../assets/juara-hris-logo-white.png';
import logoBlack from '../../assets/juara-hris-logo-black.png';

const Beranda = () => {
  const navigate = useNavigate();
  const { toggleTheme, handleLogout, user, notifOpen, setNotifOpen, notifs, setNotifs, theme } = useOutletContext<any>();
  const [stats, setStats] = useState({ hadir: 0, terlambat: 0, cuti: 0, rate: 0 });
  const [todayLog, setTodayLog] = useState({ clockIn: '', clockOut: '', statusIn: '', statusOut: '' });
  const [activities, setActivities] = useState<any[]>([]);
  const [clockDate, setClockDate] = useState('');
  const [clockTime, setClockTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayHoliday, setTodayHoliday] = useState<string | null>(null);
  const [todayLeave, setTodayLeave] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

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
          } catch (e) { }
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
                type: hasOut ? 'out' : (r.clock_in_time ? 'in' : 'other'),
                photoIn: r.photo_in,
                photoOut: r.photo_out
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
      <style>
        {`
          .beranda-header {
            position: -webkit-sticky !important;
            position: sticky !important;
            top: -1px !important;
            border-bottom: none;
            padding: 16px 24px;
            z-index: 100;
            background: var(--bg-surface);
            border-bottom-left-radius: 24px;
            border-bottom-right-radius: 24px;
            box-shadow: 0px 8px 20px 0px rgb(2 2 2 / 14%);
            margin-bottom: 24px;
          }
          .brand-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-logo {
            height: 38px;
            object-fit: contain;
          }
          .live-badge {
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.4);
            color: #4ADE80;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .live-badge-dot {
            width: 6px;
            height: 6px;
            background: #4ADE80;
            border-radius: 50%;
          }
          .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
          }
          .icon-btn-rounded {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text);
            font-size: 14px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow-neu);
          }
          .logout-btn-rounded {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #EF4444;
            color: #FFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          .profile-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 24px;
          }
          .profile-row-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            flex: 1;
            margin-right: 12px;
          }
          .avatar-container {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid #F59E0B;
            overflow: hidden;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-deep);
            padding: 0;
          }
          .avatar-img {
            width: 100%;
            height: 100%;
            min-width: 100%;
            min-height: 100%;
            object-fit: cover;
            display: block;
          }
          .avatar-placeholder {
            color: #F59E0B;
            font-weight: 800;
            font-size: 24px;
            line-height: 1;
          }
          .profile-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-width: 0;
            flex: 1;
          }
          .profile-name-row {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
          }
          .profile-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: var(--text);
          }
          .profile-name-icon {
            color: #F59E0B;
            font-size: 16px;
            flex-shrink: 0;
          }
          .profile-badges {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 4px;
          }
          .profile-badge-item {
            white-space: nowrap;
          }
          .badge-position {
            font-size: 10px;
            font-weight: 800;
            padding: 4px 12px;
            border-radius: 50px;
            background: linear-gradient(135deg, #FDE68A 0%, #D97706 100%);
            color: #111;
          }
          .badge-division {
            font-size: 10px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 50px;
            background: #222;
            color: #FFF;
          }
          .profile-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
          }
          .notif-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FDE68A 0%, #D97706 100%);
            color: #FFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: none;
            position: relative;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
          }
          .notif-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            background: #EF4444;
            color: white;
            font-size: 9px;
            font-weight: 800;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #D97706;
          }
          @media (max-width: 375px) {
            .profile-name {
              font-size: 15px !important;
            }
            .profile-badges {
              gap: 4px !important;
            }
            .profile-badge-item {
              font-size: 9px !important;
              padding: 3px 8px !important;
            }
            .clock-label {
              font-size: 14px !important;
              margin-bottom: 4px !important;
            }
            .clock-time {
              font-size: 32px !important;
              margin-bottom: 8px !important;
            }
            .clock-status {
              font-size: 10px !important;
              padding: 4px 12px !important;
            }
          }
        `}
      </style>
      <div className="header beranda-header">
        <div className="header-top">
          <div className="brand-row">
            <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Juara HRIS" className="brand-logo" />
            <span className="live-badge">
              <div className="live-badge-dot"></div> LIVE
            </span>
          </div>
          <div className="header-actions">
            <button className="icon-btn-rounded" onClick={handleHardReset} title="Bersihkan Cache & Refresh">
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            <button className="icon-btn-rounded" onClick={toggleTheme} title="Ganti Mode">
              <i className={theme === 'dark' ? "bi bi-moon-fill" : "bi bi-brightness-high-fill"}></i>
            </button>
            <button onClick={handleLogout} className="logout-btn-rounded">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="profile-row">
          <div className="profile-row-left">
            <div className="avatar-container">
              {user.profile_pic_url && !imgError ? (
                <img src={user.profile_pic_url} alt="Profile" className="avatar-img" onError={() => setImgError(true)} />
              ) : (
                <span className="avatar-placeholder">{user.initial || user.name.charAt(0)}</span>
              )}
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <h3 className="profile-name">{user.name}</h3>
                <i className="bi bi-patch-check-fill profile-name-icon"></i>
              </div>
              <div className="profile-badges">
                <span className="profile-badge-item badge-position">{user.position || 'Head Manager'}</span>
                <span className="profile-badge-item badge-division">{user.division || 'Manajemen'}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button onClick={() => setNotifOpen(!notifOpen)} className="notif-btn">
              <i className="bi bi-bell-fill"></i>
              {notifs.length > 0 && (
                <span className="notif-badge">
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
          <div style={{ padding: '0 12px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '20vh', gap: 20 }}>
              <div style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Memuat Dashboard...</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 12px', position: 'relative', zIndex: 10 }}>
            {/* Unified Golden Card */}
            <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', marginBottom: 24 }}>
              {/* Top part: Masuk / Pulang */}
              <div className="golden-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div className="clock-label" style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>Masuk</div>
                    <div className="clock-time" style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 900, color: '#111', letterSpacing: '-2px', marginBottom: 12 }}>
                      {todayLog.clockIn || '--:--'}
                    </div>
                    {todayLog.clockIn ? (
                      <div className="clock-status" style={{ background: todayLog.statusIn === 'Terlambat' ? '#EF4444' : '#22C55E', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>{todayLog.statusIn || 'Tepat Waktu'}</div>
                    ) : (
                      <div className="clock-status" style={{ background: '#374151', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>Belum</div>
                    )}
                  </div>
                  <div style={{ width: 1, height: 80, background: 'rgba(0,0,0,0.1)' }}></div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div className="clock-label" style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>Pulang</div>
                    <div className="clock-time" style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 900, color: '#111', letterSpacing: '-2px', marginBottom: 12 }}>
                      {todayLog.clockOut || '--:--'}
                    </div>
                    {todayLog.clockOut ? (
                      <div className="clock-status" style={{ background: '#22C55E', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>{todayLog.statusOut || 'Tepat Waktu'}</div>
                    ) : (
                      <div className="clock-status" style={{ background: '#374151', color: '#FFF', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 50, display: 'inline-block' }}>Belum</div>
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
                <div className="main-clock-badge">
                  <i className="bi bi-clock"></i> {clockTime.replace(/:/g, '.')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="wrapper-app">
        <div className="red-bg-bottom"></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          {loading ? null : (
            <>
              {/* Ringkasan Bulan Ini */}
              <div className="section-label" style={{ color: '#D97706', fontSize: 16, textTransform: 'none', marginBottom: 16, fontWeight: 800 }}>Ringkasan Bulan Ini</div>
              <div className="ringkasan-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                {/* Radial Chart */}
                <div className="golden-card ringkasan-chart-card" style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', borderRadius: 24, padding: 24, boxShadow: '0 12px 24px rgba(217, 119, 6, 0.25)', position: 'relative', overflow: 'hidden' }}>
                  {/* Background flare */}
                  <div style={{ position: 'absolute', width: 250, height: 250, background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%)', top: -80, left: '50%', transform: 'translateX(-50%)' }}></div>
                  <div className="radial-chart-container" style={{ width: 140, height: 140, position: 'relative', zIndex: 1 }}>
                    <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>
                      <circle cx="70" cy="70" r="58" stroke="rgba(0,0,0,0.1)" strokeWidth="12" fill="rgba(255,255,255,0.15)" />
                      <circle cx="70" cy="70" r="58" stroke="#22C55E" strokeWidth="12" fill="transparent" strokeDasharray="364.42" strokeDashoffset={364.42 - (364.42 * stats.rate / 100)} style={{ strokeLinecap: 'round', transition: 'stroke-dashoffset 2s cubic-bezier(0.1, 0.7, 0.1, 1)' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 1s ease-out' }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: '#111', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{stats.rate}%</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(0,0,0,0.6)', letterSpacing: 1, marginTop: 4 }}>ON-TIME</span>
                    </div>
                  </div>
                </div>

                {/* Pills */}
                <div className="ringkasan-grid-pills" style={{ flex: '2 1 200px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  <div className="mini-stat-pill" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-neu)', transition: 'transform 0.2s' }}>
                    <div className="mini-stat-val" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{stats.hadir}</div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Hadir</span>
                  </div>
                  <div className="mini-stat-pill" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-neu)', transition: 'transform 0.2s' }}>
                    <div className="mini-stat-val" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{stats.gakHadir || 3}</div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Gak Hadir</span>
                  </div>
                  <div className="mini-stat-pill" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-neu)', transition: 'transform 0.2s' }}>
                    <div className="mini-stat-val" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{stats.terlambat}</div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Terlambat</span>
                  </div>
                  <div className="mini-stat-pill" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-neu)', transition: 'transform 0.2s' }}>
                    <div className="mini-stat-val" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{stats.cuti}</div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Sisa Cuti</span>
                  </div>
                </div>
              </div>

              {/* Menu Utama */}
              <div className="section-label" style={{ color: '#D97706', fontSize: 16, textTransform: 'none', marginBottom: 16, fontWeight: 800 }}>Menu Utama</div>
              <div className="menu-grid stagger fade-in" style={{ gap: 12, marginBottom: 32 }}>
                <NavLink to="/employee/attendance" className="golden-menu-card">
                  <div className="golden-menu-icon"><i className="bi bi-fingerprint"></i></div>
                  <div className="golden-menu-text">
                    <h4 className="text-menu-utama">Absensi</h4>
                    <p className="text-menu-utama-sub">Clock In &amp; Clock Out harian</p>
                  </div>
                </NavLink>
                <NavLink to="/employee/leave" className="golden-menu-card">
                  <div className="golden-menu-icon" ><i className="bi bi-calendar-check-fill"></i></div>
                  <div className="golden-menu-text">
                    <h4 className="text-menu-utama">Pengajuan</h4>
                    <p className="text-menu-utama-sub">Cuti, Sakit &amp; Izin</p>
                  </div>
                </NavLink>
                <NavLink to="/employee/history" className="golden-menu-card">
                  <div className="golden-menu-icon" ><i className="bi bi-clock-history"></i></div>
                  <div className="golden-menu-text">
                    <h4 className="text-menu-utama">Riwayat</h4>
                    <p className="text-menu-utama-sub">Histori Kehadiran</p>
                  </div>
                </NavLink>
                <NavLink to="/employee/tasks" className="golden-menu-card">
                  <div className="golden-menu-icon" ><i className="bi bi-journal-text"></i></div>
                  <div className="golden-menu-text">
                    <h4 className="text-menu-utama">Status Ajuan</h4>
                    <p className="text-menu-utama-sub">Detail Pengajuan</p>
                  </div>
                </NavLink>
              </div>

              {/* Aktivitas Absensi */}
              <div className="section-label" style={{ color: '#D97706', fontSize: 16, textTransform: 'none', marginBottom: 16, fontWeight: 800 }}>Aktivitas Absensi Minggu Ini</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activities.length > 0 ? activities.map((act, i) => {
                  const dayName = getDayName(act.date);
                  const dateStr = getFormatDateStr(act.date);
                  const displayPhoto = act.photoIn || act.photoOut;
                  return (
                    <div key={i} className="card-gradient">
                      <div onClick={() => displayPhoto && setPreviewPhoto(displayPhoto)} className="photo-box">
                        {displayPhoto ? (
                          <img src={displayPhoto} alt="Absensi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <i className="bi bi-box-arrow-right"></i>
                        )}
                      </div>
                      <div className="golden-menu-text">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                          <span style={{ fontSize: 13, color: '#111', fontWeight: 700 }}>{dayName}</span>
                          <span style={{ fontSize: 10, color: '#111', fontWeight: 800, padding: '3px 10px', background: 'rgba(255,255,255,0.35)', borderRadius: 50, whiteSpace: 'nowrap' }}>{act.title}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{dateStr}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#111', whiteSpace: 'nowrap' }}>{act.time || '09:00 AM - 05:00 PM'}</span>
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
                    <div className="reg-avatar-preview" style={{ width: 84, height: 84, borderRadius: '50%', border: '2px solid var(--primary)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-deep)', transition: 'all var(--transition)', boxShadow: 'var(--shadow-neu-inset)' }}>
                      {editPhotoPreview ? (
                        <img src={editPhotoPreview} style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} alt="Preview" />
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
      {previewPhoto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.2s ease-out' }} onClick={() => setPreviewPhoto(null)}>
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewPhoto(null)} style={{ position: 'absolute', top: -16, right: -16, width: 36, height: 36, borderRadius: '50%', background: '#EF4444', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', zIndex: 10 }}>
              <i className="bi bi-x-lg"></i>
            </button>
            <img src={previewPhoto} alt="Preview Absensi" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}
    </>
  );
};

export default Beranda;
