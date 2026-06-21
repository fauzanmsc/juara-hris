import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchApi } from '../../../api';

const BankAccounts = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    user_id: '',
    bank_account: '',
    bank_number: ''
  });

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
      bank_account: u.bank_account || '',
      bank_number: u.bank_number || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('updateBankAccounts', form);
      if (res.success) {
        alert('Data rekening berhasil disimpan!');
        setIsModalOpen(false);
        loadUsers();
      } else {
        alert('Gagal menyimpan: ' + (res.message || 'Harap update backend (Code.gs) terlebih dahulu.'));
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi atau endpoint belum tersedia di backend.');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (String(u.user_id)).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="admin-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-bank text-info"></i> Setting Rekening Karyawan
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Kelola data bank dan nomor rekening untuk transfer gaji.</p>
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
                <th>Nama Bank</th>
                <th>Nomor Rekening</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>Tidak ada data</td></tr>
              ) : (
                filteredUsers.map((u, i) => (
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
                    <td>{u.bank_account ? <span className="status-chip chip-info">{u.bank_account}</span> : '-'}</td>
                    <td style={{ fontWeight: 600, letterSpacing: '1px' }}>{u.bank_number || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm" onClick={() => handleEdit(u)} title="Set Rekening" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 50, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <i className="bi bi-pencil-fill" style={{ fontSize: 12 }}></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                    Rekening Karyawan
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Karyawan: <strong>{editingUser?.name}</strong></p>
                </div>
              </div>

              <div style={{ padding: '0 32px 24px', position: 'relative', zIndex: 2 }}>
                <form onSubmit={handleSave}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Nama Bank</label>
                    <div className="input-wrap">
                      <i className="bi bi-bank input-icon"></i>
                      <select value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})} style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }}>
                        <option value="">Pilih Bank</option>
                        <option value="BCA">BCA</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="BNI">BNI</option>
                        <option value="BRI">BRI</option>
                        <option value="BSI">BSI</option>
                        <option value="Permata">Permata</option>
                        <option value="CIMB Niaga">CIMB Niaga</option>
                        <option value="Lainnya">Bank Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label">Nomor Rekening</label>
                    <div className="input-wrap">
                      <i className="bi bi-123 input-icon"></i>
                      <input type="text" value={form.bank_number} onChange={e => setForm({...form, bank_number: e.target.value})} placeholder="Contoh: 1234567890" style={{ paddingLeft: 40, width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none' }} />
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

export default BankAccounts;
