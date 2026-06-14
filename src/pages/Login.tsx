import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({ name: '', email: '', pin: '', position: '' });

  const [regPhotoPreview, setRegPhotoPreview] = useState('');
  const [regError, setRegError] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [waChatOpen, setWaChatOpen] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  
  const [theme, setTheme] = useState(localStorage.getItem('hris_theme') || 'dark');
  const [clockTime, setClockTime] = useState('00:00:00');
  const [clockDate, setClockDate] = useState('Memuat waktu...');
  const [typewriterText, setTypewriterText] = useState('');
  const [showSubText, setShowSubText] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hris_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setShowLoader(false);
    }, 1200);

    const timer = setInterval(() => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setClockDate(now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 1000);

    const originalH1 = `Human Capital <span class="hc-pulse-badge">⚡</span><br><span class="grad">HRIS Platform</span>`;
    let index = 0;
    const speed = 40;
    const typeH1 = () => {
      if (index < originalH1.length) {
        if (originalH1[index] === '<') {
          const tagEnd = originalH1.indexOf('>', index);
          if (tagEnd !== -1) {
            setTypewriterText(originalH1.substring(0, tagEnd + 1));
            index = tagEnd + 1;
          } else {
            setTypewriterText(originalH1.substring(0, index + 1));
            index++;
          }
        } else {
          setTypewriterText(originalH1.substring(0, index + 1));
          index++;
        }
        setTimeout(typeH1, speed);
      } else {
        setShowSubText(true);
      }
    };
    typeH1();

    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) {
      setError('Email dan PIN wajib diisi.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchApi('login', { email, password_pin: pin });
      if (data.success) {
        localStorage.setItem('hris_user', JSON.stringify(data.user));
        if ((window as any).showModalAlert) {
          (window as any).showModalAlert('Sukses', 'Login berhasil! Mengarahkan...', 'success');
        }
        setTimeout(() => {
          const overlay = document.getElementById('globalModalOverlay');
          if (overlay) overlay.remove();
          if (data.user.role === 'Admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/employee/beranda');
          }
        }, 1500);
      } else {
        setError(data.message || 'Email atau PIN salah.');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRegPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const sendWAMessage = () => {
    if (!waMessage.trim()) return alert('Tulis pesan Anda terlebih dahulu.');
    const waNum = '628123456789';
    const formattedMsg = `Hai Admin, ${waMessage.trim()}`;
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(formattedMsg)}`, '_blank');
    setWaMessage('');
    setWaChatOpen(false);
  };

  return (
    <>
      {showLoader && (
        <div id="pageLoader" style={{ position: 'fixed', inset: 0, background: 'var(--bg-deep)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.5s ease, visibility 0.5s ease', backdropFilter: 'blur(10px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>SINKRONISASI SISTEM...</p>
          </div>
        </div>
      )}

      <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode" style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 18, transition: 'all var(--transition)', cursor: 'pointer', zIndex: 100 }}>
        <i className={theme === 'dark' ? "bi bi-brightness-high" : "bi bi-moon-stars"}></i>
      </button>

      <div className="bg-wrap">
        <div className="bg-orb-1"></div>
        <div className="bg-orb-2"></div>
        <div className="bg-grid"></div>
      </div>

      <div className="left-panel">
        <div className="brand" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
          <img src="/img/logo-jef.png" alt="JEF GROUP" className="logo-dark" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />
          <img src="/img/logo-jef-light.png" alt="JEF GROUP" className="logo-light" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />
        </div>

        <div className="hero">
          <h1 className="animate-h1" dangerouslySetInnerHTML={{ __html: typewriterText }}></h1>
          <p className="animate-p" style={{ opacity: showSubText ? 1 : 0, transform: showSubText ? 'translateY(0)' : 'translateY(10px)' }}>Platform manajemen kehadiran karyawan berbasis Google Workspace untuk seluruh tim JEF Group.</p>

          <div className="login-clock-container fade-in-clock">
            <div className="login-clock-face">
              <div className="login-clock-time">{clockTime}</div>
              <div className="login-clock-date">{clockDate}</div>
            </div>
          </div>

          <div className="feature-list">
            <div className="feature-item"><div className="feature-dot"><i className="bi bi-geo-alt-fill"></i></div>Absensi dengan Geofencing &amp; Selfie</div>
            <div className="feature-item"><div className="feature-dot"><i className="bi bi-calendar-check-fill"></i></div>Manajemen Cuti, Sakit &amp; Izin</div>
            <div className="feature-item"><div className="feature-dot"><i className="bi bi-graph-up-arrow"></i></div>HR Dashboard &amp; Laporan Real-time</div>
            <div className="feature-item"><div className="feature-dot"><i className="bi bi-gear-fill"></i></div>Konfigurasi Dinamis</div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="brand mobile-brand" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
          <img src="/img/logo-jef.png" alt="JEF GROUP" className="logo-dark" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />
          <img src="/img/logo-jef-light.png" alt="JEF GROUP" className="logo-light" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />
        </div>

        <div id="loginFormSection" style={{ display: isRegistering ? 'none' : 'block' }}>
          <div className="form-header">
            <h2>Selamat Datang 👋</h2>
            <p>Masuk dengan email &amp; PIN karyawan Anda</p>
          </div>

          {error && (
            <div className="alert-box error" style={{ display: 'flex' }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
              <button className="alert-close-btn" onClick={() => setError('')} type="button">&times;</button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Karyawan</label>
            <div className="input-wrap">
              <i className="bi bi-envelope input-icon"></i>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@jefgroup.id" autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">PIN / Password</label>
            <div className="input-wrap">
              <i className="bi bi-shield-lock input-icon"></i>
              <input type={showPassword ? 'text' : 'password'} value={pin} onChange={e => setPin(e.target.value)} placeholder="Masukkan PIN Anda" autoComplete="current-password" maxLength={20} />
              <button className="toggle-pass" onClick={() => setShowPassword(!showPassword)} type="button">
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </button>
            </div>
          </div>

          <button className="btn-login btn-neu-3d" onClick={handleLogin} disabled={loading}>
            <span>{loading ? 'MEMUAT...' : 'MASUK'}</span>
          </button>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            Belum punya akses? <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); }} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Registrasi Karyawan</a>
          </div>
        </div>

        <div className="form-footer" style={{ lineHeight: 1.6, textAlign: 'center' }}>
          <div>JEF GROUP HRIS v2.0 &copy; 2026</div>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>Powered by Google Workspace</div>
        </div>
      </div>

      {isRegistering && (
        <div className="reg-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsRegistering(false); }}>
          <div className="reg-modal-container">
            <div className="reg-modal-card">
              <div className="card-border-glow"></div>
              <button className="reg-modal-close" onClick={() => setIsRegistering(false)} type="button">&times;</button>

              <div className="form-header" style={{ marginBottom: 20, textAlign: 'center' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)', margin: 0 }}>Registrasi Karyawan</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Lengkapi data diri Anda untuk akses HRIS Platform</p>
              </div>

              {regError && (
                <div className="alert-box error" style={{ display: 'flex' }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{regError}</span>
                  <button className="alert-close-btn" onClick={() => setRegError('')} type="button">&times;</button>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); alert('Registrasi belum diimplementasikan sepenuhnya di React.'); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="reg-avatar-upload-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer', marginBottom: 4 }}>
                  <label htmlFor="regPhoto" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="reg-avatar-preview" style={{ width: 84, height: 84, borderRadius: '50%', border: '3px dashed var(--primary)', padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-deep)', transition: 'all var(--transition)', boxShadow: 'var(--shadow-neu-inset)' }}>
                      {regPhotoPreview ? (
                        <img src={regPhotoPreview} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Preview" />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, color: 'var(--primary)' }}>
                          {regData.name ? regData.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'JG'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}><i className="bi bi-camera-fill"></i> Ubah Foto Profil</span>
                  </label>
                  <input type="file" id="regPhoto" accept="image/*" style={{ display: 'none' }} onChange={handleRegPhotoChange} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 11 }}>Nama Lengkap</label>
                  <div className="input-wrap">
                    <i className="bi bi-person input-icon"></i>
                    <input type="text" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} placeholder="Masukkan nama lengkap Anda" required />
                  </div>
                </div>

                <div className="grid-2-resp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: 0, padding: 0 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'left', fontSize: 11 }}>Email Karyawan</label>
                    <div className="input-wrap reg-email-wrap">
                      <i className="bi bi-envelope input-icon"></i>
                      <input type="text" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} placeholder="username" required />
                      <span className="reg-email-suffix">@jefgroup.id</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'left', fontSize: 11 }}>PIN Login (6 Digit)</label>
                    <div className="input-wrap">
                      <i className="bi bi-shield-lock input-icon"></i>
                      <input type={showRegPassword ? 'text' : 'password'} value={regData.pin} onChange={e => setRegData({...regData, pin: e.target.value})} placeholder="Buat PIN" required maxLength={6} pattern="\d{6}" inputMode="numeric" />
                      <button className="toggle-pass reg-toggle-pass" onClick={() => setShowRegPassword(!showRegPassword)} type="button">
                        <i className={showRegPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'left', fontSize: 11 }}>Jabatan (Position)</label>
                  <div className="input-wrap" style={{ position: 'relative' }}>
                    <i className="bi bi-briefcase input-icon"></i>
                    <select className="form-control reg-custom-select" value={regData.position} onChange={e => setRegData({...regData, position: e.target.value})} required>
                      <option value="" disabled>Pilih jabatan...</option>
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                    </select>
                    <i className="bi bi-chevron-down" style={{ position: 'absolute', right: 14, pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 12 }}></i>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12, marginTop: 8 }}>
                  <button className="btn btn-muted btn-neu-3d" type="button" onClick={() => { setRegData({name:'', email:'', pin:'', position:''}); setRegPhotoPreview(''); }} style={{ height: 42, borderRadius: 50, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--bg-deep)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    <i className="bi bi-arrow-counterclockwise"></i> Reset Data
                  </button>
                  <button className="btn-login btn-neu-3d" type="submit" style={{ margin: 0, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, borderRadius: 50 }}>
                    <span>DAFTAR SEKARANG</span>
                  </button>
                </div>
              </form>

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                Sudah punya akun? <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); }} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Masuk di sini</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="floating-cs" onClick={() => setWaChatOpen(true)} title="Hubungi CS (WhatsApp)">
        <div className="cs-pulse"></div>
        <i className="bi bi-whatsapp"></i>
        <span className="cs-tooltip">Live Chat Admin WA</span>
      </div>

      {waChatOpen && (
        <div className="wa-chat-popup">
          <div className="wa-chat-header">
            <div className="wa-chat-avatar"><i className="bi bi-person-fill-gear" style={{ fontSize: 18 }}></i></div>
            <div className="wa-chat-header-info">
              <h4>HC Support</h4>
              <p><span className="wa-chat-dot"></span> Online</p>
            </div>
            <button className="wa-chat-close" onClick={() => setWaChatOpen(false)}>&times;</button>
          </div>
          <div className="wa-chat-body">
            <p style={{ fontSize: 11, marginBottom: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>Hai! Tulis pesan Anda di bawah ini, kami akan langsung menghubungkan Anda ke WhatsApp Admin.</p>
            <textarea className="form-control" rows={3} value={waMessage} onChange={e => setWaMessage(e.target.value)} placeholder="Tulis pesan bantuan Anda..." style={{ resize: 'none', fontSize: 13, fontWeight: 600, marginBottom: 10, width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', padding: 8 }}></textarea>
            <button className="btn btn-success btn-neu-3d" onClick={sendWAMessage} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 38, borderRadius: 50, background: '#25d366', borderColor: '#25d366', color: '#000', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>
              <i className="bi bi-send-fill"></i> Kirim ke WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
