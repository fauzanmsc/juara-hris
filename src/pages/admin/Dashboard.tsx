import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../api';

// Assuming Chart.js is loaded globally via index.html or we can rely on window.Chart
declare global {
  interface Window {
    Chart: any;
  }
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    hadir: 0,
    terlambat: 0,
    cuti: 0,
    absen: 0
  });

  const [user, setUser] = useState<any>({});
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [belumAbsen, setBelumAbsen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState('monthly');

  const dashChartRef = useRef<HTMLCanvasElement>(null);
  const lateChartRef = useRef<HTMLCanvasElement>(null);
  const dashPieInstance = useRef<any>(null);
  const lateChartInstance = useRef<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('hris_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    fetchAndRenderLateChart();
  }, [chartRange]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('hris_user');
      const currentUser = userStr ? JSON.parse(userStr) : {};
      const res = await fetchApi('adminDashboard', { user_id: currentUser.user_id }, 'GET');
      
      if (res.success) {
        setStats({
          hadir: res.stats?.hadir || 0,
          terlambat: res.stats?.terlambat || 0,
          cuti: res.stats?.cuti || 0,
          absen: res.stats?.absen || 0
        });
        setLiveLogs(res.live_log || []);
        setBelumAbsen(res.belum_absen_users || []);
        renderPieChart(res.stats);
        renderLineChart(res.stats?.trend_labels || [], res.stats?.trend_tepat || [], res.stats?.trend_terlambat || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndRenderLateChart = async () => {
    // Trend chart is now fetched as part of adminDashboard stats in legacy
  };

  const renderPieChart = (st: any) => {
    if (!dashChartRef.current || !window.Chart) return;
    const ctx = dashChartRef.current.getContext('2d');
    if (!ctx) return;

    if (dashPieInstance.current) {
      dashPieInstance.current.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#FFFFFF' : '#1E293B';
    const chartBorderColor = isDark ? '#13192E' : '#FFFFFF';

    dashPieInstance.current = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Hadir', 'Terlambat', 'Cuti/Izin', 'Belum Absen'],
        datasets: [{
          data: [st?.hadir || 0, st?.terlambat || 0, st?.cuti || 0, st?.absen || 0],
          backgroundColor: [
            'rgba(34, 197, 94, 0.85)',
            'rgba(239, 68, 68, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(148, 163, 184, 0.75)'
          ],
          borderColor: chartBorderColor,
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, padding: 16, usePointStyle: true, pointStyle: 'circle' } }
        },
        cutout: '72%'
      }
    });
  };

  const renderLineChart = (labels: any[], tepat: any[], terlambat: any[]) => {
    if (!lateChartRef.current || !window.Chart) return;
    const ctx = lateChartRef.current.getContext('2d');
    if (!ctx) return;

    if (lateChartInstance.current) {
      lateChartInstance.current.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#FFFFFF' : '#1E293B';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    const gradientGreen = ctx.createLinearGradient(0, 0, 0, 260);
    gradientGreen.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
    gradientGreen.addColorStop(1, 'rgba(34, 197, 94, 0.01)');

    const gradientRed = ctx.createLinearGradient(0, 0, 0, 260);
    gradientRed.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
    gradientRed.addColorStop(1, 'rgba(239, 68, 68, 0.01)');

    lateChartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tepat Waktu',
            data: tepat,
            borderColor: '#22C55E',
            backgroundColor: gradientGreen,
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Terlambat',
            data: terlambat,
            borderColor: '#EF4444',
            backgroundColor: gradientRed,
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { color: textColor, padding: 16, usePointStyle: true, pointStyle: 'circle' } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 5 }, beginAtZero: true }
        }
      }
    });
  };

  return (
    <div className="fade-in">
      <div className="hris-landing-hero fade-in">
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: 'var(--text)', lineHeight: 1.2, marginBottom: 8 }}>
          Selamat Datang, <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 22 }}>{user.name || 'Admin HC'} 👋</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.4, marginTop: 6 }}>
          Kelola karyawan, absensi, cuti, dan laporan administrasi HC secara efektif &amp; efisien.
        </p>
      </div>

      <div className="grid-4 stagger">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-value">{stats.hadir}</div>
              <div className="stat-label">Hadir Hari Ini</div>
            </div>
            <div className="stat-icon stat-icon-success"><i className="bi bi-person-check-fill"></i></div>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-value text-warn">{stats.terlambat}</div>
              <div className="stat-label">Terlambat</div>
            </div>
            <div className="stat-icon stat-icon-warn"><i className="bi bi-clock-fill"></i></div>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-value text-primary">{stats.cuti}</div>
              <div className="stat-label">Cuti / Izin</div>
            </div>
            <div className="stat-icon stat-icon-primary"><i className="bi bi-calendar-check-fill"></i></div>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-value text-danger">{stats.absen}</div>
              <div className="stat-label">Belum Absen</div>
            </div>
            <div className="stat-icon stat-icon-danger"><i className="bi bi-person-x-fill"></i></div>
          </div>
        </div>
      </div>

      {/* LIVE FEED ATTENDANCE */}
      <section className="card attendance-live-feed fade-in" aria-labelledby="attendanceLiveFeedTitle" style={{ marginTop: 12, marginBottom: 12 }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="section-title" id="attendanceLiveFeedTitle" style={{ margin: 0, fontSize: 16 }}>
              <i className="bi bi-camera-fill text-primary" style={{ marginRight: 8 }}></i>Live Feed Attendance
            </h3>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={loadDashboard} title="Refresh live feed" aria-label="Refresh live feed">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
        <div className={`live-feed-grid ${liveLogs.filter(l => l.photo_url || l.photo_in_url || l.photo_in).length > 4 ? 'has-scroll' : ''} ${liveLogs.filter(l => l.photo_url || l.photo_in_url || l.photo_in).length === 0 ? 'is-empty' : ''}`} style={{ marginTop: 16 }}>
          {liveLogs.filter(l => l.photo_url || l.photo_in_url || l.photo_in).length === 0 ? (
            <div className="live-feed-empty" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed var(--border)' }}>Belum ada foto absensi terbaru</div>
          ) : (
            liveLogs.filter(l => l.photo_url || l.photo_in_url || l.photo_in).map((log, i) => {
              const photo = log.photo_url || log.photo_in_url || log.photo_in;
              const status = log.status_in || 'Belum Absen';
              let badgeClass = 'is-on-time';
              if (status === 'Terlambat') badgeClass = 'is-late';
              else if (status === 'Absen') badgeClass = 'is-danger';
              else if (status !== 'Tepat Waktu' && status !== 'Belum Absen') badgeClass = 'is-primary';
              
              return (
                <button key={i} type="button" className="live-feed-card" onClick={() => window.open(photo, '_blank')} aria-label={`Preview foto absensi ${log.name}`}>
                  <img src={photo} alt={`Foto absensi ${log.name}`} loading="lazy" decoding="async" onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                  <div className="live-feed-overlay">
                    <span className="live-feed-name">{log.name}</span>
                    <span className={`live-feed-badge ${badgeClass}`}>{status}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* LATE EMPLOYEES STATISTIC CHART */}
      <section className="card fade-in" style={{ marginTop: 12, marginBottom: 24 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h3 className="card-title"><i className="bi bi-graph-up-arrow text-primary" style={{ marginRight: 8 }}></i>Statistik Kehadiran</h3>
            <p className="card-subtitle">Tren tepat waktu vs keterlambatan karyawan</p>
          </div>
          <select className="form-control" value={chartRange} onChange={e => setChartRange(e.target.value)} style={{ width: 'auto', minWidth: 130, cursor: 'pointer', borderRadius: 50, padding: '8px 16px' }}>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
        </div>
        <div style={{ position: 'relative', height: 260, width: '100%', marginTop: 16 }}>
          <canvas ref={lateChartRef}></canvas>
        </div>
      </section>

      <div className="dashboard-layout-grid fade-in">
        <div className="card p-0" style={{ margin: 0 }}>
          <div className="card-header">
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <h3 className="card-title"><i className="bi bi-activity text-primary" style={{ marginRight: 8 }}></i>Live Log Absensi</h3>
              <p className="card-subtitle">Aktivitas kehadiran hari ini</p>
            </div>
            <button className="btn btn-sm btn-primary" onClick={loadDashboard}><i className="bi bi-arrow-clockwise"></i> Refresh</button>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, marginTop: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Masuk</th>
                  <th>Pulang</th>
                  <th>Jarak</th>
                  <th>Status</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30 }}>Memuat data...</td></tr>
                ) : liveLogs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ada log absensi hari ini</td></tr>
                ) : (
                  liveLogs.map((log, i) => (
                    <tr key={i}>
                      <td>
                        <div className="user-cell">
                          <img src={log.profile_pic_url || '/img/profile.png'} alt="P" className="avatar avatar-sm" style={{ objectFit: 'cover' }} />
                          <div className="user-cell-info">
                            <span className="user-cell-name">{log.name}</span>
                            <span className="user-cell-role">{log.position}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.clock_in}</td>
                      <td style={{ fontWeight: 600 }}>{log.clock_out || '-'}</td>
                      <td>{log.distance ? `${log.distance}m` : '-'}</td>
                      <td>
                        <span className={`status-chip ${log.status_in === 'Terlambat' ? 'chip-warn' : 'chip-ok'}`}>{log.status_in}</span>
                      </td>
                      <td>
                        {log.photo_url && <a href={log.photo_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost"><i className="bi bi-camera"></i></a>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ margin: 0, padding: 20 }}>
            <h3 className="card-title"><i className="bi bi-pie-chart-fill text-primary" style={{ marginRight: 8 }}></i>Statistik Kehadiran</h3>
            <div style={{ height: 200, width: '100%', marginTop: 16, position: 'relative' }}>
              <canvas ref={dashChartRef}></canvas>
            </div>
          </div>

          <div className="card p-0" style={{ margin: 0 }}>
            <div style={{ padding: 20 }}>
              <h3 className="card-title text-danger"><i className="bi bi-person-x-fill" style={{ marginRight: 8 }}></i>Belum Absen</h3>
              <p className="card-subtitle">Karyawan belum Clock In hari ini</p>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, marginTop: 0, maxHeight: 250, overflowY: 'auto' }}>
              <table className="table-compact">
                <tbody>
                  {loading ? (
                    <tr><td style={{ textAlign: 'center', padding: 20 }}>Memuat...</td></tr>
                  ) : belumAbsen.length === 0 ? (
                    <tr><td style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Semua sudah absen</td></tr>
                  ) : (
                    belumAbsen.map((u, i) => (
                      <tr key={i}>
                        <td>
                          <div className="user-cell" style={{ justifyContent: 'flex-start' }}>
                            <img src={u.profile_pic_url || '/img/profile.png'} className="avatar avatar-sm" style={{ objectFit: 'cover' }} />
                            <div className="user-cell-info" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                              <span className="user-cell-name">{u.name}</span>
                              <span className="user-cell-role">{u.position}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
