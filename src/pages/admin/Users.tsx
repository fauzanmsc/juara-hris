import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    user_id: '',
    name: '',
    email: '',
    pin: '',
    position: '',
    division: 'Umum',
    role: 'Employee'
  });
  const [avatarPreview, setAvatarPreview] = useState('/img/profile.png');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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

  const getBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const handleEdit = (u: any) => {
    setForm(u);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setForm({
      user_id: '',
      email: '',
      name: '',
      position: '',
      division: '',
      role: 'Staff',
      status: 'Aktif',
      password_pin: ''
    });
    setIsModalOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return alert('Nama dan Email wajib diisi');
    
    // Fallback if password_pin is empty when creating
    let pin = form.password_pin;
    if (!form.user_id && !pin) {
        pin = '123456';
    }

    try {
      const action = form.user_id ? 'updateUser' : 'addUser';
      const res = await fetchApi(action, {
        ...form,
        password_pin: pin
      });
      if (res.success) {
        setIsModalOpen(false);
        loadUsers();
      } else {
        alert(res.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    }
  };

  const toggleStatus = async (user_id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    (window as any).showModalConfirm('Konfirmasi', 'Yakin ingin merubah status karyawan ini?', async () => {
      try {
        const res = await fetchApi('updateUserStatus', { user_id, status: newStatus });
        if (res.success) {
          loadUsers();
        } else {
          alert('Gagal merubah status');
        }
      } catch (err) {
        alert('Error koneksi');
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? u.status === statusFilter : true;
    const matchRole = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchStatus && matchRole;
  });

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="card admin-menu-card">
        <div className="filter-row" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 200, maxWidth: 350, position: 'relative' }}>
            <i className="bi bi-search input-icon" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
            <input type="text" className="form-control" placeholder="Cari nama / email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 140, cursor: 'pointer' }}>
            <option value="">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Inactive">Nonaktif</option>
            <option value="Pending">Pending</option>
          </select>
          <select className="form-control" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto', minWidth: 140, cursor: 'pointer' }}>
            <option value="">Semua Role</option>
            <option value="Employee">Employee Only</option>
            <option value="Admin">Admin Only</option>
          </select>
          <div className="admin-card-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={handleAdd} style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)' }}>
              <i className="bi bi-person-plus-fill" style={{ marginRight: 6 }}></i> Tambah Karyawan
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Email</th>
                <th>Jabatan</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>Memuat data karyawan...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ditemukan</td></tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={u.profile_pic_url || '/img/profile.png'} alt="P" className="avatar avatar-sm" style={{ objectFit: 'cover' }} />
                        <div className="user-cell-info" style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="user-cell-name" style={{ fontWeight: 800 }}>{u.name}</span>
                          <span className="user-cell-role" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.role}</span>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.position}</td>
                    <td>
                      <span className={`status-chip ${u.status === 'Aktif' ? 'chip-ok' : 'chip-warn'}`}>{u.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => handleEdit(u)} title="Edit"><i className="bi bi-pencil-fill"></i></button>
                        <button className={`btn btn-sm ${u.status === 'Aktif' ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(u.user_id, u.status)} title={u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}><i className={`bi ${u.status === 'Aktif' ? 'bi-person-dash-fill' : 'bi-person-check-fill'}`}></i></button>
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
        <div className="overlay reg-modal-overlay">
          <div className="reg-modal-container">
            <div className="reg-modal-card border-animated-modal" style={{ maxWidth: 480, width: '100%' }}>
              <div className="card-border-glow"></div>
              <button className="reg-modal-close" onClick={() => setIsModalOpen(false)} type="button">&times;</button>

              <div className="form-header" style={{ marginBottom: 24, textAlign: 'left', position: 'relative', zIndex: 2 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)', margin: 0 }}>
                  {form.user_id ? 'Edit Karyawan' : 'Tambah Karyawan'}
                </h2>
              </div>

              <form onSubmit={saveUser} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 2 }}>
                <div className="reg-avatar-upload-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer', marginBottom: 8 }}>
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <div className="reg-avatar-preview" style={{ width: 84, height: 84, borderRadius: '50%', border: '2px solid var(--primary)', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-deep)', transition: 'all var(--transition)', boxShadow: 'var(--shadow-neu-inset)' }}>
                      <img src={avatarPreview} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Preview" />
                    </div>
                    <div style={{ position: 'absolute', bottom: 20, right: -4, background: 'var(--primary)', color: '#000', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-modal)' }}>
                       <i className="bi bi-camera-fill" style={{ fontSize: 12 }}></i>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>Klik ikon kamera untuk ganti foto</span>
                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>NAMA LENGKAP</label>
                  <div className="input-wrap no-icon">
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>EMAIL</label>
                  <div className="input-wrap no-icon">
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>PIN / PASSWORD</label>
                  <div className="input-wrap no-icon">
                    <input type="text" value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} placeholder="Kosongkan jika tidak diubah" />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>JABATAN</label>
                  <div className="input-wrap no-icon">
                    <input type="text" required value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>DIVISI</label>
                  <div className="input-wrap no-icon">
                    <select required value={form.division} onChange={e => setForm({ ...form, division: e.target.value })}>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 10, letterSpacing: '0.5px' }}>ROLE AKSES</label>
                  <div className="input-wrap no-icon">
                    <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: 50, fontWeight: 700 }}>Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
