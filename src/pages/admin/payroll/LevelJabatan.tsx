import { useState, useEffect } from 'react';
import { fetchApi } from '../../../api';
import CurrencyInput from '../../../components/CurrencyInput';
import Pagination from '../../../components/Pagination';

const AdminLevelJabatan = () => {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ level_id: '', level_name: '', nominal: '' });
  const [isEdit, setIsEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedData = levels.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getLevels', {}, 'GET');
      if (res.success) {
        setLevels(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.level_name || !form.nominal) return alert('Lengkapi data level dan nominal');
    
    try {
      const action = isEdit ? 'updateLevel' : 'addLevel';
      const res = await fetchApi(action, {
        level_id: form.level_id,
        level_name: form.level_name,
        nominal: Number(form.nominal)
      });
      if (res.success) {
        alert(res.message);
        setForm({ level_id: '', level_name: '', nominal: '' });
        setIsEdit(false);
        loadData();
      } else {
        alert(res.message || 'Gagal menyimpan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan server');
    }
  };

  const handleEdit = (lvl: any) => {
    setForm({
      level_id: lvl.level_id,
      level_name: lvl.level_name,
      nominal: lvl.nominal
    });
    setIsEdit(true);
  };

  const handleDelete = async (level_id: string) => {
    if (!confirm('Yakin ingin menghapus level ini?')) return;
    try {
      const res = await fetchApi('deleteLevel', { level_id });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatRupiah = (angka: any) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };

  return (
    <div className="admin-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Level Jabatan &amp; Tunjangan</h1>
        <p className="page-subtitle">Kelola struktur level jabatan dan nominal tunjangannya</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20 }}>
        
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            <i className={`bi ${isEdit ? 'bi-pencil-square text-warning' : 'bi-plus-circle text-primary'}`} style={{ marginRight: 8 }}></i> 
            {isEdit ? 'Edit Level' : 'Tambah Level'}
          </h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nama Level</label>
              <input 
                type="text" 
                className="form-control" 
                value={form.level_name} 
                onChange={e => setForm({...form, level_name: e.target.value})} 
                placeholder="Contoh: Level 1" 
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nominal Tunjangan (Rp)</label>
              <CurrencyInput 
                className="form-control" 
                value={form.nominal} 
                onChange={val => setForm({...form, nominal: val})} 
                placeholder="Contoh: 1000000" 
                required 
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <i className="bi bi-save"></i> Simpan
              </button>
              {isEdit && (
                <button type="button" className="btn btn-danger btn-ghost" onClick={() => { setIsEdit(false); setForm({level_id:'', level_name:'', nominal:''}); }}>
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}><i className="bi bi-list-task text-primary" style={{ marginRight: 8 }}></i> Daftar Level Jabatan</h3>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table-compact">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Level ID</th>
                  <th style={{ textAlign: 'left' }}>Nama Level</th>
                  <th style={{ textAlign: 'right' }}>Nominal Tunjangan</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>Memuat...</td></tr> :
                 paginatedData.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>Tidak ada data</td></tr> :
                 paginatedData.map((lvl, i) => (
                   <tr key={i}>
                     <td><span className="badge badge-primary" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 4, fontSize: 11 }}>{lvl.level_id}</span></td>
                     <td style={{ fontWeight: 600 }}>{lvl.level_name}</td>
                     <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>{formatRupiah(lvl.nominal)}</td>
                     <td style={{ textAlign: 'center' }}>
                       <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                         <button className="btn btn-sm" onClick={() => handleEdit(lvl)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--info)' }}>
                           <i className="bi bi-pencil-fill"></i>
                         </button>
                         <button className="btn btn-sm text-danger" onClick={() => handleDelete(lvl.level_id)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                           <i className="bi bi-trash-fill"></i>
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            total={levels.length} 
            pageSize={pageSize} 
            currentPage={currentPage} 
            setPageSize={setPageSize} 
            setCurrentPage={setCurrentPage} 
            label="data level" 
          />
        </div>

      </div>
    </div>
  );
};

export default AdminLevelJabatan;
