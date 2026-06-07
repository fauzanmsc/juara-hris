import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../api';

// Assuming Chart.js is loaded globally
declare global {
  interface Window {
    Chart: any;
  }
}

const Positions = () => {
  const [positions, setPositions] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [posName, setPosName] = useState('');
  const [posDivision, setPosDivision] = useState('');
  const [divName, setDivName] = useState('');
  const [filterDivision, setFilterDivision] = useState('');

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [posRes, divRes] = await Promise.all([
        fetchApi('getPositions', {}, 'GET'),
        fetchApi('getDivisions', {}, 'GET')
      ]);
      if (posRes.success && divRes.success) {
        setPositions(posRes.data || []);
        setDivisions(divRes.data || []);
        renderChart(divRes.data || [], posRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (divs: any[], pos: any[]) => {
    if (!chartRef.current || !window.Chart) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#FFFFFF' : '#1E293B';
    const chartBorderColor = isDark ? '#13192E' : '#FFFFFF';

    const labels = divs.map(d => d.name || d.division);
    const data = divs.map(d => pos.filter(p => p.division === (d.name || d.division)).length);

    // generate random colors
    const bgColors = labels.map((_, i) => `hsl(${(i * 360) / labels.length}, 70%, 50%)`);

    chartInstance.current = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderColor: chartBorderColor,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true } }
        },
        cutout: '70%'
      }
    });
  };

  const addPosition = async () => {
    if (!posName || !posDivision) return alert('Lengkapi data');
    try {
      const res = await fetchApi('addPosition', { position: posName, division: posDivision });
      if (res.success) {
        alert('Jabatan ditambahkan');
        setPosName('');
        setPosDivision('');
        loadData();
      } else {
        alert('Gagal menambah');
      }
    } catch (err) {
      alert('Error koneksi');
    }
  };

  const addDivision = async () => {
    if (!divName) return alert('Lengkapi data');
    try {
      const res = await fetchApi('addDivision', { division: divName });
      if (res.success) {
        alert('Divisi ditambahkan');
        setDivName('');
        loadData();
      } else {
        alert('Gagal menambah');
      }
    } catch (err) {
      alert('Error koneksi');
    }
  };

  const deletePosition = async (name: string) => {
    (window as any).showModalConfirm('Konfirmasi', 'Hapus jabatan ini?', async () => {
      try {
        const res = await fetchApi('deletePosition', { position: name });
        if (res.success) loadData();
      } catch (err) {
        alert('Error');
      }
    });
  };

  const deleteDivision = async (name: string) => {
    (window as any).showModalConfirm('Konfirmasi', 'Hapus divisi ini?', async () => {
      try {
        const res = await fetchApi('deleteDivision', { division: name });
        if (res.success) loadData();
      } catch (err) {
        alert('Error');
      }
    });
  };

  const filteredPositions = filterDivision ? positions.filter(p => p.division === filterDivision) : positions;

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="positions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
        
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}><i className="bi bi-briefcase-fill text-primary" style={{ marginRight: 8 }}></i> Kelola Jabatan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nama Jabatan</label>
              <input type="text" className="form-control" value={posName} onChange={e => setPosName(e.target.value)} placeholder="Contoh: Senior Developer" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Divisi</label>
              <select className="form-control" value={posDivision} onChange={e => setPosDivision(e.target.value)}>
                <option value="" disabled>Pilih Divisi...</option>
                {divisions.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={addPosition}><i className="bi bi-plus-circle-fill"></i> Simpan Jabatan</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}><i className="bi bi-diagram-3-fill text-success" style={{ marginRight: 8 }}></i> Kelola Divisi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nama Divisi</label>
              <input type="text" className="form-control" value={divName} onChange={e => setDivName(e.target.value)} placeholder="Contoh: Marketing" />
            </div>
            <button className="btn btn-success" style={{ marginTop: 48 }} onClick={addDivision}><i className="bi bi-plus-circle-fill"></i> Simpan Divisi</button>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title"><i className="bi bi-pie-chart-fill text-warning" style={{ marginRight: 8 }}></i> Ringkasan Divisi &amp; Posisi</h3>
          <div style={{ position: 'relative', height: 200, width: '100%', marginTop: 16 }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}><i className="bi bi-list-task text-primary" style={{ marginRight: 8 }}></i> Daftar Jabatan</h3>
            <select className="form-control" style={{ width: 'auto' }} value={filterDivision} onChange={e => setFilterDivision(e.target.value)}>
              <option value="">Semua Divisi</option>
              {divisions.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table-compact">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Nama Jabatan</th>
                  <th style={{ textAlign: 'left' }}>Divisi</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={3} style={{ textAlign: 'center' }}>Memuat...</td></tr> :
                 filteredPositions.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center' }}>Tidak ada data</td></tr> :
                 filteredPositions.map((p, i) => (
                   <tr key={i}>
                     <td>{p.name}</td>
                     <td>{p.division}</td>
                     <td style={{ textAlign: 'center' }}><button className="btn btn-sm btn-ghost text-danger" onClick={() => deletePosition(p.id)}><i className="bi bi-trash"></i></button></td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}><i className="bi bi-list-stars text-success" style={{ marginRight: 8 }}></i> Daftar Divisi</h3>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table-compact">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Nama Divisi</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={2} style={{ textAlign: 'center' }}>Memuat...</td></tr> :
                 divisions.length === 0 ? <tr><td colSpan={2} style={{ textAlign: 'center' }}>Tidak ada data</td></tr> :
                 divisions.map((d, i) => (
                   <tr key={i}>
                     <td>{d.name}</td>
                     <td style={{ textAlign: 'center' }}><button className="btn btn-sm btn-ghost text-danger" onClick={() => deleteDivision(d.id)}><i className="bi bi-trash"></i></button></td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Positions;
