import React from 'react';

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
  label?: string;
}

const Pagination: React.FC<PaginationProps> = ({ total, pageSize, currentPage, setPageSize, setCurrentPage, label = 'data' }) => {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIdx = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, total);
  
  return (
    <div className="pagination-footer" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-deep)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', fontSize: 13, color: 'var(--text-muted)', gap: 16 }}>
      <div>
        Menampilkan <strong style={{ color: 'var(--text)' }}>{total === 0 ? 0 : (pageSize >= total ? total : `${startIdx}-${endIdx}`)}</strong> dari <strong style={{ color: 'var(--text)' }}>{total}</strong> {label}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Tampilkan:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[10, 20, 50, 100].map(size => (
              <button
                key={size}
                onClick={() => { setPageSize(size); setCurrentPage(1); }}
                style={{
                  background: pageSize === size ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: pageSize === size ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: pageSize === size ? 600 : 400
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === 1 ? 'var(--border)' : 'var(--text)', cursor: currentPage === 1 ? 'default' : 'pointer' }}
            >
              <i className="bi bi-chevron-left" style={{ fontSize: 12 }}></i>
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>{currentPage} / {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === totalPages ? 'var(--border)' : 'var(--text)', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
            >
              <i className="bi bi-chevron-right" style={{ fontSize: 12 }}></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
