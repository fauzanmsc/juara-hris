import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';

const LeaveReport = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const [adjustQuotaModal, setAdjustQuotaModal] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getLeaveReport', {
        start_date: filterStart,
        end_date: filterEnd
      }, 'GET');
      if (res.success) {
        setReports(res.data || res.report || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('updateLeaveQuota', {
        user_id: adjustQuotaModal.userId,
        quota: adjustQuotaModal.newQuota
      });
      if (res.success) {
        alert('Jatah cuti berhasil diperbarui');
        setAdjustQuotaModal(null);
        loadData();
      } else {
        alert(res.message || 'Gagal memperbarui');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    }
  };

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="card admin-menu-card">
        <div className="filter-row" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Periode:</span>
            <input type="date" className="form-control" style={{ width: 160 }} value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>s.d</span>
            <input type="date" className="form-control" style={{ width: 160 }} value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)' }} onClick={loadData}>
            <i className="bi bi-filter"></i> Terapkan Filter
          </button>
        </div>

        <div className="table-wrap" style={{ maxHeight: 500, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 70, textAlign: 'center' }}>Foto</th>
                <th>Karyawan</th>
                <th>Jabatan</th>
                <th style={{ textAlign: 'center' }}>Jatah Cuti</th>
                <th style={{ textAlign: 'center' }}>Sisa Cuti</th>
                <th style={{ textAlign: 'center' }}>Total Sakit</th>
                <th style={{ textAlign: 'center' }}>Total Izin</th>
                <th style={{ textAlign: 'center' }}>Total Cuti</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30 }}>Memuat laporan...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
              ) : (
                reports.map((r, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'center' }}>
                      <img src={r.profile_pic_url || '/img/profile.png'} alt="P" className="avatar avatar-sm" style={{ objectFit: 'cover' }} />
                    </td>
                    <td style={{ fontWeight: 800 }}>{r.name}</td>
                    <td>{r.position}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.allowed_leave_quota}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }} className="text-primary">{r.remaining_leave_quota}</td>
                    <td style={{ textAlign: 'center' }}>{r.sick_count}</td>
                    <td style={{ textAlign: 'center' }}>{r.permit_count}</td>
                    <td style={{ textAlign: 'center' }}>{r.cuti_count}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setAdjustQuotaModal({ userId: r.user_id, name: r.name, newQuota: r.allowed_leave_quota })} title="Sesuaikan Kuota Cuti">
                        <i className="bi bi-calendar-check text-primary"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adjustQuotaModal && (
        <div className="overlay" style={{ display: 'block' }}>
          <div className="modal border-animated-modal" style={{ maxWidth: 400, display: 'block' }}>
            <div className="card-border-glow"></div>
            <div className="modal-header" style={{ position: 'relative', zIndex: 2 }}>
              <h3 className="modal-title"><i className="bi bi-calendar-check-fill text-primary" style={{ marginRight: 8 }}></i> Sesuaikan Jatah Cuti</h3>
              <button className="modal-close" onClick={() => setAdjustQuotaModal(null)}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={saveQuota} style={{ display: 'contents' }}>
              <div className="modal-body" style={{ position: 'relative', zIndex: 2 }}>
                <div className="form-group">
                  <label className="form-label">Nama Karyawan</label>
                  <input type="text" className="form-control" readOnly value={adjustQuotaModal.name} style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Jatah Cuti Tahunan</label>
                  <input type="number" className="form-control" required min={0} max={365} value={adjustQuotaModal.newQuota} onChange={e => setAdjustQuotaModal({ ...adjustQuotaModal, newQuota: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer" style={{ position: 'relative', zIndex: 2 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setAdjustQuotaModal(null)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveReport;
