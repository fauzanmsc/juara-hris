import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { fetchApi } from '../../api';
import PageHeader from '../../components/PageHeader';

const Leave = () => {
  const { toggleTheme, handleLogout, theme } = useOutletContext<any>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'form';
  const [tab, setTab] = useState(initialTab);

  const [type, setType] = useState('Cuti');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tab === 'history') {
      loadHistory();
    }
  }, [tab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const userStr = localStorage.getItem('hris_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const res = await fetchApi('leaveHistory', { user_id: user.user_id }, 'GET');
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      e.target.value = '';
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setFileSize((selected.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const base64String = (ev.target.result as string).split(',')[1];
        setFileBase64(base64String);
      }
    };
    reader.readAsDataURL(selected);
  };

  const clearFile = () => {
    setFile(null);
    setFileBase64('');
    setFileName('');
    setFileSize('');
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return -1;
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff;
  };

  const isSubmittingRef = React.useRef(false);

  const submitLeave = async () => {
    if (isSubmittingRef.current) return;
    if (!startDate || !endDate || !reason) {
      alert('Harap lengkapi semua bidang');
      return;
    }
    
    isSubmittingRef.current = true;
    const days = calculateDays();
    if (days === null || days < 1) {
      alert('Tanggal selesai harus lebih besar atau sama dengan tanggal mulai');
      return;
    }

    if (type === 'Sakit' && !fileBase64) {
      alert('Dokumen pendukung (surat dokter) wajib dilampirkan untuk pengajuan Sakit');
      return;
    }

    setLoading(true);
    try {
      const userStr = localStorage.getItem('hris_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      let mimeType = '';
      if (file) {
        mimeType = file.type;
        if (!mimeType && fileName.endsWith('.rar')) mimeType = 'application/vnd.rar';
        if (!mimeType && fileName.endsWith('.zip')) mimeType = 'application/zip';
      }

      const res = await fetchApi('submitLeave', {
        user_id: user.user_id,
        type,
        start_date: startDate,
        end_date: endDate,
        reason,
        attachment_name: fileName,
        attachment_base64: fileBase64
      });

      if (res.success) {
        alert('Pengajuan berhasil dikirim!');
        setStartDate('');
        setEndDate('');
        setReason('');
        clearFile();
        setTab('history');
      } else {
        alert(res.message || 'Gagal mengirim pengajuan');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleTabClick = (t: string) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  const daysDiff = calculateDays();

  return (
    <>
      <PageHeader title="Pengajuan" />

      <div className="tabs">
        <div className={`tab-item ${tab === 'form' ? 'active' : ''}`} onClick={() => handleTabClick('form')}>Ajukan Baru</div>
        <div className={`tab-item ${tab === 'history' ? 'active' : ''}`} onClick={() => handleTabClick('history')}>Riwayat Ajuan</div>
      </div>

      <div style={{ padding: '24px 24px 100px 24px' }}>
        {tab === 'form' && (
          <div className="form-section active fade-in">
          <div className="info-note">
            <i className="bi bi-info-circle-fill"></i>
            Pengajuan yang disetujui akan otomatis mengunci tombol absensi pada tanggal yang dipilih.
          </div>

          <div className="form-group">
            <label className="form-label">Jenis Pengajuan</label>
            <div className="type-grid">
              <div className={`type-card ${type === 'Cuti' ? 'sel-cuti' : ''}`} onClick={() => setType('Cuti')}>
                <div className="type-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.08)', boxShadow: 'var(--shadow-neu-inset)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                  <i className="bi bi-calendar-check-fill" style={{ color: '#22C55E', fontSize: 20 }}></i>
                </div>
                <div className="type-name">Cuti</div>
                <div className="type-desc">Cuti tahunan</div>
              </div>
              <div className={`type-card ${type === 'Sakit' ? 'sel-cuti' : ''}`} onClick={() => setType('Sakit')}>
                <div className="type-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.06)', boxShadow: 'var(--shadow-neu-inset)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                  <i className="bi bi-heart-pulse-fill" style={{ color: '#EF4444', fontSize: 20 }}></i>
                </div>
                <div className="type-name">Sakit</div>
                <div className="type-desc">Butuh dokumen</div>
              </div>
              <div className={`type-card ${type === 'Izin' ? 'sel-cuti' : ''}`} onClick={() => setType('Izin')}>
                <div className="type-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.06)', boxShadow: 'var(--shadow-neu-inset)', border: '1px solid rgba(59, 130, 246, 0.12)' }}>
                  <i className="bi bi-file-earmark-text-fill" style={{ color: '#3B82F6', fontSize: 20 }}></i>
                </div>
                <div className="type-name">Izin</div>
                <div className="type-desc">Keperluan lain</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal Mulai</label>
            <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Selesai</label>
            <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            {daysDiff !== null && daysDiff > 0 && (
              <div className="date-range-info" style={{ marginTop: 8, fontSize: 12, color: 'var(--primary)' }}>
                Total durasi: <strong>{daysDiff} hari</strong>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Alasan / Keterangan</label>
            <textarea className="form-input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Jelaskan alasan pengajuan Anda..."></textarea>
          </div>

          {type === 'Sakit' && (
            <div className="form-group">
              <label className="form-label">Dokumen Pendukung <span style={{ color: 'var(--danger)' }}>*</span></label>
              {!file ? (
                <div className="upload-area" style={{ position: 'relative' }}>
                  <input type="file" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.zip,.rar" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                  <i className="bi bi-file-earmark-arrow-up"></i>
                  <div className="upload-text">Tap untuk pilih foto / dokumen<br /><span>dari kamera atau galeri</span></div>
                </div>
              ) : (
                <div className="upload-preview" style={{ display: 'flex' }}>
                  {file.type.startsWith('image/') && (
                    <img src={URL.createObjectURL(file)} alt="preview" />
                  )}
                  <div>
                    <strong style={{ fontSize: 13 }}>{fileName}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{fileSize}</div>
                  </div>
                  <span className="del-upload" onClick={clearFile}><i className="bi bi-x-circle-fill"></i></span>
                </div>
              )}
            </div>
          )}

          <button className="btn-submit" disabled={loading} onClick={submitLeave}>
            <i className="bi bi-send-fill"></i> {loading ? 'MEMPROSES...' : 'KIRIM PENGAJUAN'}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="form-section active fade-in">
          <div className="section-label">Riwayat Pengajuan</div>
          <div className="history-list">
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <i className="bi bi-hourglass-split" style={{ fontSize: 36, opacity: 0.4, display: 'block', marginBottom: 12 }}></i>
                Memuat riwayat...
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Belum ada riwayat pengajuan
              </div>
            ) : (
              history.map((h, i) => (
                <div className="history-item" key={i}>
                  <div className={`history-status status-${(h.status || 'pending').toLowerCase()}`}>{h.status || 'Pending'}</div>
                  <div className="history-header">
                    <h4>{h.leave_type || h.type || '-'}</h4>
                    <span>{h.start_date} — {h.end_date}</span>
                  </div>
                  <p>{h.reason || '-'}</p>
                  <div className="history-meta">
                    <span><i className="bi bi-calendar-event"></i> Diajukan: {h.created_at || h.start_date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Leave;
