import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { fetchApi } from '../../api';

const Attendance = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [topLate, setTopLate] = useState<any[]>([]);
  const [topAbsent, setTopAbsent] = useState<any[]>([]);
  const [topSick, setTopSick] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editAtt, setEditAtt] = useState<any>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getAttendance', {
        start_date: filterStart,
        end_date: filterEnd
      }, 'GET');
      if (res.success) {
        setAttendance(res.data || res.records || []);
        setTopLate(res.analytics?.top_late || []);
        setTopAbsent(res.analytics?.top_absent || []);
        setTopSick(res.analytics?.top_sick_permit || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('editAttendance', { ...editAtt });
      if (res.success) {
        alert('Data absensi berhasil diperbarui');
        setEditAtt(null);
        loadData();
      } else {
        alert(res.message || 'Gagal memperbarui');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    }
  };

  const filtered = attendance.filter(a => {
    const matchSearch = (a.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? a.status_in === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const exportToExcel = () => {
    if (filtered.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    const exportData = filtered.map((a, i) => ({
      'No': i + 1,
      'Nama Karyawan': a.name || 'Karyawan',
      'Jabatan': a.position || 'Employee',
      'Tanggal': a.dateStr || a.date || '-',
      'Jam Masuk': a.clock_in_time || a.clock_in || '-',
      'Jam Pulang': a.clock_out_time || a.clock_out || '-',
      'Jarak Masuk (m)': a.distance_in_meters || a.distance_meters || a.distance || '-',
      'Status Masuk': a.status_in || '-',
      'Status Pulang': a.status_out || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-fit columns
    const colWidths = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 20 }, // Jabatan
      { wch: 15 }, // Tanggal
      { wch: 15 }, // Jam Masuk
      { wch: 15 }, // Jam Pulang
      { wch: 15 }, // Jarak
      { wch: 15 }, // Status Masuk
      { wch: 15 }, // Status Pulang
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Kehadiran');

    const fileName = `Export_Kehadiran_${filterStart || 'Semua'}_sampai_${filterEnd || 'Semua'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      
      <div className="attendance-main-column" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="analytics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          <div className="analytics-card">
            <h4 className="analytics-title"><i className="bi bi-alarm-fill text-danger"></i> Top 3 Sering Terlambat</h4>
            <div className="top-emp-list">
              {topLate.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Belum ada data</div> : 
               topLate.map((u, i) => (
                 <div key={i} className="top-emp-item">
                   <div className="top-emp-left">
                     <span className="top-emp-rank">{i + 1}</span>
                     <img src={u.profile_pic_url || u.profile_pic || '/img/profile.png'} className="avatar avatar-sm" style={{ width: 36, height: 36, objectFit: 'cover' }} alt="" onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                     <div className="top-emp-info">
                       <span className="top-emp-name">{u.name || 'Karyawan'}</span>
                       <span className="top-emp-pos">{u.position || 'Employee'}</span>
                     </div>
                   </div>
                   <span className="top-emp-stat stat-late">{u.late_count || 0} Kali</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="analytics-card">
            <h4 className="analytics-title"><i className="bi bi-person-x-fill text-danger" style={{ fontSize: 16 }}></i> Top 3 Paling Banyak Tidak Hadir</h4>
            <div className="top-emp-list">
              {topAbsent.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Belum ada data</div> : 
               topAbsent.map((u, i) => (
                 <div key={i} className="top-emp-item">
                   <div className="top-emp-left">
                     <span className="top-emp-rank">{i + 1}</span>
                     <img src={u.profile_pic_url || u.profile_pic || '/img/profile.png'} className="avatar avatar-sm" style={{ width: 36, height: 36, objectFit: 'cover' }} alt="" onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                     <div className="top-emp-info">
                       <span className="top-emp-name">{u.name || 'Karyawan'}</span>
                       <span className="top-emp-pos">{u.position || 'Employee'}</span>
                     </div>
                   </div>
                   <span className="top-emp-stat stat-absent">{u.absent_days || 0} Hari</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="analytics-card">
            <h4 className="analytics-title"><i className="bi bi-heart-pulse-fill text-warning" style={{ fontSize: 16 }}></i> Top 3 Paling Sering Sakit &amp; Izin</h4>
            <div className="top-emp-list">
              {topSick.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Belum ada data</div> : 
               topSick.map((u, i) => (
                 <div key={i} className="top-emp-item">
                   <div className="top-emp-left">
                     <span className="top-emp-rank">{i + 1}</span>
                     <img src={u.profile_pic_url || u.profile_pic || '/img/profile.png'} className="avatar avatar-sm" style={{ width: 36, height: 36, objectFit: 'cover' }} alt="" onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                     <div className="top-emp-info">
                       <span className="top-emp-name">{u.name || 'Karyawan'}</span>
                       <span className="top-emp-pos">{u.position || 'Employee'}</span>
                     </div>
                   </div>
                   <span className="top-emp-stat stat-sick-permit">{u.sick_permit_days || 0} Hari</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="card admin-menu-card p-0" style={{ margin: 0 }}>
          <div className="filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 20, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400 }}>
              <input type="date" className="form-control" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={{ minWidth: 0 }} />
              <input type="date" className="form-control" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={{ minWidth: 0 }} />
            </div>
            <input type="text" className="form-control" placeholder="Nama karyawan..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 150, cursor: 'pointer' }}>
              <option value="">Semua Status</option>
              <option value="Tepat Waktu">Tepat Waktu</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Absen">Absen</option>
            </select>
            <button className="btn btn-primary btn-search-round" onClick={loadData}><i className="bi bi-search"></i></button>
            <div className="admin-card-actions">
              <button className="btn btn-sm btn-success" onClick={exportToExcel}><i className="bi bi-file-earmark-excel-fill"></i> Export XLSX</button>
            </div>
          </div>

          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, borderTop: '1px solid var(--border)', marginTop: 20, maxHeight: 500, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal</th>
                  <th>Masuk</th>
                  <th>Pulang</th>
                  <th>Jarak</th>
                  <th>Status</th>
                  <th>Foto</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30 }}>Memuat data absensi...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                ) : (
                  filtered.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <div className="user-cell" style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                          <img src={a.profile_pic_url || a.profile_pic || '/img/profile.png'} className="avatar avatar-sm" style={{ objectFit: 'cover' }} alt="" onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                          <strong>{a.name}</strong>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{a.dateStr || a.date}</td>
                      <td><strong style={{ color: 'var(--text)' }}>{a.clock_in_time || a.clock_in}</strong></td>
                      <td><strong style={{ color: 'var(--text)' }}>{a.clock_out_time || a.clock_out || '--:--'}</strong></td>
                      <td>{a.distance_in_meters || a.distance_meters || a.distance ? `${a.distance_in_meters || a.distance_meters || a.distance}m` : '—'}</td>
                      <td>
                        <span className={`badge ${a.status_in === 'Terlambat' ? 'badge-warn' : a.status_in === 'Absen' ? 'badge-danger' : 'badge-success'}`}>{a.status_in || '—'}</span>
                      </td>
                      <td>
                        {(a.photo_in_url || a.photo_url) ? <button type="button" onClick={() => { setPreviewPhoto(a.photo_in_url || a.photo_url); setZoomLevel(1); }} className="btn btn-sm btn-ghost"><i className="bi bi-camera"></i></button> : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => setEditAtt(a)} style={{ padding: 6, borderRadius: 8, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Edit"><i className="bi bi-pencil-fill" style={{ fontSize: 14 }}></i></button>
                          <button className="btn btn-sm btn-danger" onClick={() => { if(window.confirm('Yakin ingin menghapus?')) alert('Fitur Hapus belum terhubung di UI baru'); }} style={{ background: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF', padding: 6, borderRadius: 8, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Hapus"><i className="bi bi-trash-fill" style={{ fontSize: 14 }}></i></button>
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

      {editAtt && (
        <div className="overlay" style={{ display: 'block' }}>
          <div className="modal border-animated-modal" style={{ maxWidth: 450, display: 'block' }}>
            <div className="card-border-glow"></div>
            <div className="modal-header" style={{ position: 'relative', zIndex: 2 }}>
              <h3 className="modal-title"><i className="bi bi-pencil-square text-primary" style={{ marginRight: 8 }}></i> Edit Absensi</h3>
              <button className="modal-close" onClick={() => setEditAtt(null)}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={saveEdit} style={{ display: 'contents' }}>
              <div className="modal-body" style={{ position: 'relative', zIndex: 2 }}>
                <div className="form-group">
                  <label className="form-label">Nama Karyawan</label>
                  <input type="text" className="form-control" readOnly value={editAtt.name} style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input type="date" className="form-control" readOnly value={editAtt.date} style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Jam Masuk</label>
                    <input type="time" className="form-control" required value={editAtt.clock_in_time || editAtt.clock_in} onChange={e => setEditAtt({ ...editAtt, clock_in_time: e.target.value, clock_in: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Jam Pulang</label>
                    <input type="time" className="form-control" value={editAtt.clock_out_time || editAtt.clock_out} onChange={e => setEditAtt({ ...editAtt, clock_out_time: e.target.value, clock_out: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" required value={editAtt.status_in} onChange={e => setEditAtt({ ...editAtt, status_in: e.target.value })}>
                    <option value="Tepat Waktu">Tepat Waktu</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Absen">Absen</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jarak (m)</label>
                  <input type="number" className="form-control" value={editAtt.distance_in_meters || editAtt.distance_meters || editAtt.distance} onChange={e => setEditAtt({ ...editAtt, distance_in_meters: e.target.value, distance_meters: e.target.value, distance: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer" style={{ position: 'relative', zIndex: 2 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditAtt(null)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewPhoto && createPortal(
        <div className="overlay" style={{ zIndex: 999999, background: 'rgba(25, 25, 25, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '80%', maxWidth: 640, background: '#1c1c1c', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#222', borderBottom: '1px solid #333' }}>
               <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s' }}><i className="bi bi-zoom-out" style={{ fontSize: 14 }}></i></button>
               <button onClick={() => setZoomLevel(1)} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s' }}><i className="bi bi-arrows-fullscreen" style={{ fontSize: 14 }}></i></button>
               <button onClick={() => setZoomLevel(z => z + 0.25)} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s' }}><i className="bi bi-zoom-in" style={{ fontSize: 14 }}></i></button>
               <button onClick={() => setPreviewPhoto(null)} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s', marginLeft: 8 }}><i className="bi bi-x-lg" style={{ fontSize: 14 }}></i></button>
            </div>
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', height: 480, background: '#121212' }}>
               <img src={previewPhoto} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 16, objectFit: 'contain', transform: `scale(${zoomLevel})`, transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: 'center center' }} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Attendance;
