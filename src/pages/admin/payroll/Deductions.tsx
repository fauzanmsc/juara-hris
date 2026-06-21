import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchApi } from '../../../api';
import CurrencyInput from '../../../components/CurrencyInput';
import Pagination from '../../../components/Pagination';

const Deductions = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    user_id: '',
    bpjs_tk: '',
    bpjs_kes: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

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
      bpjs_tk: u.bpjs_tk || '',
      bpjs_kes: u.bpjs_kes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('updateDeductions', form);
      if (res.success) {
        alert('Data potongan berhasil disimpan!');
        setIsModalOpen(false);
        loadUsers();
      } else {
        alert('Gagal menyimpan: ' + (res.message || 'Harap update backend (Code.gs) terlebih dahulu.'));
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi atau endpoint belum tersedia di backend.');
    }
  };

  const formatRupiah = (angka: any) => {
    if (!angka) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (String(u.user_id)).toLowerCase().includes(search.toLowerCase())
  );
  
  const paginatedData = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="admin-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-dash-circle text-danger"></i> Setting Potongan Upah
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Kelola potongan gaji karyawan seperti BPJS Tenaga Kerja & Kesehatan.</p>
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
                <th>Karyawan</th>
                <th>BPJS Ketenagakerjaan (TK)</th>
                <th>BPJS Kesehatan (KES)</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>Tidak ada data</td></tr>
              ) : (
                paginatedData.map((u, i) => (
                  <tr key={u.user_id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={u.profile_pic_url || '/img/profile.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatRupiah(u.bpjs_tk)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatRupiah(u.bpjs_kes)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm" onClick={() => handleEdit(u)} title="Set Potongan" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 50, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
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
                    Potongan Upah
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Karyawan: <strong>{editingUser?.name}</strong></p>
                </div>
              </div>

              <div style={{ padding: '0 32px 24px', position: 'relative', zIndex: 2 }}>
                <form onSubmit={handleSave}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Nominal BPJS Ketenagakerjaan (Rp)</label>
                    <div className="input-wrap">
                      <i className="bi bi-shield-check input-icon"></i>
                      <CurrencyInput value={form.bpjs_tk} onChange={val => setForm({...form, bpjs_tk: val})} placeholder="0" style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label">Nominal BPJS Kesehatan (Rp)</label>
                    <div className="input-wrap">
                      <i className="bi bi-heart-pulse input-icon"></i>
                      <CurrencyInput value={form.bpjs_kes} onChange={val => setForm({...form, bpjs_kes: val})} placeholder="0" style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ flex: 1, height: 42, borderRadius: 50 }}>Batal</button>
                    <button type="submit" className="btn-login btn-neu-3d" style={{ flex: 1, margin: 0, height: 42, borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-save" style={{ marginRight: 6 }}></i> Simpan Data
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

export default Deductions;
