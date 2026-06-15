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
    
        const lowerTitle = title.toLowerCase();
        const lowerMsg = message.toLowerCase();
        const isDanger = lowerTitle.includes('keluar') || lowerTitle.includes('hapus') || lowerMsg.includes('hapus') || lowerMsg.includes('tolak');
        
        let iconClass = 'bi-question-circle';
        if (lowerTitle.includes('keluar')) iconClass = 'bi-box-arrow-right';
        else if (isDanger) iconClass = 'bi-trash3';

        const colorTheme = isDanger ? 'var(--danger)' : 'var(--primary)';
        const bgTheme = isDanger ? 'rgba(239, 68, 68, 0.12)' : 'var(--primary-glow)';
        const btnActionText = lowerTitle.includes('keluar') ? 'Keluar' : (isDanger ? 'Hapus' : 'Lanjutkan');

        overlay.innerHTML = `
            <div class="modal" style="text-align:center; padding: 32px 24px; max-width: 400px; width: min(400px, 95%); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); position:relative; overflow: visible; background: var(--bg-card); border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05); border: 1px solid var(--border);">
                <button onclick="document.getElementById('globalConfirmOverlay').remove()" style="position:absolute; top:16px; right:16px; z-index:10; background:transparent; border:none; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; font-size:22px; transition:all 0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-muted)'"><i class="bi bi-x"></i></button>
                <div style="position:relative; z-index:2;">
                    <div style="width:72px; height:72px; border-radius:50%; background:${bgTheme}; color:${colorTheme}; display:flex; align-items:center; justify-content:center; font-size:32px; margin: 0 auto 20px;">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <h3 style="font-size:22px; font-weight:700; margin-bottom:12px; font-family:var(--font-head); color:var(--text); letter-spacing: -0.5px;">${title}</h3>
                    <p style="font-size:15px; color:var(--text-muted); line-height:1.5; margin-bottom:32px; padding: 0 10px;">${message}</p>
                    <div style="display:flex; gap:12px; flex-direction: ${lowerTitle.includes('keluar') ? 'column' : 'row'};">
                        ${!lowerTitle.includes('keluar') ? `<button class="btn" onclick="document.getElementById('globalConfirmOverlay').remove()" style="flex:1; border-radius:12px; height:48px; background: var(--bg-deep); color: var(--text); border: 1px solid var(--border); font-weight: 600; font-size: 15px; cursor: pointer;">Batal</button>` : ''}
                        <button class="btn" id="confirmYesBtn" style="flex:1; border-radius:12px; height:48px; background: ${colorTheme}; color: white !important; border: none; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 4px 12px ${bgTheme};">${lowerTitle.includes('keluar') ? 'Ya, Keluar' : btnActionText}</button>
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
