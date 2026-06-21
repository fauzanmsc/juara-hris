import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api';

const RunPayroll = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // In a real scenario, this might call a specific 'getPayroll' endpoint
      // For now, we fetch users and simulate payroll based on their configured details
      const res = await fetchApi('getUsers', {}, 'GET');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka: any) => {
    const val = Number(angka) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const calculatePayroll = (u: any) => {
    const base = Number(u.base_salary) || 0;
    const pos = Number(u.position_allowance) || 0;
    const grade = Number(u.grade_allowance) || 0;
    const group = Number(u.group_allowance) || 0;
    
    const gross = base + pos + grade + group;

    const bpjsTk = Number(u.bpjs_tk) || 0;
    const bpjsKes = Number(u.bpjs_kes) || 0;
    const deductions = bpjsTk + bpjsKes;

    const net = gross - deductions;

    return { gross, deductions, net };
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (String(u.user_id)).toLowerCase().includes(search.toLowerCase())
  );

  const months = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  const handleGeneratePayslip = (u: any) => {
    alert(`Generate slip gaji untuk ${u.name} periode ${month}/${year} (Fitur segera hadir setelah backend disesuaikan).`);
  };

  const handleGenerateAll = () => {
    alert(`Memproses seluruh slip gaji untuk periode ${month}/${year} ...`);
  };

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="admin-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-calculator-fill text-success"></i> Run Payroll
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Kalkulasi dan Rekapitulasi Gaji Karyawan Bulanan.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', width: 100 }} />
          
          <button className="btn btn-primary" onClick={handleGenerateAll} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px' }}>
            <i className="bi bi-play-fill"></i> Proses Semua
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 50, padding: '10px 20px', width: '100%', maxWidth: 400 }}>
          <i className="bi bi-search text-muted" style={{ marginRight: 12 }}></i>
          <input 
            type="text" 
            placeholder="Cari nama atau ID karyawan..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', width: '100%', fontSize: 14 }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Bank & Rekening</th>
                <th>Total Pendapatan (Kotor)</th>
                <th>Total Potongan</th>
                <th>Gaji Bersih (Net)</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Tidak ada data</td></tr>
              ) : (
                filteredUsers.map((u, i) => {
                  const pay = calculatePayroll(u);
                  return (
                    <tr key={u.user_id || i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={u.profile_pic_url || '/img/profile.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as any).src = '/img/profile.png'; }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.position || 'Staff'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.bank_account || '-'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.bank_number || '-'}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatRupiah(pay.gross)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatRupiah(pay.deductions)}</td>
                      <td>
                        <span className="status-chip chip-info" style={{ fontSize: 14, padding: '4px 12px', fontWeight: 800 }}>
                          {formatRupiah(pay.net)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-sm" onClick={() => handleGeneratePayslip(u)} title="Cetak Slip Gaji" style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: 50, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0ea5e9', fontWeight: 600 }}>
                          <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: 14 }}></i> Slip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RunPayroll;
