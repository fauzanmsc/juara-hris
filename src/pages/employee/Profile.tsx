import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useOutletContext } from 'react-router-dom';
import { fetchApi } from '../../api';

const Profile = () => {
  const navigate = useNavigate();
  const { toggleTheme, handleLogout, theme, user } = useOutletContext<any>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password_pin: '',
    position: '',
    division: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password_pin: '', // Jangan tampilkan password asli ke field
        position: user.position || '',
        division: user.division || ''
      });
      if (user.profile_pic_url) {
        setPhotoPreview(user.profile_pic_url);
      }
    }
  }, [user]);

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG/PNG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
      setImgError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        user_id: user.user_id,
        name: formData.name,
        email: formData.email,
        password_pin: formData.password_pin || undefined, // Hanya kirim jika diisi
      };

      if (photoBase64) {
        payload.profile_pic_base64 = photoBase64.split(',')[1];
      }

      const res = await fetchApi('updateUser', payload);
      
      if (res.success) {
        alert('Profil berhasil diperbarui!');
        // Update local storage so other pages reflect changes immediately
        const updatedUser = { ...user, name: formData.name, email: formData.email };
        if (res.profile_pic_url) {
          updatedUser.profile_pic_url = res.profile_pic_url;
        }
        localStorage.setItem('hris_user', JSON.stringify(updatedUser));
        
        // Memaksa reload agar state context terupdate dengan user terbaru dari localStorage
        window.location.reload(); 
      } else {
        alert(res.message || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-deep)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <NavLink to="/employee/beranda" className="back-btn" style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 18, transition: 'all 0.3s' }}>
            <i className="bi bi-arrow-left"></i>
          </NavLink>
          <div className="header-info">
            <h2 style={{ fontSize: 22, margin: 0, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Profile</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 16, cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: 'var(--shadow-neu)' }}>
            <i className={theme === 'dark' ? "bi bi-moon-fill" : "bi bi-brightness-high-fill"}></i>
          </button>
          <button onClick={handleLogout} style={{ width: 40, height: 40, borderRadius: '50%', background: '#EF4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)', transition: 'all 0.3s' }}>
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px 100px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Foto Profil Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
          <div 
            onClick={handlePhotoClick}
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: '50%', 
              background: 'var(--bg-card)', 
              border: '2px dashed var(--border)', 
              position: 'relative', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}
          >
            {photoPreview && !imgError ? (
              <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
            ) : (
              <div style={{ fontSize: 40, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#F59E0B' }}>
                {user?.initial || <i className="bi bi-person-fill" style={{ fontSize: 40, color: '#111' }}></i>}
              </div>
            )}
            
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.6)', padding: '4px 0', textAlign: 'center' }}>
              <i className="bi bi-camera-fill" style={{ color: '#FFF', fontSize: 14 }}></i>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Ketuk foto untuk mengubah</div>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Nama Lengkap</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 18px', borderRadius: 16, color: 'var(--text)', fontSize: 15, outline: 'none', transition: 'all 0.3s' }}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 18px', borderRadius: 16, color: 'var(--text)', fontSize: 15, outline: 'none', transition: 'all 0.3s' }}
              placeholder="Masukkan alamat email"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Password / PIN Baru</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password_pin" 
                value={formData.password_pin} 
                onChange={handleChange} 
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 18px', borderRadius: 16, color: 'var(--text)', fontSize: 15, outline: 'none', transition: 'all 0.3s' }}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: 0 }}
              >
                <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Jabatan</label>
              <input 
                type="text" 
                value={formData.position} 
                disabled
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px 18px', borderRadius: 16, color: 'var(--text-muted)', fontSize: 15, opacity: 0.6 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Divisi</label>
              <input 
                type="text" 
                value={formData.division} 
                disabled
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px 18px', borderRadius: 16, color: 'var(--text-muted)', fontSize: 15, opacity: 0.6 }}
              />
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>Jabatan & Divisi hanya dapat diubah oleh Administrator.</div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: 10,
              width: '100%', 
              padding: 16, 
              borderRadius: 50, 
              background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', 
              color: loading ? 'var(--text-muted)' : '#111', 
              fontSize: 16, 
              fontWeight: 900, 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              boxShadow: loading ? 'none' : '0 8px 24px rgba(217, 119, 6, 0.4)', 
              textTransform: 'uppercase', 
              transition: 'all 0.3s' 
            }}
          >
            {loading ? (
              <span>MENYIMPAN...</span>
            ) : (
              <>
                <i className="bi bi-save2-fill" style={{ fontSize: 18 }}></i>
                <span>SIMPAN PERUBAHAN</span>
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default Profile;
