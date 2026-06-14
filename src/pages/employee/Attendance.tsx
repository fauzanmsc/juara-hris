import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useOutletContext } from 'react-router-dom';
import { fetchApi } from '../../api';

const Attendance = () => {
  const navigate = useNavigate();
  const { toggleTheme, handleLogout, theme } = useOutletContext<any>();
  const [clockDate, setClockDate] = useState('');
  const [clockTime, setClockTime] = useState('');
  const [geoStatus, setGeoStatus] = useState('Mendeteksi lokasi...');
  const [geoDistance, setGeoDistance] = useState<React.ReactNode>('Meminta izin GPS');
  const [geoLoading, setGeoLoading] = useState(true);
  const [inRadius, setInRadius] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlipped, setIsFlipped] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);
  const [lockMsg, setLockMsg] = useState<{title: string, reason: string} | null>(null);
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
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

  const submitAttendance = async () => {
    if (!photo || !location || !inRadius || !config) return;
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
    }
  };

  const isSubmitDisabled = loading || !photo || !inRadius || !!lockMsg;

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NavLink to="/employee/beranda" className="back-btn"><i className="bi bi-arrow-left"></i></NavLink>
          <div className="header-info">
            <h2>Absensi</h2>
            <p id="headerSub">{attType === 'in' ? 'Siap Clock In' : 'Siap Clock Out'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 16, transition: 'all var(--transition)', cursor: 'pointer' }}>
            <i className={theme === 'dark' ? "bi bi-brightness-high-fill" : "bi bi-moon-stars-fill"}></i>
          </button>
          <button className="btn-logout" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Keluar</button>
        </div>
      </div>

      <div className="content">
        <div className="clock-widget fade-in">
        <div className="clock-time">{clockTime}</div>
        <div className="clock-date">{clockDate}</div>
      </div>

      {lockMsg && (
        <div className="lock-banner">
          <div className="lock-icon-wrap"><i className="bi bi-lock-fill"></i></div>
          <div className="lock-text">
            <strong>{lockMsg.title}</strong>
            <p>{lockMsg.reason}</p>
          </div>
        </div>
      )}

      <div className={`geo-widget ${geoLoading ? 'loading' : inRadius ? 'safe' : 'unsafe'}`}>
        <div className="geo-header">
          <span className="geo-label">Status Lokasi</span>
          <div className={`geo-dot ${geoLoading ? 'loading' : inRadius ? 'safe' : 'unsafe'}`}></div>
        </div>
        <div className="geo-main">
          <div className={`geo-icon ${geoLoading ? 'loading' : inRadius ? 'safe' : 'unsafe'}`}><i className={`bi ${geoLoading ? 'bi-broadcast' : inRadius ? 'bi-check-square-fill' : 'bi-x-square-fill'}`}></i></div>
          <div>
            <div className="geo-title">{geoStatus}</div>
            <div className="geo-distance">{geoDistance}</div>
          </div>
        </div>
      </div>

      {!lockMsg && (
        <div className="camera-card fade-in">
          <div className="camera-head">
            <span className="camera-label"><i className="bi bi-camera-fill"></i> &nbsp;FOTO SELFIE</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {!cameraActive && !photo && (
                <span className="camera-toggle" onClick={() => { if (inRadius) startCamera(facingMode); }} style={{ cursor: inRadius ? 'pointer' : 'not-allowed', opacity: inRadius ? 1 : 0.5 }}>Aktifkan Kamera</span>
              )}
              {cameraActive && (
                <>
                  <span className="camera-toggle" style={{ color: 'var(--success)' }}>On-Cam <i className="bi bi-check"></i></span>
                  <span className="camera-toggle" onClick={flipCamera} style={{ cursor: 'pointer', background: 'rgba(255,183,3,0.1)', padding: '2px 8px', borderRadius: 12, color: 'var(--primary)' }}><i className="bi bi-arrow-repeat"></i> Flip</span>
                </>
              )}
            </div>
          </div>
          <div className="camera-container">
            <video id="videoEl" ref={videoRef} autoPlay playsInline muted style={{ display: cameraActive ? 'block' : 'none', transform: `scaleX(${isFlipped ? -1 : 1})` }}></video>
            {photo && <img id="capturedImg" src={photo} alt="Selfie" style={{ transform: `scaleX(${isFlipped ? -1 : 1})` }} />}
            {cameraActive && <div className="face-guide" style={{ display: 'block' }}></div>}
            {!cameraActive && !photo && (
              <div className="camera-overlay" onClick={() => { if (inRadius) startCamera(facingMode); }} style={{ opacity: inRadius ? 1 : 0.5, cursor: inRadius ? 'pointer' : 'not-allowed' }}>
                <i className={inRadius ? "bi bi-camera" : "bi bi-camera-video-off"}></i>
                <p>{inRadius ? 'Klik untuk mengaktifkan kamera' : 'Kamera terkunci (Di Luar Jangkauan)'}</p>
              </div>
            )}
          </div>
          <div className="camera-actions">
            <button className="btn-capture" onClick={capturePhoto} disabled={!cameraActive}>
              <i className="bi bi-camera-fill"></i> Ambil Foto
            </button>
            {photo && (
              <button className="btn-retake" onClick={retakePhoto}><i className="bi bi-arrow-repeat"></i></button>
            )}
          </div>
        </div>
      )}

        <button className={`btn-clock ${attType === 'in' ? 'clock-in' : 'clock-out'}`} disabled={isSubmitDisabled} onClick={submitAttendance}>
          <i className={attType === 'in' ? 'bi bi-box-arrow-in-up' : 'bi bi-box-arrow-right'}></i>
          <span>{loading ? 'MEMPROSES...' : attType === 'in' ? 'CLOCK IN' : 'CLOCK OUT'}</span>
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </>
  );
};

export default Attendance;
