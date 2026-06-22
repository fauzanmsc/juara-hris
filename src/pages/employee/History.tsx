import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchApi } from '../../api';
import PageHeader from '../../components/PageHeader';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return { day: '', date: '' };
  const [y, m, d] = dateStr.split('-');
  const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return { day: DAYS[dt.getDay()], date: `${d} ${MONTHS[parseInt(m) - 1]} ${y}` };
};

const parseTime = (val: any) => {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : str;
};

const History = () => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem('hris_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        const res = await fetchApi('getAttendance', { user_id: user.user_id }, 'GET');
        if (res.success) {
          // API returns { records: [...] } which api.ts normalizes to res.data
          setHistory(res.data || res.records || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const getFilteredHistory = () => {
    if (filter === 'all') return history;
    if (filter === 'on-time') return history.filter(h => h.status_in !== 'Terlambat' && h.status_in);
    if (filter === 'late') return history.filter(h => h.status_in === 'Terlambat');
    return history;
  };

  const filteredHistory = getFilteredHistory();

  return (
    <>
      <PageHeader title="Riwayat Kehadiran" />

      <div style={{ padding: '24px 24px 100px 24px' }}>
        <div className="filter-chips">
        <div className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Semua</div>
        <div className={`filter-chip ${filter === 'on-time' ? 'active' : ''}`} onClick={() => setFilter('on-time')}>Tepat Waktu</div>
        <div className={`filter-chip ${filter === 'late' ? 'active' : ''}`} onClick={() => setFilter('late')}>Terlambat</div>
      </div>

      <div className="section-label">Riwayat Kehadiran</div>
      <div className="history-list fade-in">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
            <p>Memuat riwayat kehadiran...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-calendar-x"></i>
            <h4>Tidak ada data</h4>
            <p>Tidak ada riwayat kehadiran ditemukan</p>
          </div>
        ) : (
          filteredHistory.map((r, i) => {
            const { day, date } = formatDateDisplay(r.date);
            const hasOut = !!r.clock_out_time;
            const statusCls = r.status_in === 'Terlambat' ? 's-late' : r.status_in ? 's-ok' : 's-empty';
            const statusTxt = r.status_in || 'Belum Absen';
            const inTime = parseTime(r.clock_in_time) || '--:--';
            const outTime = hasOut ? (parseTime(r.clock_out_time) || '--:--') : '--:--';
            const inStatusCls = r.clock_in_time ? (r.status_in === 'Terlambat' ? 'status-danger' : 'status-success') : '';

            return (
              <div key={i} className="history-item">
                <div className="history-header">
                  <div>
                    <div className="history-date">{day}, {date}</div>
                  </div>
                  <span className={`status-badge ${statusCls}`}>{statusTxt}</span>
                </div>
                <div className="history-times">
                  <div className={`time-block block-in ${inStatusCls}`}>
                    <div className="time-lbl">Masuk</div>
                    <div className={`time-val ${r.clock_in_time ? '' : 'empty'}`}>{inTime}</div>
                  </div>
                  <div className="time-block block-out">
                    <div className="time-lbl">Pulang</div>
                    <div className={`time-val ${hasOut ? '' : 'empty'}`}>{outTime}</div>
                  </div>
                </div>
                {r.notes && <div className="history-notes"><i className="bi bi-chat-left-text"></i>{r.notes}</div>}
              </div>
            );
          })
        )}
      </div>
      </div>
    </>
  );
};

export default History;
