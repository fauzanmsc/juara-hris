import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchApi } from '../../api';

const Approval = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [editApp, setEditApp] = useState<any>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getPendingLeaves', {}, 'GET');
      if (res.success && res.data) {
        setApprovals(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    (window as any).showModalConfirm('Konfirmasi', `Yakin ingin ${newStatus.toLowerCase()} pengajuan ini?`, async () => {
      try {
        const userStr = localStorage.getItem('hris_user');
        const user = userStr ? JSON.parse(userStr) : { name: 'Admin' };
        const res = await fetchApi('decideLeave', { request_id: id, status: newStatus, approved_by: user.name });
        if (res.success) {
          loadApprovals();
        } else {
          alert('Gagal memproses persetujuan');
        }
      } catch (err) {
        alert('Error koneksi');
      }
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;
    try {
      const res = await fetchApi('editLeave', { 
        request_id: editApp.request_id,
        type: editApp.type,
        start_date: editApp.start_date,
        end_date: editApp.end_date,
        reason: editApp.reason,
        status: editApp.status
      });
      if (res.success) {
        setEditApp(null);
        loadApprovals();
      } else {
        alert('Gagal menyimpan perubahan');
      }
    } catch (err) {
      alert('Error koneksi');
    }
  };

  const filteredApprovals = approvals.filter(a => {
    const matchSearch = (a.user_name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? (a.leave_type || a.type) === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="card admin-menu-card">
        <div className="filter-row" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Filter nama karyawan..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 'auto', minWidth: 150, cursor: 'pointer' }}>
            <option value="">Semua Jenis</option>
            <option value="Cuti">Cuti</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
          </select>
          <button className="btn btn-primary" onClick={loadApprovals}><i className="bi bi-search"></i> Refresh</button>
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setTypeFilter(''); }}><i className="bi bi-x-lg"></i> Reset</button>
        </div>

        <div className="table-wrap" style={{ maxHeight: 500, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Jenis</th>
                <th>Mulai</th>
                <th>Hingga</th>
                <th>Catatan</th>
                <th>Dokumen</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Keputusan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30 }}>Memuat pengajuan...</td></tr>
              ) : filteredApprovals.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ada pengajuan ditemukan</td></tr>
              ) : (
                filteredApprovals.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 800 }}>{a.user_name}</td>
                    <td>{a.leave_type || a.type}</td>
                    <td>{a.start_date}</td>
                    <td>{a.end_date}</td>
                    <td style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.reason}>{a.reason}</td>
                    <td>
                      {a.attachment_url ? (
                        <a href={a.attachment_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost"><i className="bi bi-file-earmark-text text-primary"></i></a>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`status-chip ${a.status === 'Approved' ? 'chip-ok' : a.status === 'Rejected' ? 'chip-warn' : 'chip-empty'}`}>
                        {a.status === 'Approved' ? 'Disetujui' : a.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a.request_id, 'Approved')} title="Setujui"><i className="bi bi-check-lg"></i></button>
                        <button className="btn btn-sm btn-ghost text-danger" onClick={() => updateStatus(a.request_id, 'Rejected')} title="Tolak"><i className="bi bi-x-lg"></i></button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditApp(a)}><i className="bi bi-pencil-square"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editApp && createPortal(
        <div className="reg-modal-overlay">
          <div className="reg-modal-container">
            <div className="reg-modal-card fade-in">
              <div className="reg-modal-header">
                <h3 className="reg-modal-title"><i className="bi bi-pencil-square text-primary" style={{ marginRight: 8 }}></i> Edit Pengajuan</h3>
                <button className="reg-modal-close" onClick={() => setEditApp(null)}><i className="bi bi-x"></i></button>
              </div>
              <form onSubmit={saveEdit} style={{ display: 'contents' }}>
                <div className="reg-modal-body">
                  <div className="form-group">
                    <label className="form-label">Nama Karyawan</label>
                    <input type="text" className="form-control" readOnly value={editApp.user_name} style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jenis</label>
                    <select className="form-control" required value={editApp.type} onChange={e => setEditApp({ ...editApp, type: e.target.value })}>
                      <option value="Cuti">Cuti</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Izin">Izin</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Mulai</label>
                      <input type="date" className="form-control" required value={editApp.start_date} onChange={e => setEditApp({ ...editApp, start_date: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Hingga</label>
                      <input type="date" className="form-control" required value={editApp.end_date} onChange={e => setEditApp({ ...editApp, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Catatan</label>
                    <textarea className="form-control" rows={2} required value={editApp.reason} onChange={e => setEditApp({ ...editApp, reason: e.target.value })}></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" required value={editApp.status} onChange={e => setEditApp({ ...editApp, status: e.target.value })}>
                      <option value="Pending">Menunggu</option>
                      <option value="Approved">Disetujui</option>
                      <option value="Rejected">Ditolak</option>
                    </select>
                  </div>
                </div>
                <div className="reg-modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditApp(null)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Approval;
