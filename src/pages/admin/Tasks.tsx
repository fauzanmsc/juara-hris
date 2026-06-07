import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);

  const [form, setForm] = useState({
    id: '', user_id: '', task_name: '', target: '', start_time: '', end_time: '',
    output: '', status: 'Pending', notes: '', others: '', category: 'Other',
    date: '', score: ''
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getTasks', {
        start_date: filterStart,
        end_date: filterEnd
      }, 'GET');
      if (res.success) {
        const taskList = res.data || res.tasks || [];
        setTasks(taskList);
        const completed = taskList.filter((t: any) => t.status === 'Completed').length;
        const pending = taskList.filter((t: any) => t.status !== 'Completed').length;
        const scores = taskList.filter((t: any) => t.score).map((t: any) => Number(t.score));
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
        setStats({ total: taskList.length, completed, pending, avgScore });
      }
      const usersRes = await fetchApi('getUsers', {}, 'GET');
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.filter((u: any) => u.status === 'Active'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({
      id: '', user_id: '', task_name: '', target: '', start_time: '', end_time: '',
      output: '', status: 'Pending', notes: '', others: '', category: 'Other',
      date: new Date().toISOString().split('T')[0], score: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setForm({
      id: t.task_id || t.id, user_id: t.user_id, task_name: t.task_name, target: t.target_goals || t.target || '',
      start_time: t.start_time, end_time: t.end_time, output: t.output,
      status: t.status, notes: t.notes, others: t.others, category: t.category,
      date: t.date || t.dateStr || '', score: t.score || ''
    });
    setIsModalOpen(true);
  };

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const action = form.id ? 'updateTask' : 'createTask';
      const payload: any = { ...form };
      if (form.id) payload.task_id = form.id;
      
      const res = await fetchApi(action, payload);
      if (res.success) {
        alert('Tugas berhasil disimpan');
        setIsModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Gagal menyimpan');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    }
  };

  const deleteTask = async (id: string) => {
    (window as any).showModalConfirm('Konfirmasi', 'Hapus tugas ini?', async () => {
      try {
        const res = await fetchApi('deleteTask', { task_id: id });
        if (res.success) {
          alert('Berhasil dihapus');
          loadData();
        } else {
          alert('Error koneksi');
        }
      } catch (err) {
        alert('Error koneksi');
      }
    });
  };

  const viewTask = (t: any) => {
    setActiveTask(t);
    setIsViewModalOpen(true);
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch = (t.name || '').toLowerCase().includes(search.toLowerCase()) || (t.task_name || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter ? t.category === catFilter : true;
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="insight-banner-wrapper fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="insight-metric-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 20, background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="insight-metric-value text-primary" style={{ fontSize: 24, fontWeight: 800 }}>{stats.total}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>Total Laporan</div>
          </div>
          <div className="stat-icon stat-icon-primary" style={{ margin: 0 }}><i className="bi bi-journal-text"></i></div>
        </div>
        <div className="insight-metric-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 20, background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="insight-metric-value text-success" style={{ fontSize: 24, fontWeight: 800 }}>{stats.completed}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>Selesai</div>
          </div>
          <div className="stat-icon stat-icon-success" style={{ margin: 0 }}><i className="bi bi-check-circle-fill"></i></div>
        </div>
        <div className="insight-metric-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 20, background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="insight-metric-value text-warn" style={{ fontSize: 24, fontWeight: 800 }}>{stats.pending}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>Pending</div>
          </div>
          <div className="stat-icon stat-icon-warn" style={{ margin: 0 }}><i className="bi bi-clock-fill"></i></div>
        </div>
        <div className="insight-metric-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 20, background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="insight-metric-value" style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>{stats.avgScore}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>Avg Skor</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', margin: 0 }}><i className="bi bi-star-fill"></i></div>
        </div>
      </div>

      <div className="card admin-menu-card p-0" style={{ margin: 0 }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <button className="btn btn-sm btn-primary" onClick={openAddModal}><i className="bi bi-plus-circle-fill"></i> Tambah Tugas</button>
        </div>

        <div className="filter-row" style={{ padding: 20, display: 'flex', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          <input type="date" className="form-control" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={{ width: 140 }} />
          <input type="date" className="form-control" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={{ width: 140 }} />
          <input type="text" className="form-control" placeholder="Nama karyawan..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <select className="form-control" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 140 }}>
            <option value="">Semua Kategori</option>
            <option value="Development">Development</option>
            <option value="Operations">Operations</option>
            <option value="Marketing">Marketing</option>
            <option value="Administrative">Administrative</option>
            <option value="Sales">Sales</option>
            <option value="Other">Lain-lain</option>
          </select>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <button className="btn btn-primary" onClick={loadData}><i className="bi bi-search"></i> Cari</button>
        </div>

        <div className="table-wrap" style={{ border: 'none', borderRadius: 0, maxHeight: 600, overflowY: 'auto' }}>
          <table className="table-modern">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Tanggal</th>
                <th>Nama Tugas</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Skor</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30 }}>Memuat tugas...</td></tr>
              ) : filteredTasks.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
              ) : (
                filteredTasks.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell">
                        <img src={t.profile_pic_url || '/img/profile.png'} alt="P" className="avatar avatar-sm" style={{ objectFit: 'cover' }} />
                        <div className="user-cell-info">
                          <span className="user-cell-name">{t.name}</span>
                          <span className="user-cell-role">{t.position}</span>
                        </div>
                      </div>
                    </td>
                    <td>{t.date}</td>
                    <td style={{ fontWeight: 600, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.task_name}>{t.task_name}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-chip ${t.status === 'Completed' ? 'chip-ok' : t.status === 'In Progress' ? 'chip-primary' : 'chip-warn'}`}>{t.status}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: t.score >= 80 ? 'var(--success)' : t.score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>{t.score || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => viewTask(t)}><i className="bi bi-eye"></i></button>
                        <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(t)}><i className="bi bi-pencil-square"></i></button>
                        <button className="btn btn-sm btn-ghost text-danger" onClick={() => deleteTask(t.task_id || t.id)}><i className="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="overlay" style={{ display: 'block', zIndex: 999 }}>
          <div className="modal border-animated-modal" style={{ maxWidth: 500, display: 'block' }}>
            <div className="card-border-glow"></div>
            <div className="modal-header" style={{ position: 'relative', zIndex: 2 }}>
              <h3 className="modal-title"><i className="bi bi-list-task text-primary" style={{ marginRight: 8 }}></i> {form.id ? 'Edit Tugas' : 'Tambah Tugas'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={saveTask} style={{ display: 'contents' }}>
              <div className="modal-body" style={{ position: 'relative', zIndex: 2 }}>
                <div className="form-group">
                  <label className="form-label">Karyawan</label>
                  <select className="form-control" required value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} disabled={!!form.id}>
                    <option value="">Pilih Karyawan...</option>
                    {users.map((u, i) => <option key={i} value={u.user_id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nama / Judul Tugas*</label>
                  <input type="text" className="form-control" required value={form.task_name} onChange={e => setForm({ ...form, task_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target / Goals*</label>
                  <input type="text" className="form-control" required value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Mulai Jam*</label>
                    <input type="time" className="form-control" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selesai Jam*</label>
                    <input type="time" className="form-control" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Output Yang Dihasilkan*</label>
                  <input type="text" className="form-control" required value={form.output} onChange={e => setForm({ ...form, output: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Tugas*</label>
                  <select className="form-control" required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Pending">Belum Selesai (Pending)</option>
                    <option value="In Progress">Sedang Dikerjakan (In Progress)</option>
                    <option value="Completed">Selesai (Completed)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-control" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="Development">Development</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Sales">Sales</option>
                    <option value="Other">Lain-lain (Other)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input type="date" className="form-control" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Productivity Score (0 - 100)</label>
                  <input type="number" className="form-control" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer" style={{ position: 'relative', zIndex: 2 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && activeTask && (
        <div className="overlay" style={{ display: 'block', zIndex: 999 }}>
          <div className="modal modal-lg" style={{ maxWidth: 550, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="bi bi-journal-text text-primary" style={{ marginRight: 8 }}></i> Detail Tugas &amp; Produktivitas</h3>
              <button className="modal-close" onClick={() => setIsViewModalOpen(false)}><i className="bi bi-x"></i></button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <img src={activeTask.profile_pic_url || '/img/profile.png'} className="avatar" style={{ width: 60, height: 60 }} alt="P" />
                <div>
                  <h3 style={{ margin: 0 }}>{activeTask.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{activeTask.position}</p>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ marginBottom: 12 }}><strong>Tugas:</strong> {activeTask.task_name}</div>
                <div style={{ marginBottom: 12 }}><strong>Kategori:</strong> <span className="status-chip chip-primary">{activeTask.category}</span></div>
                <div style={{ marginBottom: 12 }}><strong>Waktu:</strong> {activeTask.dateStr} | {activeTask.start_time} - {activeTask.end_time}</div>
                <div style={{ marginBottom: 12 }}><strong>Target:</strong> {activeTask.target}</div>
                <div style={{ marginBottom: 12 }}><strong>Output:</strong> {activeTask.output}</div>
                <div style={{ marginBottom: 12 }}><strong>Status:</strong> {activeTask.status}</div>
                <div style={{ marginBottom: 12 }}><strong>Skor:</strong> {activeTask.score || '-'}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
