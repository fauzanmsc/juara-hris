import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        sessionStorage.setItem('hris_user', JSON.stringify(data.user));
        // Redirect berdasarkan role
        if (data.user.role === 'Admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/beranda');
        }
      } else {
        setError(data.message || 'Email atau PIN salah.');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div className="left-panel" style={{ flex: 1, padding: '40px', background: 'var(--bg-deep)' }}>
        <h1>JEF GROUP HRIS</h1>
        <p>Sistem manajemen kehadiran modern.</p>
      </div>
      
      <div className="right-panel" style={{ flex: 1, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '400px' }}>
          <h2>Selamat Datang 👋</h2>
          <p>Masuk dengan email &amp; PIN karyawan Anda</p>
          
          {error && <div className="alert-box error" style={{ padding: '10px', background: 'rgba(255,0,0,0.1)', color: 'red', marginBottom: '20px' }}>{error}</div>}
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Email Karyawan</label>
            <input 
              type="email" 
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@jefgroup.id" 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>PIN / Password</label>
            <input 
              type="password" 
              className="form-control"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Masukkan PIN Anda" 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {loading ? 'MEMUAT...' : 'MASUK'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
