import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchApi } from '../../../api';
import CurrencyInput from '../../../components/CurrencyInput';
import Pagination from '../../../components/Pagination';

const SalaryStructures = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    user_id: '',
    base_salary: '',
    position_allowance: '',
    grade_allowance: '',
    group_allowance: ''
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
      base_salary: u.base_salary || '',
      position_allowance: u.position_allowance || '',
      grade_allowance: u.grade_allowance || '',
      group_allowance: u.group_allowance || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('updateSalaryStructure', form);
      if (res.success) {
        alert('Struktur upah berhasil disimpan!');
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
            <i className="bi bi-cash-coin text-success"></i> Setting Struktur Upah
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Kelola Gaji Pokok dan komponen Tunjangan karyawan.</p>
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
                <th>Gaji Pokok</th>
                <th>Tunjangan Jabatan</th>
                <th>Tunjangan Grade</th>
                <th>Tunjangan Golongan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={u.profile_pic_url || '/img/profile.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(u.base_salary)}</td>
                    <td>{formatRupiah(u.position_allowance)}</td>
                    <td>{formatRupiah(u.grade_allowance)}</td>
                    <td>{formatRupiah(u.group_allowance)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm" onClick={() => handleEdit(u)} title="Set Upah" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 50, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
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
            <div className="reg-modal-card border-animated-modal" style={{ maxWidth: 500, width: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div className="card-border-glow"></div>
              
              <div style={{ padding: '24px 32px 16px', position: 'relative', zIndex: 2 }}>
                <button className="reg-modal-close" onClick={() => setIsModalOpen(false)} type="button" style={{ top: 20, right: 20 }}><i className="bi bi-x-lg"></i></button>
                <div className="form-header" style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)', margin: 0 }}>
                    Struktur Upah
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Karyawan: <strong>{editingUser?.name}</strong></p>
                </div>
              </div>

              <div style={{ padding: '0 32px 24px', position: 'relative', zIndex: 2, maxHeight: '60vh', overflowY: 'auto' }}>
                <form onSubmit={handleSave}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Gaji Pokok (Rp)</label>
                    <div className="input-wrap">
                      <i className="bi bi-cash input-icon"></i>
                      <CurrencyInput value={form.base_salary} onChange={val => setForm({...form, base_salary: val})} placeholder="Contoh: 5000000" style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Tunjangan Jabatan (Rp)</label>
                    <div className="input-wrap">
                      <i className="bi bi-award input-icon"></i>
                      <CurrencyInput value={form.position_allowance} onChange={val => setForm({...form, position_allowance: val})} placeholder="0" style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Tunjangan Grade (Rp)</label>
                    <div className="input-wrap">
                      <i className="bi bi-star input-icon"></i>
                      <CurrencyInput value={form.grade_allowance} onChange={val => setForm({...form, grade_allowance: val})} placeholder="0" style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label">Tunjangan Golongan (Rp)</label>
                    <div className="input-wrap">
                      <i className="bi bi-bar-chart-steps input-icon"></i>
                      <CurrencyInput value={form.group_allowance} onChange={val => setForm({...form, group_allowance: val})} placeholder="0" style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }} />
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

export default SalaryStructures;
