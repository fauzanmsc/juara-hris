import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api';

const Approval = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [limit, setLimit] = useState(10);

  const [editApp, setEditApp] = useState<any>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  
  const [previewDoc, setPreviewDoc] = useState<{ url: string, type: 'pdf' | 'image' | 'unknown' } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      e.target.value = '';
      return;
    }
    setFile(selected);
    setFileName(selected.name);
    setFileSize((selected.size / 1024).toFixed(1) + ' KB');
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setFileBase64((ev.target.result as string).split(',')[1]);
      }
    };
    reader.readAsDataURL(selected);
  };

  const clearFile = () => {
    setFile(null);
    setFileBase64('');
    setFileName('');
    setFileSize('');
  };

  const openViewer = (url: string) => {
    let type: 'pdf' | 'image' | 'unknown' = 'unknown';
    if (url.match(/\.(jpeg|jpg|gif|png)$/i) || url.includes('lh3.googleusercontent')) type = 'image';
    else type = 'pdf'; 
    
    let finalUrl = url;
    if (url.includes('drive.google.com/file/d/')) {
      const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch) {
        finalUrl = `https://drive.google.com/file/d/${idMatch[1]}/preview`;
        type = 'pdf'; 
      }
    } else if (url.includes('drive.google.com/uc') || url.includes('id=')) {
      const idMatch = url.match(/id=([a-zA-Z0-9-_]+)/);
      if (idMatch) {
        finalUrl = `https://drive.google.com/file/d/${idMatch[1]}/preview`;
        type = 'pdf'; 
      }
    }
    setPreviewDoc({ url: finalUrl, type });
    setZoomLevel(1);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;
    try {
      const payload: any = { 
        request_id: editApp.request_id,
        type: editApp.type,
        start_date: editApp.start_date,
        end_date: editApp.end_date,
        reason: editApp.reason,
        status: editApp.status
      };
      if (fileBase64) {
        payload.attachment_base64 = fileBase64;
        payload.attachment_name = fileName;
      }

      const res = await fetchApi('editLeave', payload);
      if (res.success) {
        setEditApp(null);
        clearFile();
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

  const displayedApprovals = filteredApprovals.slice(0, limit);

  return (
    <div className="fade-in" style={{ padding: 20, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card admin-menu-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Modern Filter Section */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="filter-row" style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input type="text" className="form-control" placeholder="Cari nama karyawan..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} />
            </div>
            
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
              {[{val: '', label: 'Semua'}, {val: 'Cuti', label: 'Cuti'}, {val: 'Sakit', label: 'Sakit'}, {val: 'Izin', label: 'Izin'}].map(opt => (
                <button key={opt.val} onClick={() => setTypeFilter(opt.val)} style={{ padding: '8px 16px', background: typeFilter === opt.val ? 'var(--primary)' : 'transparent', color: typeFilter === opt.val ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, fontWeight: typeFilter === opt.val ? 600 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {(search || typeFilter) && (
              <button className="btn btn-ghost" onClick={() => { setSearch(''); setTypeFilter(''); }} style={{ height: 44, borderRadius: 12, padding: '0 16px', color: '#ef4444' }} title="Reset Filter"><i className="bi bi-x-lg"></i></button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="table-wrap" style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          <table className="table-modern">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>KARYAWAN</th>
                <th style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>KETERANGAN</th>
                <th style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>LAMPIRAN</th>
                <th style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>STATUS</th>
                <th style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>Memuat pengajuan...</td></tr>
              ) : displayedApprovals.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ada pengajuan ditemukan</td></tr>
              ) : (
                displayedApprovals.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={a.profile_pic_url || '/img/profile.png'} className="avatar avatar-sm" style={{ objectFit: 'cover', width: 36, height: 36, borderRadius: '50%' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} alt="" />
                        <span className="user-cell-name" style={{ fontWeight: 700, fontSize: 13 }}>{a.user_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Pengajuan {a.leave_type || a.type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          <i className="bi bi-calendar3" style={{ marginRight: 6 }}></i>
                          {a.start_date} {a.start_date !== a.end_date ? ` s/d ${a.end_date}` : ''}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {a.attachment_url ? (
                        <button className="btn btn-sm btn-ghost" onClick={() => openViewer(a.attachment_url)} title="Lihat Dokumen" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '4px 12px' }}>
                          <i className="bi bi-file-earmark-text text-primary" style={{ marginRight: 6 }}></i> Dokumen
                        </button>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-chip ${a.status === 'Approved' ? 'chip-ok' : a.status === 'Rejected' ? 'chip-warn' : 'chip-empty'}`} style={{ padding: '6px 12px', borderRadius: 20 }}>
                        {a.status === 'Approved' ? <><i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>Disetujui</> : a.status === 'Rejected' ? <><i className="bi bi-x-circle-fill" style={{ marginRight: 6 }}></i>Ditolak</> : <><i className="bi bi-clock-fill" style={{ marginRight: 6 }}></i>Menunggu</>}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setEditApp(a); clearFile(); }} title="Edit"><i className="bi bi-pencil-square"></i></button>
                        <Link to={`/admin/approval/${a.request_id}`} className="btn btn-sm btn-primary" title="Lihat Detail"><i className="bi bi-eye"></i></Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Limit Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Menampilkan <strong style={{ color: '#fff', fontWeight: 600 }}>{displayedApprovals.length}</strong> dari <strong style={{ color: '#fff', fontWeight: 600 }}>{filteredApprovals.length}</strong> data pengajuan
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tampilkan:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[10, 20, 50, 100].map(num => (
                <button 
                  key={num} 
                  onClick={() => setLimit(num)} 
                  style={{ 
                    padding: '4px 12px', 
                    background: limit === num ? 'var(--primary)' : 'transparent', 
                    border: `1px solid ${limit === num ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, 
                    borderRadius: 20, 
                    color: limit === num ? '#fff' : 'var(--text-muted)', 
                    fontSize: 12, 
                    cursor: 'pointer', 
                    transition: 'all 0.2s' 
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editApp && createPortal(
        <div className="reg-modal-overlay">
          <div className="reg-modal-container">
            <div className="reg-modal-card fade-in">
              <div className="reg-modal-header" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <h3 className="reg-modal-title" style={{ fontSize: 18, fontWeight: 700 }}><i className="bi bi-pencil-square text-primary" style={{ marginRight: 8 }}></i> Edit Pengajuan</h3>
                <button type="button" className="reg-modal-close" onClick={() => { setEditApp(null); clearFile(); }}><i className="bi bi-x"></i></button>
              </div>
              <form onSubmit={saveEdit} style={{ display: 'contents' }}>
                <div className="reg-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>KARYAWAN</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)', height: 42 }}>
                        <img src={editApp.profile_pic_url || '/img/profile.png'} className="avatar avatar-sm" style={{ objectFit: 'cover', width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} alt="" />
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editApp.user_name}</div>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>JENIS PENGAJUAN</label>
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)', padding: 4, height: 42 }}>
                        {['Cuti', 'Sakit', 'Izin'].map((type) => (
                          <label key={type} style={{ flex: 1, cursor: 'pointer', margin: 0 }}>
                            <input type="radio" name="leave_type" value={type} checked={editApp.type === type} onChange={() => setEditApp({...editApp, type})} style={{ display: 'none' }} />
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: editApp.type === type ? 'var(--primary)' : 'transparent', color: editApp.type === type ? '#fff' : 'var(--text-muted)', fontWeight: editApp.type === type ? 600 : 500, fontSize: 13, transition: 'all 0.2s' }}>
                              {type}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>TANGGAL MULAI</label>
                      <input type="date" className="form-control" required value={editApp.start_date} onChange={e => setEditApp({ ...editApp, start_date: e.target.value })} style={{ height: 42, borderRadius: 10, padding: '0 12px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>TANGGAL SELESAI</label>
                      <input type="date" className="form-control" required value={editApp.end_date} onChange={e => setEditApp({ ...editApp, end_date: e.target.value })} style={{ height: 42, borderRadius: 10, padding: '0 12px' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>CATATAN / ALASAN</label>
                    <textarea className="form-control" rows={2} required value={editApp.reason} onChange={e => setEditApp({ ...editApp, reason: e.target.value })} style={{ borderRadius: 10, resize: 'none', padding: '8px 12px', fontSize: 13 }}></textarea>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>DOKUMEN LAMPIRAN</label>
                    {!file && !editApp.attachment_url ? (
                      <div className="upload-area" style={{ position: 'relative', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 10, padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', transition: 'all 0.3s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                        <input type="file" accept="image/*,application/pdf" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 20 }}>
                          <i className="bi bi-cloud-arrow-up-fill"></i>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Ketuk atau Tarik file ke sini</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF, JPG, PNG (Maks 5MB)</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {file && file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt="preview" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                          ) : file ? (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><i className="bi bi-file-pdf-fill"></i></div>
                          ) : editApp.attachment_url ? (
                            <button type="button" className="btn btn-primary" onClick={() => openViewer(editApp.attachment_url)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}><i className="bi bi-eye-fill" style={{ marginRight: 6 }}></i> Lihat Dokumen</button>
                          ) : null}
                          
                          {file && (
                            <div>
                              <strong style={{ fontSize: 13, display: 'block', marginBottom: 2, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{fileName}</strong>
                              <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}><i className="bi bi-check-circle-fill" style={{ marginRight: 4 }}></i>{fileSize}</span>
                            </div>
                          )}
                        </div>
                        
                        {(file || editApp.attachment_url) && (
                          <button type="button" onClick={() => { clearFile(); setEditApp({...editApp, attachment_url: ''}); }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} title="Hapus Dokumen">
                            <i className="bi bi-trash3-fill" style={{ fontSize: 14 }}></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>STATUS PERSETUJUAN</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <label style={{ flex: 1, cursor: 'pointer' }}>
                        <input type="radio" name="status" value="Approved" checked={editApp.status === 'Approved'} onChange={() => setEditApp({...editApp, status: 'Approved'})} style={{ display: 'none' }} />
                        <div style={{ padding: '10px 8px', textAlign: 'center', borderRadius: 10, border: `2px solid ${editApp.status === 'Approved' ? '#10B981' : 'var(--border)'}`, background: editApp.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: editApp.status === 'Approved' ? '#10B981' : 'var(--text-muted)', fontWeight: editApp.status === 'Approved' ? 700 : 500, transition: 'all 0.2s', fontSize: 13 }}>
                          <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>Disetujui
                        </div>
                      </label>
                      <label style={{ flex: 1, cursor: 'pointer' }}>
                        <input type="radio" name="status" value="Rejected" checked={editApp.status === 'Rejected'} onChange={() => setEditApp({...editApp, status: 'Rejected'})} style={{ display: 'none' }} />
                        <div style={{ padding: '10px 8px', textAlign: 'center', borderRadius: 10, border: `2px solid ${editApp.status === 'Rejected' ? '#EF4444' : 'var(--border)'}`, background: editApp.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: editApp.status === 'Rejected' ? '#EF4444' : 'var(--text-muted)', fontWeight: editApp.status === 'Rejected' ? 700 : 500, transition: 'all 0.2s', fontSize: 13 }}>
                          <i className="bi bi-x-circle-fill" style={{ marginRight: 6 }}></i>Ditolak
                        </div>
                      </label>
                      <label style={{ flex: 1, cursor: 'pointer' }}>
                        <input type="radio" name="status" value="Pending" checked={editApp.status === 'Pending'} onChange={() => setEditApp({...editApp, status: 'Pending'})} style={{ display: 'none' }} />
                        <div style={{ padding: '10px 8px', textAlign: 'center', borderRadius: 10, border: `2px solid ${editApp.status === 'Pending' ? '#F59E0B' : 'var(--border)'}`, background: editApp.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: editApp.status === 'Pending' ? '#F59E0B' : 'var(--text-muted)', fontWeight: editApp.status === 'Pending' ? 700 : 500, transition: 'all 0.2s', fontSize: 13 }}>
                          <i className="bi bi-clock-fill" style={{ marginRight: 6 }}></i>Menunggu
                        </div>
                      </label>
                    </div>
                  </div>

                </div>
                <div className="reg-modal-footer" style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditApp(null); clearFile(); }} style={{ padding: '8px 20px', fontSize: 13 }}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 600, fontSize: 13 }}>Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
      {previewDoc && createPortal(
        <div className="overlay" style={{ zIndex: 999999, background: 'rgba(25, 25, 25, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '90%', maxWidth: previewDoc.type === 'image' ? 640 : 1000, height: '90%', maxHeight: previewDoc.type === 'image' ? 480 : 800, background: '#1c1c1c', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', borderBottom: '1px solid #333' }}>
               <h3 style={{ margin: 0, fontSize: 16, color: '#fff' }}><i className="bi bi-file-earmark-text text-primary" style={{marginRight: 8}}></i> Document Viewer</h3>
               <div style={{ display: 'flex', gap: 8 }}>
                 {previewDoc.type === 'image' && (
                   <>
                     <button type="button" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s' }}><i className="bi bi-zoom-out" style={{ fontSize: 14 }}></i></button>
                     <button type="button" onClick={() => setZoomLevel(1)} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s' }}><i className="bi bi-arrows-fullscreen" style={{ fontSize: 14 }}></i></button>
                     <button type="button" onClick={() => setZoomLevel(z => z + 0.25)} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s' }}><i className="bi bi-zoom-in" style={{ fontSize: 14 }}></i></button>
                   </>
                 )}
                 <button type="button" onClick={() => setPreviewDoc(null)} style={{ background: '#333', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', cursor: 'pointer', transition: 'all 0.2s', marginLeft: 8 }}><i className="bi bi-x-lg" style={{ fontSize: 14 }}></i></button>
               </div>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', background: '#121212' }}>
               {previewDoc.type === 'image' ? (
                 <img src={previewDoc.url} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, objectFit: 'contain', transform: `scale(${zoomLevel})`, transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: 'center center' }} alt="Preview" />
               ) : (
                 <iframe src={previewDoc.url} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer"></iframe>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Approval;
