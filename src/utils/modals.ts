export const initModals = () => {
    (window as any).showModalAlert = function (title: string, message: string, type: 'info' | 'error' | 'warn' | 'success' = 'info', actionBtn: any = null) {
        let overlay = document.getElementById('globalModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'globalModalOverlay';
            overlay.className = 'overlay';
            overlay.style.zIndex = '99999';
            document.body.appendChild(overlay);
        }
    
        let iconHTML = '';
        if (type === 'error' || type === 'warn') {
            iconHTML = `<div style="width:60px; height:60px; border-radius:50%; background:var(--danger-soft); color:var(--danger); display:flex; align-items:center; justify-content:center; font-size:28px; margin: 0 auto 20px;"><i class="bi bi-exclamation-triangle-fill"></i></div>`;
        } else if (type === 'success') {
            iconHTML = `<div style="width:60px; height:60px; border-radius:50%; background:var(--success-soft); color:var(--success); display:flex; align-items:center; justify-content:center; font-size:28px; margin: 0 auto 20px;"><i class="bi bi-check-circle-fill"></i></div>`;
        } else {
            iconHTML = `<div style="width:60px; height:60px; border-radius:50%; background:rgba(59, 130, 246, 0.15); color:var(--info); display:flex; align-items:center; justify-content:center; font-size:28px; margin: 0 auto 20px;"><i class="bi bi-info-circle-fill"></i></div>`;
        }
    
        let extraBtnHTML = '';
        if (actionBtn) {
            extraBtnHTML = `<a href="${actionBtn.url}" target="_blank" class="btn btn-success btn-xl btn-neu-3d" style="width:100%; border-radius:50px; margin-bottom:12px; background:#2ec4b6 !important; border-color:#2ec4b6 !important; color:white !important; display:flex; align-items:center; justify-content:center; gap:8px;"><i class="bi bi-whatsapp"></i> ${actionBtn.text}</a>`;
        }
    
        overlay.innerHTML = `
            <div class="modal border-animated-modal" style="text-align:center; padding: 40px 30px; max-width: 400px; width: 95%; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); position:relative; max-height: calc(100vh - 48px); max-height: calc(100dvh - 48px); overflow-y: auto;">
                <div class="card-border-glow"></div>
                <button onclick="document.getElementById('globalModalOverlay').remove()" style="position:absolute; top:12px; right:12px; z-index:10; background:rgba(255,255,255,0.08); border:1px solid var(--border); border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; font-size:14px; transition:all 0.2s;"><i class="bi bi-x-lg"></i></button>
                <div style="position:relative; z-index:2;">
                    ${iconHTML}
                    <h3 style="font-size:20px; font-weight:800; margin-bottom:12px; font-family:var(--font-head); color:var(--text);">${title}</h3>
                    <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:24px;">${message}</p>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${extraBtnHTML}
                        <button class="btn btn-primary btn-xl btn-neu-3d" onclick="document.getElementById('globalModalOverlay').remove()" style="width:100%; border-radius:50px;">Tutup</button>
                    </div>
                </div>
            </div>
        `;
    };
    
    (window as any).showModalConfirm = function (title: string, message: string, onConfirm: () => void) {
        let overlay = document.getElementById('globalConfirmOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'globalConfirmOverlay';
            overlay.className = 'overlay';
            overlay.style.zIndex = '999999';
            document.body.appendChild(overlay);
        }
    
        overlay.innerHTML = `
            <div class="modal border-animated-modal" style="text-align:center; padding: 24px; max-width: 420px; width: min(420px,95%); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); position:relative; overflow: visible;">
                <div class="card-border-glow"></div>
                <button onclick="document.getElementById('globalConfirmOverlay').remove()" style="position:absolute; top:12px; right:12px; z-index:10; background:rgba(255,255,255,0.08); border:1px solid var(--border); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; font-size:14px; transition:all 0.2s;"><i class="bi bi-x-lg"></i></button>
                <div style="position:relative; z-index:2;">
                    <div style="width:64px; height:64px; border-radius:50%; background:rgba(239, 68, 68, 0.12); color:var(--danger); display:flex; align-items:center; justify-content:center; font-size:28px; margin: 0 auto 16px;">
                        <i class="bi bi-box-arrow-right"></i>
                    </div>
                    <h3 style="font-size:20px; font-weight:800; margin-bottom:8px; font-family:var(--font-head); color:var(--text);">${title}</h3>
                    <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:20px;">${message}</p>
                    <div style="display:flex; gap:12px;">
                        <button class="btn btn-ghost" onclick="document.getElementById('globalConfirmOverlay').remove()" style="flex:1; border-radius:12px; height:48px;">Batal</button>
                        <button class="btn btn-primary btn-neu-3d" id="confirmYesBtn" style="flex:1; border-radius:12px; height:48px; background:linear-gradient(135deg, var(--danger), #dc2626); color:white !important; border:none; cursor:pointer;">Keluar</button>
                    </div>
                </div>
            </div>
        `;
    
        const confirmBtn = document.getElementById('confirmYesBtn');
        if (confirmBtn) {
            confirmBtn.onclick = function () {
                overlay?.remove();
                onConfirm();
            };
        }
    };

    // Override global alert
    window.alert = function(msg: string) {
        let type: 'info' | 'error' | 'warn' | 'success' = 'info';
        if (msg.toLowerCase().includes('berhasil') || msg.toLowerCase().includes('disimpan')) {
            type = 'success';
        } else if (msg.toLowerCase().includes('gagal') || msg.toLowerCase().includes('error') || msg.toLowerCase().includes('wajib') || msg.toLowerCase().includes('salah')) {
            type = 'error';
        }
        (window as any).showModalAlert('Informasi', msg, type);
    };
};
