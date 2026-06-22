import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useOutletContext } from 'react-router-dom';
import { fetchApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import logoWhite from '../../assets/juara-hris-logo-white.png';
import logoBlack from '../../assets/juara-hris-logo-black.png';

const Attendance = () => {
  const navigate = useNavigate();
  const { toggleTheme, handleLogout, theme } = useOutletContext<any>();
  const [clockDate, setClockDate] = useState('');
  const [clockTime, setClockTime] = useState('');
  const [geoStatus, setGeoStatus] = useState('Mendeteksi lokasi...');
  const [geoDistance, setGeoDistance] = useState<React.ReactNode>('Meminta izin GPS');
  const [geoLoading, setGeoLoading] = useState(true);
  const [inRadius, setInRadius] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlipped, setIsFlipped] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);
  const [lockMsg, setLockMsg] = useState<{ title: string, reason: string } | null>(null);
  const [attType, setAttType] = useState<'in' | 'out'>('in');

  useEffect(() => {
    // Clock
    const updateTime = () => {
      const now = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      setClockDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
      setClockTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [config, setConfig] = useState<any>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) *
      Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const userStr = localStorage.getItem('hris_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        const res = await fetchApi('preflight', { user_id: user.user_id }, 'GET');
        if (res.config) setConfig(res.config);

        if (!res.success) {
          setLockMsg({ title: res.lock_type || 'Absensi Terkunci', reason: res.message || 'Anda tidak dapat absen saat ini' });
        } else {
          setAttType(res.has_clocked_in && !res.has_clocked_out ? 'out' : 'in');
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadStatus();
  }, []);

  useEffect(() => {
    if (!config) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });

          const officeLat = parseFloat(config.office_latitude || 0);
          const officeLng = parseFloat(config.office_longitude || 0);
          const maxRadius = parseFloat(config.max_radius_meters || 100);
          const radiusEnabled = config.radius_enabled !== 'false';

          const dist = Math.round(getDistance(lat, lng, officeLat, officeLng));
          setGeoLoading(false);

          if (!radiusEnabled || dist <= maxRadius) {
            setGeoStatus(radiusEnabled ? 'Anda berada di area kantor' : 'Lokasi Bebas (Radius Nonaktif)');
            setGeoDistance(
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>Jarak dari kantor: <strong>{dist} meter</strong></div>
                {radiusEnabled ? (
                  <div style={{ color: 'var(--text-muted)' }}>Maksimal radius: <strong>{maxRadius} meter</strong></div>
                ) : (
                  <div style={{ color: 'var(--success)', fontSize: 11 }}>Batasan Radius Dinonaktifkan</div>
                )}
              </div>
            );
            setInRadius(true);
          } else {
            setGeoStatus('Di Luar Jangkauan');
            setGeoDistance(
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>Jarak dari kantor: <strong>{dist} meter</strong></div>
                <div style={{ color: 'var(--text-muted)' }}>Maksimal radius: <strong>{maxRadius} meter</strong></div>
              </div>
            );
            setInRadius(false);
          }
        },
        () => {
          setGeoLoading(false);
          setGeoStatus('Akses Lokasi Ditolak');
          setGeoDistance('Harap izinkan GPS pada browser');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoLoading(false);
      setGeoStatus('GPS tidak didukung');
    }

    return () => stopCamera();
  }, [config]);

  const startCamera = async (mode = facingMode) => {
    if (!inRadius) return alert('Kamera terkunci: Lokasi Anda berada di luar radius absensi.');
    try {
      stopCamera();
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Play prevented:", e));
      }
      streamRef.current = stream;
      setCameraActive(true);
      setPhoto(null);
    } catch (err) {
      alert('Gagal mengakses kamera. Harap izinkan akses kamera.');
    }
  };

  const flipCamera = () => {
    if (hasMultipleCameras) {
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newMode);
      setIsFlipped(newMode === 'user');
      startCamera(newMode);
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Fallback if videoWidth is 0
      const vw = video.videoWidth || video.clientWidth || 480;
      const vh = video.videoHeight || video.clientHeight || 640;

      canvas.width = vw;
      canvas.height = vh;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, vw, vh);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        setCameraActive(false);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const isSubmittingRef = useRef(false);

  const submitAttendance = async () => {
    if (isSubmittingRef.current) return;
    if (!photo) {
      alert('Harap ambil foto terlebih dahulu');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const userStr = localStorage.getItem('hris_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const n = new Date();
      const pad = (v: number) => String(v).padStart(2, '0');
      const clientTime = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;

      const officeLat = parseFloat(config.office_latitude || 0);
      const officeLng = parseFloat(config.office_longitude || 0);
      const dist = Math.round(getDistance(location.lat, location.lng, officeLat, officeLng));

      const res = await fetchApi(attType === 'in' ? 'clockIn' : 'clockOut', {
        user_id: user.user_id,
        lat: location.lat,
        lng: location.lng,
        office_lat: officeLat,
        office_lng: officeLng,
        distance_meters: dist,
        photo_base64: photo.split(',')[1],
        client_time: clientTime
      });

      if (res.success) {
        alert(res.message || 'Absensi berhasil!');
        navigate('/employee/beranda');
      } else {
        alert(res.message || 'Gagal absen');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const isSubmitDisabled = loading || !photo || !inRadius || !!lockMsg;

  return (
    <>
      <PageHeader title="Absensi" />

      <div style={{ padding: '24px 24px 100px 24px', position: 'relative' }}>
        {/* Waktu Saat Ini Golden Card */}
        <div className="fade-in" style={{ textAlign: 'center', padding: '16px 16px', marginBottom: 24, position: 'relative', zIndex: 10, background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', borderRadius: 24, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <i className="bi bi-clock"></i> Waktu Saat Ini
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 56, fontWeight: 900, color: '#111', letterSpacing: '-2px', marginBottom: 12, lineHeight: 1 }}>{clockTime.replace(/:/g, '.')}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{clockDate}</div>
        </div>

        {lockMsg && (
          <div className="golden-menu-card mb-4" style={{ border: '1px solid #EF4444', background: 'rgba(239, 68, 68, 0.05)', marginBottom: 20 }}>
            <div className="golden-menu-icon" style={{ background: '#EF4444', color: '#FFF' }}><i className="bi bi-lock-fill"></i></div>
            <div>
              <strong style={{ fontSize: 14 }}>{lockMsg.title}</strong>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{lockMsg.reason}</p>
            </div>
          </div>
        )}

        {!lockMsg && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: 0, overflow: 'hidden', marginBottom: 24, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}><i className="bi bi-person-bounding-box" style={{ color: '#F59E0B' }}></i> Foto Selfie</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!cameraActive && !photo && (
                  <span onClick={() => { if (inRadius) startCamera(facingMode); }} style={{ cursor: inRadius ? 'pointer' : 'not-allowed', opacity: inRadius ? 1 : 0.5, background: 'rgba(128,128,128,0.1)', color: 'var(--text)', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600 }}>Aktifkan Kamera</span>
                )}
                {cameraActive && (
                  <>
                    <span onClick={stopCamera} style={{ cursor: 'pointer', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '50%', color: '#EF4444', fontSize: 14 }} title="Matikan Kamera"><i className="bi bi-camera-video-off"></i></span>
                    <span onClick={flipCamera} style={{ cursor: 'pointer', background: 'rgba(255,183,3,0.1)', padding: '6px 10px', borderRadius: '50%', color: '#F59E0B', fontSize: 14 }} title="Putar Kamera"><i className="bi bi-arrow-repeat"></i></span>
                  </>
                )}
              </div>
            </div>

            <div className="camera-container" style={{ borderRadius: 16, background: '#000', minHeight: 300, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', width: 'calc(100% - 32px)' }}>
              <video id="videoEl" ref={videoRef} autoPlay playsInline muted style={{ display: cameraActive ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', transform: `scaleX(${isFlipped ? -1 : 1})` }}></video>
              {photo && <img id="capturedImg" src={photo} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scaleX(${isFlipped ? -1 : 1})` }} />}
              {cameraActive && <div className="face-guide" style={{ display: 'block' }}></div>}
              {!cameraActive && !photo && (
                <div className="camera-overlay" onClick={() => { if (inRadius) startCamera(facingMode); }} style={{ opacity: inRadius ? 1 : 0.5, cursor: inRadius ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
                  <i className={inRadius ? "bi bi-camera" : "bi bi-camera-video-off"} style={{ fontSize: 44, marginBottom: 12, color: '#9CA3AF' }}></i>
                  <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>{inRadius ? 'Klik untuk mengaktifkan kamera' : 'Kamera terkunci (Di Luar Jangkauan)'}</p>
                </div>
              )}
            </div>

            <div style={{ padding: '24px 16px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={capturePhoto} disabled={!cameraActive} style={{ flex: 1, padding: 16, borderRadius: 50, background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', color: '#111', fontSize: 15, fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: cameraActive ? 1 : 0.5, cursor: cameraActive ? 'pointer' : 'not-allowed', boxShadow: '0 8px 24px rgba(217, 119, 6, 0.3)' }}>
                <i className="bi bi-camera"></i> Ambil Foto
              </button>
              {photo && (
                <button onClick={retakePhoto} title="Ambil Ulang Foto" style={{ background: 'rgba(255, 183, 3, 0.1)', border: 'none', color: '#F59E0B', fontSize: 20, cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
                  <i className="bi bi-arrow-repeat"></i>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="fade-in" style={{ marginBottom: 24, padding: 20, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Status Lokasi</span>
            <div style={{ width: 10, height: 10, background: geoLoading ? '#9CA3AF' : inRadius ? '#10B981' : '#EF4444', borderRadius: '50%' }}></div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, background: geoLoading ? 'rgba(255,255,255,0.1)' : inRadius ? '#22C55E' : '#EF4444', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, background: '#FFF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`bi ${geoLoading ? 'bi-broadcast' : inRadius ? 'bi-check' : 'bi-x'}`} style={{ fontSize: 24, fontWeight: 900, color: geoLoading ? '#9CA3AF' : inRadius ? '#22C55E' : '#EF4444' }}></i>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>{geoStatus}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{geoDistance}</div>
            </div>
          </div>
        </div>

        <button disabled={isSubmitDisabled} onClick={submitAttendance} style={{ width: '100%', padding: 20, borderRadius: 50, background: isSubmitDisabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)', color: isSubmitDisabled ? 'var(--text-muted)' : '#111', fontSize: 18, fontWeight: 900, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer', boxShadow: isSubmitDisabled ? 'none' : '0 12px 32px rgba(217, 119, 6, 0.4)', textTransform: 'uppercase', transition: 'all 0.3s' }}>
          <i className={attType === 'in' ? "bi bi-box-arrow-in-up" : "bi bi-box-arrow-up"} style={{ fontSize: 24, strokeWidth: 1 }}></i>
          <span>{loading ? 'MEMPROSES...' : (attType === 'in' ? 'CLOCK IN' : 'CLOCK OUT')}</span>
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </>
  );
};

export default Attendance;
