import { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../api';

// Assuming Leaflet is loaded globally
declare global {
  interface Window {
    L: any;
  }
}

const Config = () => {
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    latitude: '',
    longitude: '',
    radius: '50',
    radius_enabled: 'true',
    wday_start: '10:00',
    wday_end: '19:00',
    tolerance: '15',
    sat_start: '09:00',
    sat_end: '17:00',
    wa_admin: '',
    email_hrd: '',
    sunday_enabled: 'false'
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const circleInstance = useRef<any>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getConfig', {}, 'GET');
      if (res.success && (res.config || res.data)) {
        const d = res.config || res.data;
        setForm(prev => ({
          ...prev,
          latitude: d.office_latitude || prev.latitude,
          longitude: d.office_longitude || prev.longitude,
          radius: d.max_radius_meters || prev.radius,
          radius_enabled: d.radius_enabled || prev.radius_enabled,
          wday_start: d.weekday_start || prev.wday_start,
          wday_end: d.weekday_end || prev.wday_end,
          sat_start: d.saturday_start || prev.sat_start,
          sat_end: d.saturday_end || prev.sat_end,
          tolerance: d.tolerance_minutes || prev.tolerance,
          wa_admin: d.wa_admin || prev.wa_admin,
          email_hrd: d.email_hrd || prev.email_hrd,
          sunday_enabled: d.sunday_attendance_enabled || prev.sunday_enabled
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && window.L && mapRef.current) {
      initMap();
    }
  }, [loading, form.latitude, form.longitude, form.radius]);

  const initMap = () => {
    if (!window.L) return;
    
    const lat = parseFloat(form.latitude) || -6.2088;
    const lng = parseFloat(form.longitude) || 106.8456;
    const r = parseFloat(form.radius) || 50;

    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([lat, lng], 16);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      markerInstance.current = window.L.marker([lat, lng]).addTo(mapInstance.current);
      circleInstance.current = window.L.circle([lat, lng], {
        color: '#FFB703',
        fillColor: '#FFB703',
        fillOpacity: 0.2,
        radius: r
      }).addTo(mapInstance.current);
    } else {
      mapInstance.current.setView([lat, lng], 16);
      markerInstance.current.setLatLng([lat, lng]);
      circleInstance.current.setLatLng([lat, lng]);
      circleInstance.current.setRadius(r);
    }
  };

  const saveConfig = async () => {
    try {
      const payload = {
        office_latitude: form.latitude,
        office_longitude: form.longitude,
        max_radius_meters: form.radius,
        radius_enabled: form.radius_enabled,
        weekday_start: form.wday_start,
        weekday_end: form.wday_end,
        saturday_start: form.sat_start,
        saturday_end: form.sat_end,
        tolerance_minutes: form.tolerance,
        wa_admin: form.wa_admin,
        email_hrd: form.email_hrd,
        sunday_attendance_enabled: form.sunday_enabled
      };
      const res = await fetchApi('saveConfig', payload);
      if (res.success) {
        alert('Konfigurasi berhasil disimpan');
      } else {
        alert('Gagal menyimpan konfigurasi');
      }
    } catch (err) {
      alert('Error koneksi');
    }
  };

  if (loading) {
    return <div className="fade-in" style={{ padding: 30, textAlign: 'center' }}>Memuat konfigurasi...</div>;
  }

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 20 }}><i className="bi bi-sliders text-primary" style={{ marginRight: 8 }}></i> Pengaturan Sistem &amp; Jam Kerja</h3>
        
        <div className="grid-2-resp">
          {/* Geofence */}
          <div className="config-group" style={{ border: 'none', padding: 0, margin: 0 }}>
            <h4 style={{ marginBottom: 14 }}><i className="bi bi-geo-alt-fill text-primary" style={{ marginRight: 6 }}></i> Lokasi Kantor (Geofence)</h4>
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input type="text" className="form-control" placeholder="-6.2088" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input type="text" className="form-control" placeholder="106.8456" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Aktifkan Batasan Radius</label>
              <select className="form-control" value={form.radius_enabled} onChange={e => setForm({ ...form, radius_enabled: e.target.value })}>
                <option value="true">Aktif (Wajib dalam radius)</option>
                <option value="false">Nonaktif (Bebas lokasi)</option>
              </select>
            </div>
            <div className="form-group" style={{ opacity: form.radius_enabled === 'true' ? 1 : 0.5 }}>
              <label className="form-label">Radius Maksimal (meter)</label>
              <input type="number" className="form-control" value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })} disabled={form.radius_enabled !== 'true'} />
            </div>
            <div ref={mapRef} style={{ height: 180, borderRadius: 'var(--radius-md)', marginTop: 15, border: '1px solid var(--border)', boxShadow: 'var(--shadow-neu-inset)', zIndex: 1, opacity: form.radius_enabled === 'true' ? 1 : 0.5, pointerEvents: form.radius_enabled === 'true' ? 'auto' : 'none' }}></div>
          </div>

          {/* Jam Kerja */}
          <div className="config-group" style={{ border: 'none', padding: 0, margin: 0 }}>
            <h4 style={{ marginBottom: 14 }}><i className="bi bi-clock-fill text-primary" style={{ marginRight: 6 }}></i> Waktu Absensi</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Masuk (Sen-Jum)</label>
                <input type="time" className="form-control" value={form.wday_start} onChange={e => setForm({ ...form, wday_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Pulang (Sen-Jum)</label>
                <input type="time" className="form-control" value={form.wday_end} onChange={e => setForm({ ...form, wday_end: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Toleransi Keterlambatan (menit)</label>
              <input type="number" className="form-control" value={form.tolerance} onChange={e => setForm({ ...form, tolerance: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Masuk (Sabtu)</label>
                <input type="time" className="form-control" value={form.sat_start} onChange={e => setForm({ ...form, sat_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Pulang (Sabtu)</label>
                <input type="time" className="form-control" value={form.sat_end} onChange={e => setForm({ ...form, sat_end: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Absensi Hari Minggu</label>
              <select className="form-control" value={form.sunday_enabled} onChange={e => setForm({ ...form, sunday_enabled: e.target.value })}>
                <option value="false">Nonaktif (Libur Operasional)</option>
                <option value="true">Aktif (Dapat Absen di Hari Minggu)</option>
              </select>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveConfig} style={{ width: '100%', marginTop: 24, padding: 14, fontSize: 15 }}>
          <i className="bi bi-box-arrow-in-down" style={{ marginRight: 6 }}></i> Simpan Konfigurasi
        </button>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 20 }}><i className="bi bi-chat-dots-fill text-success" style={{ marginRight: 8 }}></i> Pengaturan Kontak &amp; HC</h3>
        <div className="grid-2-resp">
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp Admin</label>
            <input type="text" className="form-control" placeholder="Contoh: 628123456789" value={form.wa_admin} onChange={e => setForm({ ...form, wa_admin: e.target.value })} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Gunakan kode negara tanpa simbol + atau spasi.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Email HRD Utama</label>
            <input type="email" className="form-control" placeholder="Contoh: hrd@juara.id" value={form.email_hrd} onChange={e => setForm({ ...form, email_hrd: e.target.value })} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email resmi HRD untuk koordinasi data kehadiran.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={saveConfig} style={{ width: '100%', marginTop: 24, padding: 14, fontSize: 15 }}>
          <i className="bi bi-box-arrow-in-down" style={{ marginRight: 6 }}></i> Simpan Kontak
        </button>
      </div>
    </div>
  );
};

export default Config;
