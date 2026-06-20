import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../../api';

const ApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Zoom level for image viewer
  const [zoomLevel, setZoomLevel] = useState(1);
  const [forceIframe, setForceIframe] = useState(false);

  useEffect(() => {
    loadDetail();
    setForceIframe(false);
    setZoomLevel(1);
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

  const getViewerUrl = (url: string) => {
    let type: 'pdf' | 'image' = 'image'; // default to image to bypass Drive preview errors
    let id = '';

    if (url.includes('.pdf') || url.includes('/view')) type = 'pdf'; 
    
    let finalUrl = url;
    if (url.includes('drive.google.com/file/d/')) {
      const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch) id = idMatch[1];
    } else if (url.includes('drive.google.com/uc') || url.includes('id=')) {
      const idMatch = url.match(/id=([a-zA-Z0-9-_]+)/);
      if (idMatch) id = idMatch[1];
    }

    if (id) {
      if (type === 'image') {
        finalUrl = `https://lh3.googleusercontent.com/d/${id}`;
      } else {
        finalUrl = `https://drive.google.com/file/d/${id}/preview`;
      }
    }
    
    return { url: finalUrl, type, id, original: url };
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

  const viewer = detail.attachment_url ? getViewerUrl(detail.attachment_url) : null;
  
  let finalViewerType = viewer?.type;
  let finalViewerUrl = viewer?.url;

  if (viewer && forceIframe && viewer.id) {
    finalViewerType = 'pdf';
    finalViewerUrl = `https://drive.google.com/file/d/${viewer.id}/preview`;
  }

  return (
    <div className="fade-in" style={{ padding: '20px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/approval')} style={{ padding: '8px 12px' }}>
          <i className="bi bi-arrow-left"></i> Kembali
        </button>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Detail Pengajuan</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: viewer ? '1fr 1.2fr' : '1fr', gap: 30, alignItems: 'start' }}>
        {/* Kolom Kiri: Detail Pengajuan */}
        <div className="card" style={{ padding: 30, position: 'relative', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={detail.profile_pic_url || '/img/profile.png'} className="avatar" style={{ objectFit: 'cover', width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--border)' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} alt="" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{detail.user_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{detail.user_position || 'Karyawan'}</div>
              </div>
            </div>
            <span className={`status-chip ${detail.status === 'Approved' ? 'chip-ok' : detail.status === 'Rejected' ? 'chip-warn' : 'chip-empty'}`} style={{ fontSize: 14, padding: '6px 16px', borderRadius: 20 }}>
              {detail.status === 'Approved' ? <><i className="bi bi-check-circle-fill"></i> Disetujui</> : detail.status === 'Rejected' ? <><i className="bi bi-x-circle-fill"></i> Ditolak</> : <><i className="bi bi-clock-fill"></i> Menunggu Persetujuan</>}
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px 24px', marginBottom: 30 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-tag" style={{ marginRight: 8 }}></i>Jenis Pengajuan</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{detail.leave_type || detail.type}</div>

            <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-calendar-event" style={{ marginRight: 8 }}></i>Tanggal Mulai</div>
            <div style={{ fontWeight: 600 }}>{detail.start_date}</div>

            <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-calendar-check" style={{ marginRight: 8 }}></i>Tanggal Selesai</div>
            <div style={{ fontWeight: 600 }}>{detail.end_date}</div>

            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}><i className="bi bi-chat-left-text" style={{ marginRight: 8 }}></i>Catatan</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', lineHeight: 1.6 }}>
              {detail.reason || '-'}
            </div>
            
            {!viewer && (
              <>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, alignSelf: 'center' }}><i className="bi bi-paperclip" style={{ marginRight: 8 }}></i>Lampiran</div>
                <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Tidak ada dokumen terlampir</div>
              </>
            )}
          </div>

          {detail.status === 'Pending' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={() => updateStatus('Rejected')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 24px' }}>
                <i className="bi bi-x-lg" style={{ marginRight: 6 }}></i> Tolak
              </button>
              <button className="btn btn-primary" onClick={() => updateStatus('Approved')} style={{ padding: '10px 24px' }}>
                <i className="bi bi-check-lg" style={{ marginRight: 6 }}></i> Setujui Pengajuan
              </button>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Inline Document Viewer */}
        {viewer && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 600 }}>
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-file-earmark-text text-primary"></i> Dokumen Lampiran
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {finalViewerType === 'image' && (
                  <>
                    <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="btn btn-sm btn-ghost" title="Zoom Out"><i className="bi bi-zoom-out"></i></button>
                    <button onClick={() => setZoomLevel(1)} className="btn btn-sm btn-ghost" title="Reset Zoom"><i className="bi bi-arrows-fullscreen"></i></button>
                    <button onClick={() => setZoomLevel(z => z + 0.25)} className="btn btn-sm btn-ghost" title="Zoom In"><i className="bi bi-zoom-in"></i></button>
                  </>
                )}
                {viewer.id && (
                  <a href={`https://drive.google.com/uc?export=download&id=${viewer.id}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" title="Download Dokumen" style={{ marginLeft: 8 }}>
                    <i className="bi bi-download"></i> Download
                  </a>
                )}
                <a href={viewer.original} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" title="Buka di Tab Baru"><i className="bi bi-box-arrow-up-right"></i></a>
              </div>
            </div>
            <div style={{ flex: 1, background: '#121212', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {finalViewerType === 'image' ? (
                 <img 
                    src={finalViewerUrl} 
                    onError={() => setForceIframe(true)}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `scale(${zoomLevel})`, transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: 'center center' }} 
                    alt="Lampiran" 
                 />
              ) : (
                 <iframe src={finalViewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer"></iframe>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ApprovalDetail;
