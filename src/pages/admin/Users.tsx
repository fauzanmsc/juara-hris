import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 150;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress as JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar'));
        img.src = e.target?.result as string;
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(f);
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
    setAvatarPreview(u.profile_pic_url || '/img/profile.png');
    setAvatarFile(null);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setForm({
      user_id: '',
      email: '',
      name: '',
      position: '',
      division: 'Umum',
      role: 'Employee',
      pin: ''
    });
    setAvatarPreview('/img/profile.png');
    setAvatarFile(null);
    setIsModalOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return alert('Nama dan Email wajib diisi');
    
    // Fallback if password_pin is empty when creating
    let pinVal = form.pin;
    if (!form.user_id && !pinVal) {
        pinVal = '123456';
    }

    setLoading(true);

    try {
      let base64Photo = undefined;
      if (avatarFile) {
        base64Photo = await getBase64(avatarFile);
      }

      const action = form.user_id ? 'updateUser' : 'addUser';
      const payload: any = {
        ...form,
        password_pin: pinVal
      };
      if (base64Photo) payload.profile_pic_base64 = base64Photo;

      const res = await fetchApi(action, payload);
      if (res.success) {
        setIsModalOpen(false);
        loadUsers();
      } else {
        alert(res.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = (currentStatus === 'Aktif' || currentStatus === 'Active') ? 'Nonaktif' : 'Aktif';
    (window as any).showModalConfirm('Konfirmasi', `Ubah status menjadi ${newStatus}?`, async () => {
      try {
        const res = await fetchApi('updateUserStatus', { user_id: id, status: newStatus });
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

  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const role = (user.role || 'Employee').toUpperCase();
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, typeof users>);

  const sortedRoles = Object.keys(groupedUsers).sort();

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
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>KARYAWAN</th>
                <th style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>EMAIL</th>
                <th style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>JABATAN</th>
                <th style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>STATUS</th>
                <th style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>Memuat data karyawan...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Tidak ditemukan</td></tr>
              ) : (
                sortedRoles.map(role => (
                  <React.Fragment key={role}>
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--bg-body)', paddingTop: 16, paddingBottom: 16, borderBottom: 'none' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="bi bi-people-fill"></i> {role} — <span style={{ opacity: 0.7 }}>{groupedUsers[role].length} Karyawan</span>
                        </span>
                      </td>
                    </tr>
                    {groupedUsers[role].map((u: any, i: number) => (
                      <tr key={u.user_id || i}>
                        <td>
                          <div className="user-cell" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={u.profile_pic_url || '/img/profile.png'} alt="P" className="avatar avatar-sm" style={{ objectFit: 'cover', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }} onClick={() => { setPreviewPhoto(u.profile_pic_url || '/img/profile.png'); setZoomLevel(1); }} />
                            <span className="user-cell-name" style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>{u.position}</td>
                        <td>
                          <span className={`status-chip ${(u.status === 'Aktif' || u.status === 'Active') ? 'chip-ok' : 'chip-warn'}`} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 50, background: (u.status === 'Aktif' || u.status === 'Active') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: (u.status === 'Aktif' || u.status === 'Active') ? 'var(--success)' : 'var(--danger)' }}>
                            {(u.status === 'Aktif' || u.status === 'Active') ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-sm" onClick={() => handleEdit(u)} title="Edit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 50, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                              <i className="bi bi-pencil-fill" style={{ fontSize: 12 }}></i>
                            </button>
                            <button className={`btn btn-sm ${(u.status === 'Aktif' || u.status === 'Active') ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(u.user_id, u.status)} style={{ borderRadius: 50, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, height: 32 }}>
                              <i className={`bi ${(u.status === 'Aktif' || u.status === 'Active') ? 'bi-power' : 'bi-check-circle-fill'}`} style={{ fontSize: 12 }}></i> {(u.status === 'Aktif' || u.status === 'Active') ? 'Nonaktif' : 'Aktif'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="overlay reg-modal-overlay">
          <div className="reg-modal-container">
            <div className="reg-modal-card border-animated-modal" style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div className="card-border-glow"></div>
              
              <div style={{ padding: '24px 32px 16px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
                <button className="reg-modal-close" onClick={() => setIsModalOpen(false)} type="button" style={{ top: 20, right: 20 }}>&times;</button>
                <div className="form-header" style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)', margin: 0 }}>
                    {form.user_id ? 'Edit Karyawan' : 'Tambah Karyawan'}
                  </h2>
                </div>
              </div>

              <div style={{ padding: '0 32px', overflowY: 'auto', flex: 1, position: 'relative', zIndex: 2 }}>
                <form id="userForm" onSubmit={saveUser} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
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
                </form>
              </div>

              <div style={{ padding: '16px 32px 24px', position: 'relative', zIndex: 2, flexShrink: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                  <button type="submit" form="userForm" className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: 50, fontWeight: 700 }}>Simpan</button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
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

export default Users;
