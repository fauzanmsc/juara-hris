import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';

const Holidays = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('getHolidays', {}, 'GET');
      if (res.success) setHolidays(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await fetchApi('deleteHoliday', { holiday_id: editId });
      }
      const res = await fetchApi('addHoliday', { start_date: startDate, end_date: endDate, description: desc });
      if (res.success) {
        alert('Hari libur disimpan');
        setEditId(null);
        setStartDate('');
        setEndDate('');
        setDesc('');
        loadData();
      } else {
        alert('Gagal menyimpan');
      }
    } catch (err) {
      alert('Error');
    }
  };

  const deleteHoliday = async (id: string) => {
    (window as any).showModalConfirm('Konfirmasi', 'Hapus hari libur ini?', async () => {
      try {
        const res = await fetchApi('deleteHoliday', { holiday_id: id });
        if (res.success) {
          loadData();
        } else {
          alert('Error');
        }
      } catch (err) {
        alert('Error');
      }
    });
  };

  const editHoliday = (h: any) => {
    setEditId(h.holiday_id);
    setStartDate(h.start_date);
    setEndDate(h.end_date || '');
    setDesc(h.description);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    for (let i = 0; i < 7; i++) {
      days.push(<div key={`d-${i}`} style={{ fontWeight: 700, fontSize: 11, padding: 8, color: 'var(--text-muted)' }}>{dayNames[i]}</div>);
    }

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`e-${i}`} style={{ padding: 8 }}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isHoliday = holidays.find(h => {
        const start = new Date(h.start_date);
        const end = h.end_date ? new Date(h.end_date) : start;
        const current = new Date(dateStr);
        return current >= start && current <= end;
      });

      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div key={`d-${dateStr}`} style={{ 
          padding: 8, 
          borderRadius: 8, 
          background: isHoliday ? 'rgba(239, 68, 68, 0.1)' : isToday ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          color: isHoliday ? 'var(--danger)' : isToday ? 'var(--primary)' : 'var(--text)',
          fontWeight: isHoliday || isToday ? 800 : 500,
          border: isToday ? '1px solid var(--primary)' : '1px solid transparent',
          cursor: 'default'
        }} title={isHoliday ? isHoliday.description : ''}>
          {d}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ margin: 0 }}><i className="bi bi-calendar3 text-primary" style={{ marginRight: 8 }}></i> Kalender</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
              else { setCurrentMonth(currentMonth - 1); }
            }}><i className="bi bi-chevron-left"></i></button>
            <span style={{ fontWeight: 800, width: 100, textAlign: 'center' }}>{monthNames[currentMonth]} {currentYear}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
              else { setCurrentMonth(currentMonth + 1); }
            }}><i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center' }}>
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 20 }}><i className="bi bi-calendar2-x-fill text-danger" style={{ marginRight: 8 }}></i> Hari Libur Operasional</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tanggal Mulai</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tanggal Selesai (Opsional)</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Keterangan Libur</label>
            <input type="text" className="form-control" placeholder="Contoh: Libur Lebaran" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ height: 42 }} onClick={saveHoliday}>
            <i className="bi bi-save"></i> {editId ? 'Simpan Perubahan' : 'Tambah'}
          </button>
          {editId && <button className="btn btn-ghost" style={{ height: 42 }} onClick={() => { setEditId(''); setStartDate(''); setEndDate(''); setDesc(''); }}>Batal Edit</button>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 16 }}><i className="bi bi-list-task text-primary" style={{ marginRight: 8 }}></i> Daftar Hari Libur</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? <div style={{ textAlign: 'center', padding: 20 }}>Memuat...</div> : 
               holidays.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Belum ada data</div> :
               holidays.map((h, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 12 }}>
                   <div>
                     <div style={{ fontWeight: 800 }}>{h.description}</div>
                     <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.start_date} {h.end_date && `s.d ${h.end_date}`}</div>
                   </div>
                   <div style={{ display: 'flex', gap: 8 }}>
                     <button className="btn btn-sm btn-ghost" onClick={() => editHoliday(h)}><i className="bi bi-pencil-square"></i></button>
                     <button className="btn btn-sm btn-ghost text-danger" onClick={() => deleteHoliday(h.id)}><i className="bi bi-trash"></i></button>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          
          <div>
            {renderCalendar()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holidays;
