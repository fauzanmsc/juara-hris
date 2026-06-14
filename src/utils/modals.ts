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
            <div style="text-align:center; padding: 32px 24px; max-width: 320px; width: 90%; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1); animation: zoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position:relative; overflow:hidden;">
                <div style="position:absolute; top:0; left:0; right:0; height:4px; background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};"></div>
                <div style="position:relative; z-index:2;">
                    ${iconHTML}
                    <h3 style="font-size:18px; font-weight:800; margin-bottom:8px; font-family:var(--font-head); color:var(--text); letter-spacing: 0.5px;">${title}</h3>
                    <p style="font-size:13px; color:var(--text-muted); line-height:1.6; margin:0; font-weight: 500;">${message}</p>
                    ${extraBtnHTML ? `<div style="margin-top:20px;">${extraBtnHTML}</div>` : ''}
                </div>
            </div>
        `;

        let duration = 2500;
        if (type === 'error') duration = 3500;
        if (actionBtn) duration = 8000;

        setTimeout(() => {
            const el = document.getElementById('globalModalOverlay');
            if (el) {
                el.children[0].setAttribute('style', el.children[0].getAttribute('style') + ' animation: zoomOut 0.3s forwards;');
                el.style.transition = 'opacity 0.3s ease';
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 300);
            }
        }, duration);
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
