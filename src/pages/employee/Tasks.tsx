import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useOutletContext } from 'react-router-dom';
import { fetchApi } from '../../api';
import './Tasks.css';

const Tasks = () => {
  const { toggleTheme, handleLogout, theme } = useOutletContext<any>();
  const [tab, setTab] = useState<'form' | 'history'>('form');

  // Form State
  const [taskName, setTaskName] = useState('');
  const [taskTarget, setTaskTarget] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(false);
  const [notes, setNotes] = useState('');
  const [others, setOthers] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  // History State
  const [activeDate, setActiveDate] = useState(new Date().toISOString().substring(0, 10));
  const [statusFilter, setStatusFilter] = useState('all');
  const [tasks, setTasks] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals
  // Modals
  const [viewTask, setViewTask] = useState<any | null>(null);

  const loadMyTasks = async () => {
    setHistoryLoading(true);
    try {
      const userStr = localStorage.getItem('hris_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const res = await fetchApi('getTasks', {
        user_id: user.user_id,
        start_date: activeDate,
        end_date: activeDate
      }, 'GET');

      if (res.success && res.tasks) {
        setTasks(res.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'history') {
      loadMyTasks();
    }
  }, [tab, activeDate]);

  const getBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userStr = localStorage.getItem('hris_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      let attachment_base64 = '';
      let attachment_filename = '';

      if (file) {
        attachment_filename = file.name;
        attachment_base64 = (await getBase64(file)).split(',')[1];
      }

      const payload = {
        user_id: user.user_id,
        date: activeDate,
        task_name: taskName,
        target_goals: taskTarget,
        start_time: startTime,
        end_time: endTime,
        output: output,
        status: status ? 'Completed' : 'Pending',
        notes,
        others,
        category: 'Other',
        attachment_base64,
        attachment_filename
      };

      const res = await fetchApi('createTask', payload);
      if (res.success) {
        alert('Laporan tugas berhasil disimpan!');
        setTaskName('');
        setTaskTarget('');
        setStartTime('');
        setEndTime('');
        setOutput('');
        setStatus(false);
        setNotes('');
        setOthers('');
        setFile(null);
        setTab('history');
      } else {
        alert(res.message || 'Gagal menyimpan tugas');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };


  const shiftDate = (days: number) => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + days);
    setActiveDate(d.toISOString().substring(0, 10));
  };

  const filteredTasks = tasks.filter(t => statusFilter === 'all' || t.status === statusFilter);
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const percent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NavLink to="/employee/beranda" className="back-btn"><i className="bi bi-arrow-left"></i></NavLink>
          <div className="header-info">
            <h2>Tugas Daily</h2>
            <p>Productivity Monitoring</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 16, transition: 'all var(--transition)', cursor: 'pointer' }}>
            <i className={theme === 'dark' ? "bi bi-brightness-high-fill" : "bi bi-moon-stars-fill"}></i>
          </button>
          <button className="btn-logout" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Keluar</button>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab-item ${tab === 'form' ? 'active' : ''}`} onClick={() => setTab('form')}>Lapor Tugas</div>
        <div className={`tab-item ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Daftar Tugas</div>
      </div>

      <div style={{ padding: '24px 24px 100px 24px' }}>
        {tab === 'form' && (
          <div className="card fade-in" style={{ marginTop: 20 }}>
            <form onSubmit={submitTask}>
              <div className="form-group">
                <label className="form-label">Nama / Judul Tugas*</label>
                <input type="text" className="form-control" required value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Contoh: Menyusun Laporan" />
              </div>
              <div className="form-group">
                <label className="form-label">Target / Goals*</label>
                <input type="text" className="form-control" required value={taskTarget} onChange={e => setTaskTarget(e.target.value)} placeholder="Contoh: 100% selesai" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mulai Jam*</label>
                  <input type="time" className="form-control" required value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Selesai Jam*</label>
                  <input type="time" className="form-control" required value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Output Yang Dihasilkan*</label>
                <input type="text" className="form-control" required value={output} onChange={e => setOutput(e.target.value)} placeholder="Contoh: File Excel Laporan.xlsx" />
              </div>
              <div className="form-group">
                <label className="form-label">Status Tugas*</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: !status ? 'var(--primary)' : 'var(--text-muted)' }}>BELUM</span>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 48, height: 24 }}>
                    <input type="checkbox" checked={status} onChange={e => setStatus(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: status ? 'var(--success)' : 'rgba(255,255,255,0.1)', borderRadius: 34, border: '1px solid var(--border)', transition: '0.4s' }}>
                      <span style={{ position: 'absolute', height: 16, width: 16, left: 3, bottom: 3, background: 'white', borderRadius: '50%', transition: '0.4s', transform: status ? 'translateX(24px)' : 'none' }}></span>
                    </span>
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: status ? 'var(--success)' : 'var(--text-muted)' }}>SELESAI</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Catatan / Issue (Opsional)</label>
                <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Hambatan pekerjaan jika ada..."></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Dokumen Pendukung (Opsional)</label>
                <input type="file" className="form-control" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }} disabled={loading}>
                <i className="bi bi-send-fill"></i> {loading ? 'Mengirim...' : 'Kirim Laporan Tugas'}
              </button>
            </form>
          </div>
        )}

        {tab === 'history' && (
          <div className="fade-in">
            <div className="stat-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(255, 183, 3, 0.1), rgba(255, 146, 0, 0.05))', border: '1px solid rgba(255, 183, 3, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Insight Hari Ini</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0 0' }}>{completedCount} / {tasks.length} Tugas Selesai</h3>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255, 183, 3, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-pie-chart-fill"></i>
                </div>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--success))', transition: 'width 0.6s' }}></div>
              </div>
            </div>

            <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => shiftDate(-1)}><i className="bi bi-chevron-left"></i></button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tanggal Tugas</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{activeDate}</div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => shiftDate(1)}><i className="bi bi-chevron-right"></i></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <input type="date" className="form-control" value={activeDate} onChange={e => setActiveDate(e.target.value)} />
                <button className="btn btn-primary btn-sm" onClick={loadMyTasks}><i className="bi bi-arrow-clockwise"></i> Load</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter('all')} style={{ flex: 1 }}>Semua</button>
              <button className={`btn btn-sm ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter('Pending')} style={{ flex: 1 }}>Belum</button>
              <button className={`btn btn-sm ${statusFilter === 'Completed' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter('Completed')} style={{ flex: 1 }}>Selesai</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Memuat tugas...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 45, color: 'var(--text-muted)' }}>Tidak ada tugas</div>
              ) : (
                filteredTasks.map((t, i) => (
                  <div key={i} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className={`badge ${t.status === 'Completed' ? 'badge-success' : 'badge-warn'}`}>{t.status === 'Completed' ? 'Selesai' : 'Belum'}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}><i className="bi bi-clock-fill"></i> {t.start_time} - {t.end_time}</span>
                    </div>
                    <h4 style={{ margin: '8px 0', fontSize: 14 }}>{t.task_name}</h4>
                    <button className="btn btn-sm btn-ghost" onClick={() => setViewTask(t)} style={{ width: '100%' }}><i className="bi bi-eye"></i> Detail</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {viewTask && createPortal(
        <div className="reg-modal-overlay">
          <div className="reg-modal-container">
            <div className="reg-modal-card fade-in">
              <div className="reg-modal-header">
                <h3 className="reg-modal-title">Detail Tugas</h3>
                <button className="reg-modal-close" onClick={() => setViewTask(null)}><i className="bi bi-x"></i></button>
              </div>
              <div className="reg-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><strong>Judul:</strong> {viewTask.task_name}</div>
                <div><strong>Target:</strong> {viewTask.target_goals}</div>
                <div><strong>Output:</strong> {viewTask.output}</div>
                <div><strong>Status:</strong> {viewTask.status}</div>
                <div><strong>Waktu:</strong> {viewTask.start_time} - {viewTask.end_time}</div>
                {viewTask.notes && <div><strong>Catatan:</strong> {viewTask.notes}</div>}
                {viewTask.attachment_url && (
                  <a href={viewTask.attachment_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">Lihat Lampiran</a>
                )}
              </div>
              <div className="reg-modal-footer">
                <button className="btn btn-primary" onClick={() => setViewTask(null)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tasks;
