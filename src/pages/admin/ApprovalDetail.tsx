import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../../api';

const ApprovalDetail = () => {
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
      const res = await fetchApi('getPendingLeaves', {}, 'GET');
      if (res.success && res.requests) {
        const item = res.requests.find((r: any) => r.request_id === id);
        if (item) setDetail(item);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    (window as any).showModalConfirm('Konfirmasi', `Yakin ingin ${newStatus.toLowerCase()} pengajuan ini?`, async () => {
      try {
        const userStr = localStorage.getItem('hris_user');
        const user = userStr ? JSON.parse(userStr) : { name: 'Admin' };
        const res = await fetchApi('decideLeave', { request_id: id, status: newStatus, approved_by: user.name });
        if (res.success) {
          loadDetail();
        } else {
          alert('Gagal memproses persetujuan');
        }
      } catch (err) {
        alert('Error koneksi');
      }
    });
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Memuat detail pengajuan...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fade-in" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Data tidak ditemukan</h3>
        <button className="btn btn-primary" onClick={() => navigate('/admin/approval')} style={{ marginTop: 20 }}>
          Kembali ke Persetujuan
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/approval')} style={{ padding: '8px 12px' }}>
          <i className="bi bi-arrow-left"></i> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Detail Pengajuan</h2>
      </div>

      <div className="card" style={{ padding: 30, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 30, right: 30 }}>
          <span className={`status-chip ${detail.status === 'Approved' ? 'chip-ok' : detail.status === 'Rejected' ? 'chip-warn' : 'chip-empty'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
            {detail.status === 'Approved' ? 'Disetujui' : detail.status === 'Rejected' ? 'Ditolak' : 'Menunggu Persetujuan'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px 24px', marginBottom: 30, marginTop: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nama Karyawan</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={detail.profile_pic_url || '/img/profile.png'} className="avatar avatar-sm" style={{ objectFit: 'cover', width: 36, height: 36, borderRadius: '50%' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} alt="" />
            <div style={{ fontWeight: 700, fontSize: 16 }}>{detail.user_name}</div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Jenis Pengajuan</div>
          <div style={{ fontWeight: 600 }}>{detail.leave_type || detail.type}</div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tanggal Mulai</div>
          <div style={{ fontWeight: 600 }}>{detail.start_date}</div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tanggal Selesai</div>
          <div style={{ fontWeight: 600 }}>{detail.end_date}</div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Alasan / Catatan</div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
            {detail.reason || '-'}
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Dokumen Lampiran</div>
          <div>
            {detail.attachment_url ? (
              <a href={detail.attachment_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)' }}>
                <i className="bi bi-file-earmark-text text-primary"></i> Lihat Dokumen
              </a>
            ) : '-'}
          </div>
        </div>

        {detail.status === 'Pending' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-danger" onClick={() => updateStatus('Rejected')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <i className="bi bi-x-lg" style={{ marginRight: 6 }}></i> Tolak Pengajuan
            </button>
            <button className="btn btn-primary" onClick={() => updateStatus('Approved')} style={{ padding: '8px 24px' }}>
              <i className="bi bi-check-lg" style={{ marginRight: 6 }}></i> Setujui Pengajuan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalDetail;
