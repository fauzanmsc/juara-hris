import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchApi } from '../../../api';
import Pagination from '../../../components/Pagination';

const JobDetails = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [jobLevels, setJobLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    user_id: '',
    job_level: '',
    group_level: '',
    grade_level: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadUsers();
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const res = await fetchApi('getLevels', {}, 'GET');
      if (res.success) {
        setJobLevels(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getUsers', {}, 'GET');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u: any) => {
    setEditingUser(u);
    setForm({
      user_id: u.user_id,
      job_level: u.job_level || '',
      group_level: u.group_level || '',
      grade_level: u.grade_level || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // PENTING: Endpoint ini membutuhkan update di Google Apps Script (Code.gs)
      const res = await fetchApi('updateJobDetails', form);
      if (res.success) {
        alert('Detail jabatan berhasil disimpan!');
        setIsModalOpen(false);
        loadUsers(); // reload
      } else {
        alert('Gagal menyimpan: ' + (res.message || 'Harap update backend (Code.gs) terlebih dahulu.'));
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi atau endpoint belum tersedia di backend.');
    }
  };

  const filteredUsers = users.filter(u => {
    const roleStr = (u.role || '').toLowerCase();
    const statusStr = (u.status || '').toLowerCase();
    const isEmployee = !u.role || roleStr === 'employee' || roleStr === 'karyawan';
    const isActive = statusStr === 'active' || statusStr === 'aktif';
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (String(u.user_id)).toLowerCase().includes(search.toLowerCase());
    return isEmployee && isActive && matchSearch;
  });
  
  const paginatedData = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="admin-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-person-vcard text-primary"></i> Setting Detail Jabatan
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Kelola Level Jabatan, Golongan, dan Grade untuk kebutuhan Payroll.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 50, padding: '6px 16px', width: 250 }}>
            <i className="bi bi-search text-muted" style={{ marginRight: 8 }}></i>
            <input 
              type="text" 
              placeholder="Cari karyawan..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', width: '100%', fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ fontSize: 11, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>KARYAWAN</th>
                <th style={{ fontSize: 11, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>DIVISI</th>
                <th style={{ fontSize: 11, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>LEVEL JABATAN</th>
                <th style={{ fontSize: 11, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>GOLONGAN</th>
                <th style={{ fontSize: 11, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>GRADE</th>
                <th style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Tidak ada data</td></tr>
              ) : (
                paginatedData.map((u, i) => (
                  <tr key={u.user_id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={u.profile_pic_url || '/img/profile.png'} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.position || 'Belum ada jabatan'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 500 }}>{u.division || '-'}</span></td>
                    <td>{u.job_level ? <span className="status-chip chip-ok">{u.job_level}</span> : '-'}</td>
                    <td>{u.group_level ? <span className="status-chip chip-warn">Gol {u.group_level}</span> : '-'}</td>
                    <td>{u.grade_level ? <span className="status-chip chip-empty">Grade {u.grade_level}</span> : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm" onClick={() => handleEdit(u)} title="Set Detail" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 50, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <i className="bi bi-pencil-fill" style={{ fontSize: 12 }}></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          total={filteredUsers.length} 
          pageSize={pageSize} 
          currentPage={currentPage} 
          setPageSize={setPageSize} 
          setCurrentPage={setCurrentPage} 
          label="karyawan" 
        />
      </div>

      {isModalOpen && createPortal(
        <div className="overlay reg-modal-overlay">
          <div className="reg-modal-container">
            <div className="reg-modal-card border-animated-modal" style={{ maxWidth: 450, width: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div className="card-border-glow"></div>
              
              <div style={{ padding: '24px 32px 16px', position: 'relative', zIndex: 2 }}>
                <button className="reg-modal-close" onClick={() => setIsModalOpen(false)} type="button" style={{ top: 20, right: 20 }}><i className="bi bi-x-lg"></i></button>
                <div className="form-header" style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)', margin: 0 }}>
                    Setting Detail Jabatan
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Karyawan: <strong>{editingUser?.name}</strong></p>
                </div>
              </div>

              <div style={{ padding: '0 32px 24px', position: 'relative', zIndex: 2 }}>
                <form onSubmit={handleSave}>
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>LEVEL JABATAN</label>
                    <div style={{ position: 'relative' }}>
                      <div 
                        onClick={() => setIsLevelOpen(!isLevelOpen)}
                        style={{ padding: '0 16px', paddingLeft: 44, width: '100%', height: 46, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s', borderColor: isLevelOpen ? 'var(--primary)' : 'var(--border)' }}
                      >
                        <i className="bi bi-award input-icon" style={{ left: 16, fontSize: 16, color: isLevelOpen ? 'var(--primary)' : 'var(--text-muted)' }}></i>
                        <span style={{ color: form.job_level ? 'var(--text)' : 'var(--text-muted)', fontSize: 14, fontWeight: form.job_level ? 600 : 400 }}>{form.job_level || 'Pilih Level Jabatan'}</span>
                        <i className="bi bi-chevron-down" style={{ fontSize: 12, color: 'var(--text-muted)', transition: 'transform 0.3s ease', transform: isLevelOpen ? 'rotate(180deg)' : 'none' }}></i>
                      </div>
                      {isLevelOpen && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setIsLevelOpen(false)}></div>
                          <div className="fade-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 24px rgba(0,0,0,0.2)', zIndex: 10, padding: 8, maxHeight: 200, overflowY: 'auto' }}>
                            {jobLevels.length === 0 ? (
                              <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Tidak ada data level</div>
                            ) : (
                              jobLevels.map((lvl: any) => (
                                <div 
                                  key={lvl.level_id} 
                                  onClick={() => { setForm({...form, job_level: lvl.level_name}); setIsLevelOpen(false); }}
                                  style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer', background: form.job_level === lvl.level_name ? 'rgba(255,183,3,0.1)' : 'transparent', color: form.job_level === lvl.level_name ? 'var(--primary)' : 'var(--text)', fontWeight: form.job_level === lvl.level_name ? 700 : 500, transition: 'all 0.2s', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                  onMouseOver={(e) => { if(form.job_level !== lvl.level_name) e.currentTarget.style.background = 'var(--bg-body)' }}
                                  onMouseOut={(e) => { if(form.job_level !== lvl.level_name) e.currentTarget.style.background = 'transparent' }}
                                >
                                  {lvl.level_name}
                                  {form.job_level === lvl.level_name && <i className="bi bi-check2"></i>}
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>GOLONGAN</span>
                      <span style={{ color: 'var(--primary)' }}>{form.group_level ? `Golongan ${form.group_level}` : ''}</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[...Array(10)].map((_, i) => (
                        <button 
                          key={i} 
                          type="button"
                          onClick={() => setForm({...form, group_level: String(i+1)})}
                          style={{ 
                            width: 38, height: 38, borderRadius: 10, 
                            background: form.group_level === String(i+1) ? 'var(--primary)' : 'var(--bg-input)', 
                            color: form.group_level === String(i+1) ? '#fff' : 'var(--text)', 
                            border: `1px solid ${form.group_level === String(i+1) ? 'var(--primary)' : 'var(--border)'}`, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                            fontSize: 14, boxShadow: form.group_level === String(i+1) ? '0 4px 12px rgba(255,183,3,0.2)' : 'none'
                          }}
                          onMouseOver={(e) => { if(form.group_level !== String(i+1)) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                          onMouseOut={(e) => { if(form.group_level !== String(i+1)) e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          {i+1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 28 }}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>GRADE</span>
                      <span style={{ color: 'var(--primary)' }}>{form.grade_level ? `Grade ${form.grade_level}` : ''}</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[...Array(10)].map((_, i) => (
                        <button 
                          key={i} 
                          type="button"
                          onClick={() => setForm({...form, grade_level: String(i+1)})}
                          style={{ 
                            width: 38, height: 38, borderRadius: 10, 
                            background: form.grade_level === String(i+1) ? 'var(--primary)' : 'var(--bg-input)', 
                            color: form.grade_level === String(i+1) ? '#fff' : 'var(--text)', 
                            border: `1px solid ${form.grade_level === String(i+1) ? 'var(--primary)' : 'var(--border)'}`, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                            fontSize: 14, boxShadow: form.grade_level === String(i+1) ? '0 4px 12px rgba(255,183,3,0.2)' : 'none'
                          }}
                          onMouseOver={(e) => { if(form.grade_level !== String(i+1)) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                          onMouseOut={(e) => { if(form.grade_level !== String(i+1)) e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          {i+1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ flex: 1, height: 46, borderRadius: 50, fontWeight: 600 }}>Batal</button>
                    <button type="submit" className="btn-login btn-neu-3d" style={{ flex: 1, margin: 0, height: 46, borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      <i className="bi bi-save" style={{ marginRight: 8 }}></i> Simpan Data
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default JobDetails;
