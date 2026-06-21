import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getUsers', {}, 'GET');
      if (res.success && res.data) {
        const item = res.data.find((u: any) => String(u.user_id) === String(id));
        if (item) setDetail(item);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Memuat detail karyawan...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fade-in" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Data tidak ditemukan</h3>
        <button className="btn btn-primary" onClick={() => navigate('/admin/users')} style={{ marginTop: 20 }}>
          Kembali ke Karyawan
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '20px 40px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/users')} style={{ padding: '8px 12px' }}>
          <i className="bi bi-arrow-left"></i> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Detail Karyawan</h2>
      </div>

      <div className="card" style={{ padding: 30, position: 'relative', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={detail.profile_pic_url || '/img/profile.png'} className="avatar" style={{ objectFit: 'cover', width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--border)' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} alt="" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{detail.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'monospace', marginTop: 4 }}>ID: {detail.user_id}</div>
            </div>
          </div>
          <span className={`status-chip ${(detail.status === 'Aktif' || detail.status === 'Active') ? 'chip-ok' : 'chip-warn'}`} style={{ fontSize: 14, padding: '6px 16px', borderRadius: 20 }}>
             {(detail.status === 'Aktif' || detail.status === 'Active') ? <><i className="bi bi-check-circle-fill"></i> Aktif</> : <><i className="bi bi-power"></i> Nonaktif</>}
          </span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px 24px', marginBottom: 10 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-envelope" style={{ marginRight: 8 }}></i>Email</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{detail.email}</div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-diagram-3" style={{ marginRight: 8 }}></i>Divisi</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{detail.division || '-'}</div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-briefcase" style={{ marginRight: 8 }}></i>Jabatan</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{detail.position || '-'}</div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-shield-lock" style={{ marginRight: 8 }}></i>Role Sistem</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{detail.role || 'Employee'}</div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-key" style={{ marginRight: 8 }}></i>PIN Login</div>
          <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '2px' }}>{detail.pin || '******'}</div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
