// Gabungan script.js

// Decrypt Google Apps Script URL dynamically
const _e = "Y2V4ZS9jZV8zQWdMVnpoYXBmT0hpaUxZVkF1ZUhzcWx0a194UTluaE1yY0N5NnB4cVBYUjZDVDRPV05NLXpsdWJNWW1FVXdiY3lmS0Evcy9zb3JjYW0vbW9jLmVsZ29vZy50cGlyY3MvLzpzcHR0aA==";
window.APPS_SCRIPT_URL = atob(_e).split('').reverse().join('');
const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL;

// Clean Page & Subdirectory-Safe Routing Detection
const pathParts = window.location.pathname.split('/').filter(Boolean);
const lastPart = pathParts[pathParts.length - 1] || 'index.html';
const cleanedPage = lastPart.replace('.html', '').replace('.php', '');

let currentPage = cleanedPage + '.html';
if (window.location.pathname.includes('/admin/') || window.location.pathname.endsWith('/admin')) {
    currentPage = 'admin.html';
} else if (cleanedPage === 'employee' || cleanedPage === 'beranda' || window.location.pathname === '/employee' || window.location.pathname === '/employee/') {
    currentPage = 'employee.html';
} else if (cleanedPage === 'index' || cleanedPage === '') {
    currentPage = 'index.html';
}


const isInsideAdmin = window.location.pathname.includes('/admin/') || window.location.pathname.endsWith('/admin');
const isInsideEmployee = window.location.pathname.includes('/employee/') || window.location.pathname.endsWith('/employee');

(function setupViewportGuard() {
    const root = document.documentElement;
    let resizeTimer;

    const syncViewportSize = () => {
        const viewport = window.visualViewport;
        const height = Math.round(viewport?.height || window.innerHeight || root.clientHeight);
        const width = Math.round(viewport?.width || window.innerWidth || root.clientWidth);

        if (height) root.style.setProperty('--app-height', `${height}px`);
        if (width) root.style.setProperty('--app-width', `${width}px`);
    };

    const queueSync = () => {
        window.clearTimeout(resizeTimer);
        syncViewportSize();
        resizeTimer = window.setTimeout(syncViewportSize, 250);
    };

    syncViewportSize();
    window.addEventListener('resize', queueSync, { passive: true });
    window.addEventListener('orientationchange', queueSync, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', queueSync, { passive: true });
        window.visualViewport.addEventListener('scroll', queueSync, { passive: true });
    }

    const preventGestureZoom = event => event.preventDefault();
    document.addEventListener('gesturestart', preventGestureZoom, { passive: false });
    document.addEventListener('gesturechange', preventGestureZoom, { passive: false });
    document.addEventListener('gestureend', preventGestureZoom, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', event => {
        const now = Date.now();
        if (now - lastTouchEnd < 300) event.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
})();

window.getRedirectUrl = function (page) {
    if (page === 'index.html') page = 'index';
    else if (page === 'admin.html') page = 'admin';
    else if (page === 'employee.html') page = 'employee';
    else page = page.replace('.html', '').replace('.php', '');

    // Always use absolute paths for reliable navigation
    if (page === 'admin' || page === 'dashboard') return '/admin/dashboard.html';
    if (page === 'employee' || page === 'beranda') return '/employee/beranda.html';
    if (page === 'index') return '/index.html';

    if (isInsideAdmin || ['users', 'approval', 'attendance', 'leave-report', 'positions', 'tasks', 'holidays', 'config'].includes(page)) {
        return '/admin/' + page + '.html';
    }
    if (isInsideEmployee || ['attendance', 'history', 'leave', 'tasks', 'beranda'].includes(page)) {
        return '/employee/' + page + '.html';
    }
    return '/' + page + '.html';
};

window.renderAdminLayout = function () {
    const sidebarMount = document.getElementById('adminSidebarMount');
    const topbarMount = document.getElementById('adminTopbarMount');

    if (sidebarMount && !document.getElementById('sidebar')) {
        fetch('/admin/sidebar.html')
            .then(res => res.text())
            .then(html => {
                sidebarMount.innerHTML = html;
                const currentPath = window.location.pathname;
                sidebarMount.querySelectorAll('.sidebar-link').forEach(link => {
                    if (link.getAttribute('href') === currentPath) {
                        link.classList.add('active');
                    }
                });
                // Set topbar title from the active sidebar menu label (useful when loading pages directly)
                try {
                    const activeLink = sidebarMount.querySelector('.sidebar-link.active');
                    if (activeLink) {
                        const labelEl = activeLink.querySelector('span');
                        const titleText = labelEl ? labelEl.textContent.trim() : activeLink.textContent.trim();
                        const topbarEl = document.getElementById('topbarTitle');
                        if (topbarEl && titleText) topbarEl.textContent = titleText;

                        // Optional: if sidebar link provides a data-subtitle attribute, use it for the subtitle
                        const subText = activeLink.getAttribute('data-subtitle');
                        const topbarSub = document.getElementById('topbarSub');
                        if (topbarSub && subText) topbarSub.textContent = subText;
                    }
                } catch (e) { /* ignore errors */ }
                if (typeof window.bindAdminSidebarInfo === 'function') {
                    window.bindAdminSidebarInfo();
                } else if (sessionStorage.getItem('hris_user')) {
                    try {
                        const user = JSON.parse(sessionStorage.getItem('hris_user'));
                        const nEl = document.getElementById('sidebarName');
                        const iEl = document.getElementById('sidebarInitials');
                        if (nEl) nEl.textContent = user.name || 'Admin';
                        if (iEl) {
                            if (window.hasProfilePic && window.hasProfilePic(user.profile_pic_url)) {
                                iEl.innerHTML = `<img src="${window.getDirectDriveUrl(user.profile_pic_url)}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" onerror="this.src='/img/profile.png'; this.onerror=null;">`;
                            } else {
                                iEl.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'A';
                            }
                        }
                    } catch (e) { }
                }
                document.dispatchEvent(new Event('sidebarLoaded'));
            })
            .catch(err => console.error('Error loading sidebar:', err));
    }

    if (topbarMount && !document.getElementById('topbarTitle')) {
        topbarMount.innerHTML = `
            <header class="admin-topbar">
                <div style="display:flex; align-items:center; gap:16px;">
                    <button class="sidebar-toggle-btn" onclick="toggleSidebar()">
                        <i class="bi bi-list"></i>
                    </button>
                    <div>
                        <h2 class="topbar-title" id="topbarTitle">Dashboard</h2>
                        <p class="topbar-subtitle" id="topbarSub">Overview kehadiran real-time</p>
                    </div>
                </div>
                <div class="topbar-actions" style="display:flex; align-items:center; gap:12px;">
                    <button class="refresh-toggle-btn hide-on-mobile" onclick="window.location.reload()" title="Refresh Halaman"
                        style="background:var(--bg-deep); border:1px solid var(--border); box-shadow:inset 2px 2px 5px rgba(0,0,0,0.08), inset -2px -2px 5px rgba(255,255,255,0.3); border-radius:50%; width: 36px; height: 36px; display:flex; align-items:center; justify-content:center; color:var(--text); font-size:16px; transition: all var(--transition); cursor:pointer;">
                        <i class="bi bi-arrow-clockwise text-primary"></i>
                    </button>
                    <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Ganti Mode"
                        style="background:var(--bg-deep); border:1px solid var(--border); box-shadow:inset 2px 2px 5px rgba(0,0,0,0.08), inset -2px -2px 5px rgba(255,255,255,0.3); border-radius:50%; width: 36px; height: 36px; display:flex; align-items:center; justify-content:center; color:var(--text); font-size:16px; transition: all var(--transition); cursor:pointer;">
                        <i class="bi bi-sun-fill text-primary"></i>
                    </button>
                    <button class="header-logout-btn" onclick="logout()" title="Keluar"
                        style="background:rgba(220,53,69,0.1); border:1px solid rgba(220,53,69,0.2); border-radius:50%; width: 36px; height: 36px; display:none; align-items:center; justify-content:center; color:var(--danger); font-size:16px; transition: all var(--transition); cursor:pointer;">
                        <i class="bi bi-box-arrow-right"></i>
                    </button>
                    <div class="clock-chip">
                        <i class="bi bi-clock-fill text-primary" style="font-size:11px;"></i>
                        <span id="liveTopClock">--:--:--</span>
                    </div>
                </div>
            </header>
        `;
        if (typeof window.updateThemeToggleBtn === 'function') {
            updateThemeToggleBtn();
        }
    }
};

if (isInsideAdmin) {
    renderAdminLayout();
}

window.renderEmployeeLayout = function () {
    const wrap = document.querySelector('.wrap-employee');
    if (wrap && !document.querySelector('.bottom-nav')) {
        fetch('/employee/bottom-nav.html')
            .then(res => res.text())
            .then(html => {
                wrap.insertAdjacentHTML('beforeend', html);
                const currentPath = window.location.pathname;
                wrap.querySelectorAll('.bottom-nav .nav-item').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === currentPath || (currentPath === '/employee/' && href === '/employee/beranda.html')) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            })
            .catch(err => console.error('Error loading bottom nav:', err));
    }
};

if (isInsideEmployee) {
    renderEmployeeLayout();
}

// Register Service Worker globally for caching and instant performance updates
if ('serviceWorker' in navigator) {
    let refreshingForUpdate = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshingForUpdate) return;
        refreshingForUpdate = true;
        window.location.reload();
    });

    navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.update();

        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('Perubahan tampilan terdeteksi! Mengosongkan cache...');
                        caches.keys().then(names => {
                            return Promise.all(names.map(name => caches.delete(name)));
                        }).then(() => {
                            newWorker.postMessage('SKIP_WAITING');
                        });
                    }
                });
            }
        });

        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage('CLEAR_CACHE');
        }
    }).catch(() => { });
}

// Global Theme Switcher (Light / Dark Mode)
window.toggleTheme = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('hris_theme', newTheme);
    updateThemeToggleBtn();

    // Re-render chart to dynamically pick up computed text styles
    if (window.renderChart && window.lastChartStats) {
        setTimeout(() => {
            window.renderChart(window.lastChartStats);
        }, 100);
    }
};

window.updateThemeToggleBtn = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerHTML = currentTheme === 'dark'
            ? '<i class="bi bi-sun-fill"></i>'
            : '<i class="bi bi-moon-stars-fill"></i>';
        btn.title = currentTheme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
    }
};

// Auto-run on script load
(function () {
    const savedTheme = localStorage.getItem('hris_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    // Wait for DOM to load to sync button icon
    document.addEventListener('DOMContentLoaded', updateThemeToggleBtn);
})();

// Page loader hide function
window.hidePageLoader = function () {
    const loader = document.getElementById('employeePageLoader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        setTimeout(() => loader.remove(), 400);
    }
};

window.showModalAlert = function (title, message, type = 'info', actionBtn = null) {
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

window.showModalConfirm = function (title, message, onConfirm) {
    let overlay = document.getElementById('globalConfirmOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'globalConfirmOverlay';
        overlay.className = 'overlay';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }

    // Use responsive max width, remove inner scrolling to keep UI clickable and simple
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

    document.getElementById('confirmYesBtn').onclick = function () {
        overlay.remove();
        onConfirm();
    };
};

window.logout = function () {
    if (typeof window.showModalConfirm === 'function') {
        window.showModalConfirm('Keluar Akun', 'Apakah Anda yakin ingin keluar dari sistem HRIS?', function () {
            sessionStorage.removeItem('hris_user');
            window.location.href = '/';
        });
    } else {
        if (confirm('Apakah Anda yakin ingin keluar dari sistem HRIS?')) {
            sessionStorage.removeItem('hris_user');
            window.location.href = '/';
        }
    }
};

window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
};

window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
};

// Helper Global: Parse waktu dari berbagai format (ISO full string atau HH:MM) ke format HH:MM 24 jam
window.parseTime = function (val) {
    if (!val || val === '--:--' || val === '--') return null;
    let d = null;
    if (val instanceof Date) {
        d = val;
    } else if (typeof val === 'string' && (val.includes('T') || val.includes('Z') || val.match(/^\d{4}-\d{2}-\d{2}/))) {
        d = new Date(val);
    }
    if (d && !isNaN(d.getTime())) {
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    if (typeof val === 'string') {
        const match = val.match(/(\d{1,2}):(\d{2})/);
        if (match) {
            return String(parseInt(match[1], 10)).padStart(2, '0') + ':' + String(parseInt(match[2], 10)).padStart(2, '0');
        }
    }
    return null;
};

window.formatActivityDate = function (val) {
    if (!val) return 'Hari ini';
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = val.split('-');
        const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const dayName = days[dateObj.getDay()];
        return `${dayName}, ${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
    }
    if (typeof val === 'string' && (val.includes('Sat D') || val.includes('1899'))) {
        return 'Hari ini';
    }
    return val;
};

// Helper Global: Mengubah link Drive biasa menjadi Direct Link Gambar
window.getDirectDriveUrl = function (url) {
    if (!url) return '';
    if (typeof url !== 'string') return '';

    // Jika formatnya link Drive (file/d/ID atau ?id=ID)
    if (url.includes('drive.google.com')) {
        let id = '';
        if (url.includes('id=')) {
            id = url.split('id=')[1].split('&')[0];
        } else if (url.includes('/file/d/')) {
            id = url.split('/file/d/')[1].split('/')[0];
        }

        if (id) {
            // Gunakan format lh3 yang lebih stabil untuk preview gambar
            return `https://lh3.googleusercontent.com/d/${id}`;
        }
    }
    return url;
};

// Helper Global: Memeriksa apakah URL foto profil valid dan bukan placeholder
window.hasProfilePic = function (url) {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    const cleaned = url.trim().toLowerCase();
    if (cleaned === '' || cleaned.includes('profile.png') || cleaned.includes('profile/png') || cleaned.includes('placeholder')) {
        return false;
    }
    return true;
};

window.imagePreviewState = {
    zoom: 1
};

window.ensureImagePreviewModal = function () {
    let modal = document.getElementById('globalImagePreviewModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'globalImagePreviewModal';
    modal.className = 'image-preview-modal hidden';
    modal.innerHTML = `
        <div class="image-preview-backdrop" onclick="closeImagePreview()"></div>
        <div class="image-preview-shell" role="dialog" aria-modal="true" aria-label="Preview gambar">
            <div class="image-preview-toolbar">
                <button class="image-preview-btn" type="button" onclick="zoomImagePreview(-0.2)" aria-label="Zoom out" title="Zoom out">
                    <i class="bi bi-zoom-out"></i>
                </button>
                <button class="image-preview-btn" type="button" onclick="resetImagePreviewZoom()" aria-label="Reset zoom" title="Reset zoom">
                    <i class="bi bi-arrows-angle-contract"></i>
                </button>
                <button class="image-preview-btn" type="button" onclick="zoomImagePreview(0.2)" aria-label="Zoom in" title="Zoom in">
                    <i class="bi bi-zoom-in"></i>
                </button>
                <button class="image-preview-btn image-preview-close" type="button" onclick="closeImagePreview()" aria-label="Tutup preview" title="Tutup">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="image-preview-stage">
                <img id="globalImagePreviewImg" src="" alt="Preview gambar">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
};

window.setImagePreviewZoom = function (zoom) {
    const img = document.getElementById('globalImagePreviewImg');
    window.imagePreviewState.zoom = Math.min(3, Math.max(0.5, zoom));
    if (img) {
        img.style.transform = `scale(${window.imagePreviewState.zoom})`;
    }
};

window.zoomImagePreview = function (delta) {
    window.setImagePreviewZoom((window.imagePreviewState?.zoom || 1) + delta);
};

window.resetImagePreviewZoom = function () {
    window.setImagePreviewZoom(1);
};

window.openImagePreview = function (src) {
    if (!src) return;
    const modal = window.ensureImagePreviewModal();
    const img = document.getElementById('globalImagePreviewImg');
    if (!img) return;

    img.src = getDirectDriveUrl(src);
    img.onerror = () => {
        img.src = '/img/profile.png';
        img.onerror = null;
    };
    modal.classList.remove('hidden');
    document.body.classList.add('image-preview-open');
    window.resetImagePreviewZoom();
};

window.closeImagePreview = function () {
    const modal = document.getElementById('globalImagePreviewModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('image-preview-open');
};

document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const img = event.target.closest('.user-cell img.avatar, #sidebarInitials img, #avatarEl img');
    if (!img) return;
    event.preventDefault();
    event.stopPropagation();
    window.openImagePreview(img.currentSrc || img.src);
});

document.addEventListener('keydown', event => {
    const modal = document.getElementById('globalImagePreviewModal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (event.key === 'Escape') window.closeImagePreview();
    if (event.key === '+' || event.key === '=') window.zoomImagePreview(0.2);
    if (event.key === '-') window.zoomImagePreview(-0.2);
});

if (currentPage === 'index.html' || (currentPage === '' && 'index.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL;

        window.togglePass = function () {
            const inp = document.getElementById('pinInput');
            const icon = document.getElementById('togglePassIcon');
            if (inp.type === 'password') {
                inp.type = 'text';
                icon.className = 'bi bi-eye-slash';
            } else {
                inp.type = 'password';
                icon.className = 'bi bi-eye';
            }
        }

        window.toggleRegPass = function () {
            const inp = document.getElementById('regPassword');
            const icon = document.getElementById('toggleRegPassIcon');
            const btn = document.getElementById('toggleRegPassBtn');
            if (!inp || !icon) return;

            const isHidden = inp.type === 'password';
            inp.type = isHidden ? 'text' : 'password';
            icon.className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
            if (btn) {
                btn.setAttribute('aria-label', isHidden ? 'Sembunyikan PIN registrasi' : 'Tampilkan PIN registrasi');
                btn.title = isHidden ? 'Sembunyikan PIN' : 'Tampilkan PIN';
            }
        }

        window.showAlert = function (msg, type = 'error') {
            const box = document.getElementById('alertBox');
            if (box) {
                const icon = document.getElementById('alertIcon');
                box.className = 'alert-box ' + type;
                icon.className = type === 'error' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-check-circle-fill';
                document.getElementById('alertMsg').textContent = msg;
            }
            if (window.showModalAlert) {
                window.showModalAlert(type === 'error' ? 'Perhatian' : 'Sukses', msg, type);
            }
        }
        window.hideAlert = function () { document.getElementById('alertBox').className = 'alert-box'; }

        let failedAttempts = parseInt(localStorage.getItem('failed_attempts') || '0');
        let lockoutUntil = parseInt(localStorage.getItem('lockout_until') || '0');

        function checkLockout() {
            const now = Date.now();
            if (lockoutUntil && now < lockoutUntil) {
                const remaining = Math.ceil((lockoutUntil - now) / 1000);
                startLockoutCountdown(remaining);
                return true;
            }
            return false;
        }

        function startLockoutCountdown(seconds) {
            const btn = document.getElementById('loginBtn');
            const txt = document.getElementById('btnText');
            if (btn && txt) {
                btn.disabled = true;
                const interval = setInterval(() => {
                    const now = Date.now();
                    const remaining = Math.ceil((lockoutUntil - now) / 1000);
                    if (remaining <= 0) {
                        clearInterval(interval);
                        btn.disabled = false;
                        txt.textContent = 'MASUK';
                        failedAttempts = 0;
                        localStorage.setItem('failed_attempts', '0');
                        localStorage.removeItem('lockout_until');
                    } else {
                        txt.textContent = `TUNGGU (${remaining}s)`;
                    }
                }, 1000);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            checkLockout();
        });

        window.setLoading = function (state) {
            const btn = document.getElementById('loginBtn');
            const txt = document.getElementById('btnText');
            if (btn && txt) {
                btn.disabled = state;
                txt.innerHTML = state
                    ? '<div class="loading-dots"><span></span><span></span><span></span></div>'
                    : 'MASUK';
            }
        }

        window.doLogin = async function () {
            if (checkLockout()) return;
            hideAlert();
            const email = document.getElementById('emailInput').value.trim();
            const pin = document.getElementById('pinInput').value.trim();
            if (!email || !pin) { showAlert('Email dan PIN wajib diisi.'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAlert('Format email tidak valid.'); return; }
            setLoading(true);
            try {
                const res = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'login', email, password_pin: pin })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('failed_attempts', '0');
                    sessionStorage.setItem('hris_user', JSON.stringify(data.user));
                    // Show modal success and remove its close controls because we'll redirect
                    if (window.showModalAlert) {
                        window.showModalAlert('Sukses', 'Login berhasil! Mengarahkan...', 'success');
                        setTimeout(() => {
                            const overlay = document.getElementById('globalModalOverlay');
                            if (overlay) {
                                const buttons = overlay.querySelectorAll('button');
                                buttons.forEach(b => {
                                    const onclick = b.getAttribute('onclick') || '';
                                    if (onclick.includes('globalModalOverlay')) b.style.display = 'none';
                                });
                            }
                        }, 20);
                    } else {
                        showAlert('Login berhasil! Mengarahkan...', 'success');
                    }
                    setTimeout(() => {
                        window.location.href = window.getRedirectUrl(data.user.role === 'Admin' ? 'admin' : 'employee');
                    }, 1000);
                } else {
                    failedAttempts++;
                    localStorage.setItem('failed_attempts', failedAttempts.toString());
                    if (failedAttempts >= 3) {
                        lockoutUntil = Date.now() + 30000;
                        localStorage.setItem('lockout_until', lockoutUntil.toString());
                        showAlert('Batas salah PIN terlampaui. Tombol masuk dikunci selama 30 detik.', 'error');
                        startLockoutCountdown(30);
                    } else {
                        showAlert(`${data.message || 'Email atau PIN salah.'} Sisa percobaan: ${3 - failedAttempts}`);
                    }
                }
            } catch (e) {
                showAlert('Gagal terhubung ke server. Cek koneksi internet Anda.');
            }
            if (failedAttempts < 3) {
                setLoading(false);
            }
        }

        window.systemConfig = null;
        async function fetchSystemConfig() {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getConfig`);
                const data = await res.json();
                if (data.success && data.config) {
                    window.systemConfig = data.config;
                }
            } catch (err) {
                console.error("Gagal memuat konfigurasi:", err);
            }
        }
        fetchSystemConfig();

        window.contactCS = function () {
            const waNum = (window.systemConfig && window.systemConfig.wa_admin) || '628123456789';
            const waUrl = `https://wa.me/${waNum}?text=Halo%20Admin%20JEF%20Group,%20saya%20butuh%20bantuan%20terkait%20sistem%20HRIS.`;
            window.open(waUrl, '_blank');
        }

        window.showRegistration = function () {
            document.getElementById('registerFormSection').classList.remove('hidden');
            loadRegPositions();
        }

        window.showLogin = function () {
            document.getElementById('registerFormSection').classList.add('hidden');
        }

        window.previewRegPhoto = function (input) {
            const file = input.files[0];
            const previewImg = document.getElementById('previewAvatarImg');
            const initialsSpan = document.getElementById('regAvatarInitials');
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.style.display = 'block';
                    }
                    if (initialsSpan) initialsSpan.style.display = 'none';
                };
                reader.readAsDataURL(file);
            } else {
                if (previewImg) {
                    previewImg.src = '';
                    previewImg.style.display = 'none';
                }
                if (initialsSpan) initialsSpan.style.display = 'flex';
            }
        }

        window.showRegAlert = function (msg, type = 'error') {
            const box = document.getElementById('registerAlertBox');
            if (box) {
                const icon = document.getElementById('registerAlertIcon');
                box.className = 'alert-box ' + type;
                icon.className = type === 'error' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-check-circle-fill';
                document.getElementById('registerAlertMsg').textContent = msg;
            }
        }

        window.hideRegAlert = function () {
            const box = document.getElementById('registerAlertBox');
            if (box) box.className = 'alert-box';
        }

        let loadedPositions = [];
        window.loadRegPositions = async function () {
            const select = document.getElementById('regPosition');
            if (!select) return;
            if (loadedPositions.length > 0) return;

            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getPositions`);
                const data = await res.json();
                if (data.success && data.positions) {
                    loadedPositions = data.positions;
                    select.innerHTML = '<option value="" disabled selected>Pilih Jabatan...</option>' +
                        data.positions.map(p => `<option value="${p.position}">${p.position} (${p.division || 'Unassigned'})</option>`).join('');
                } else {
                    select.innerHTML = '<option value="" disabled selected>Gagal memuat jabatan</option>';
                }
            } catch (err) {
                select.innerHTML = '<option value="" disabled selected>Gagal memuat jabatan</option>';
            }
        }

        window.doRegister = async function (e) {
            e.preventDefault();
            hideRegAlert();

            const name = document.getElementById('regName').value.trim();
            const username = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value.trim();
            const position = document.getElementById('regPosition').value;
            const photoFile = document.getElementById('regPhoto').files[0];

            if (!photoFile) {
                showModalAlert('Foto Profil Diperlukan', 'Silakan tambahkan foto profil Anda untuk melanjutkan pendaftaran.', 'warning');
                return;
            }

            if (!name || !username || !password || !position) {
                showRegAlert('Semua kolom wajib diisi.');
                return;
            }

            if (password.startsWith('0')) {
                showModalAlert('Pendaftaran Gagal', 'PIN tidak boleh diawali dengan angka 0. Silakan gunakan angka lain untuk awalan PIN Anda.', 'error');
                return;
            }

            const email = username.toLowerCase() + '@jefgroup.id';

            showRegAlert('Sedang memproses pendaftaran...', 'success');
            const reader = new FileReader();
            reader.onload = async function () {
                const base64 = reader.result.split(',')[1];
                try {
                    const res = await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'registerEmployee',
                            name,
                            email,
                            password_pin: password,
                            position,
                            profile_pic_base64: base64
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        const waNum = (window.systemConfig && window.systemConfig.wa_admin) || '628123456789';
                        const waUrl = `https://wa.me/${waNum}?text=Halo%20HC%20JEF%20Group,%20saya%20sudah%20melakukan%20pendaftaran%20akses%20HRIS%20atas%20nama%20${encodeURIComponent(name)}.%20Mohon%20persetujuan%20akun%20saya.`;

                        showModalAlert(
                            'Pendaftaran Sukses',
                            'Pendaftaran sukses! Silakan menunggu persetujuan HR untuk mengaktifkan akun Anda.',
                            'success',
                            { text: 'Hubungi HC (WhatsApp)', url: waUrl }
                        );
                        showLogin();
                        document.getElementById('formRegister').reset();
                        const previewCard = document.getElementById('photoPreviewPanel');
                        if (previewCard) previewCard.classList.remove('active');
                    } else {
                        showRegAlert(data.message || 'Pendaftaran gagal.');
                    }
                } catch (err) {
                    showRegAlert('Gagal terhubung ke server.');
                }
            };
            reader.readAsDataURL(photoFile);
        }

        // Keys listener
        document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    })();
}

if (currentPage === 'admin.html' || (currentPage === '' && 'admin.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL;
        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData || userData.role !== 'Admin') window.location.href = window.getRedirectUrl('index');

        const sbName = document.getElementById('sidebarName');
        if (sbName) sbName.textContent = userData?.name || 'Admin';
        const wName = document.getElementById('adminWelcomeName');
        if (wName) wName.textContent = userData?.name || 'Admin';

        window.updateAdminAvatar = function (url) {
            const si = document.getElementById('sidebarInitials');
            if (!si) return;
            const hasPic = hasProfilePic(url);
            const finalUrl = hasPic ? getDirectDriveUrl(url) : '';
            si.textContent = '';
            const img = document.createElement('img');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            img.onerror = () => { img.src = '/img/profile.png'; img.onerror = null; };
            img.src = finalUrl || '/img/profile.png';
            si.appendChild(img);
        };

        // Init avatar
        updateAdminAvatar(userData?.profile_pic_url);

        // Online/Offline Network Status indicator for avatar dot
        window.updateConnectionStatus = function () {
            const dot = document.getElementById('connectionStatusDot');
            if (!dot) return;
            if (navigator.onLine) {
                dot.className = 'status-indicator-dot online';
                dot.title = 'Online Jaringan';
            } else {
                dot.className = 'status-indicator-dot offline';
                dot.title = 'Offline Jaringan';
            }
        };
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        updateConnectionStatus();

        // UI Functions
        window.showToast = function (msg, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const icons = { success: 'check-circle-fill', error: 'x-circle-fill', warn: 'exclamation-triangle-fill' };
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="bi bi-${icons[type] || 'info-circle'}"></i> ${msg}`;
            container.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
        }

        window.toggleSidebar = function () {
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.toggle('open');
                document.getElementById('sidebarOverlay').classList.toggle('open');
            } else {
                const layout = document.querySelector('.admin-layout');
                if (layout) {
                    layout.classList.toggle('sidebar-compact');
                }
            }
        }

        window.closeModal = function (id) { document.getElementById(id).classList.add('hidden'); }

        // Clock
        setInterval(() => {
            const n = new Date();
            const clk = document.getElementById('liveTopClock');
            if (clk) clk.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(x => String(x).padStart(2, '0')).join(':');
        }, 1000);

        // Navigation
        window.showPage = function (page, el) {
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            if (el) {
                el.classList.add('active');
            } else {
                // Auto-highlight the correct sidebar link based on page name
                document.querySelectorAll('.sidebar-link').forEach(l => {
                    const href = l.getAttribute('href') || '';
                    if (href.includes('/' + page + '.html') || (page === 'dashboard' && href.includes('/dashboard.html'))) {
                        l.classList.add('active');
                    }
                });
            }
            document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
            const pageEl = document.getElementById(`page-${page}`);
            if (pageEl) {
                pageEl.classList.add('active');
            }

            if (window.innerWidth <= 768) toggleSidebar();

            const titles = {
                dashboard: ['Dashboard', 'Overview kehadiran real-time'],
                users: ['Data Karyawan', 'Kelola akun dan akses karyawan'],
                approval: ['Approval Pengajuan', 'Persetujuan Cuti, Sakit, dan Izin'],
                attendance: ['Riwayat Absensi', 'Log kehadiran seluruh karyawan'],
                'leave-report': ['Rekap Kehadiran', 'Rekap jatah cuti, sakit, dan izin karyawan secara dinamis per periode'],
                config: ['Konfigurasi Sistem', 'Pengaturan lokasi, jam kerja, dan kontak HRD/HC'],
                holidays: ['Hari Libur Operasional', 'Kelola kalender hari libur operasional kantor'],
                positions: ['Posisi & Divisi', 'Kelola data jabatan dan divisi organisasi perusahaan'],
                tasks: ['Manajemen Tugas & Produktivitas', 'Kelola daily task, status pengerjaan, skor produktivitas, dan dokumen pelaporan karyawan']
            };
            const topbarTitle = document.getElementById('topbarTitle');
            const topbarSub = document.getElementById('topbarSub');
            if (topbarTitle && titles[page]) topbarTitle.textContent = titles[page][0];
            if (topbarSub && titles[page]) topbarSub.textContent = titles[page][1];

            if (page === 'dashboard') loadDashboard();
            else if (page === 'users') loadUsers();
            else if (page === 'approval') loadApprovals();
            else if (page === 'attendance') loadAttendance();
            else if (page === 'leave-report') loadLeaveReport();
            else if (page === 'holidays') loadHolidays();
            else if (page === 'positions') loadPositions();
            else if (page === 'tasks') loadAdminTasks();
            else if (page === 'config') {
                loadConfig();
                if (leafletMap) {
                    setTimeout(() => leafletMap.invalidateSize(), 350);
                }
            }
        }

        // ==== DASHBOARD ====
        window.loadDashboard = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=adminDashboard&user_id=${userData.user_id}`);
                const data = await res.json();

                // Update profile pic if changed
                if (data.profile_pic_url) {
                    try { updateAdminAvatar(data.profile_pic_url); } catch (uaErr) { console.warn('updateAdminAvatar error', uaErr); }
                    // Sync to session
                    userData.profile_pic_url = data.profile_pic_url;
                    sessionStorage.setItem('hris_user', JSON.stringify(userData));
                }

                // Helper to safely set text content
                const safeSet = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };

                safeSet('s-hadir', data.stats?.hadir ?? 0);
                safeSet('s-total', data.stats?.total ?? 0);
                safeSet('s-late', data.stats?.terlambat ?? 0);
                safeSet('s-leave', data.stats?.cuti ?? 0);
                safeSet('s-absent', data.stats?.absen ?? 0);

                window.lastPendingCount = data.pending_count ?? 0;
                const pb = document.getElementById('pendingBadge');
                if (pb) {
                    pb.textContent = window.lastPendingCount;
                    pb.style.display = window.lastPendingCount > 0 ? 'inline-block' : 'none';
                }

                window.allLiveLogs = data.live_log || [];
                if (typeof renderLiveLog === 'function') {
                    try { renderLiveLog(window.allLiveLogs); } catch (rlErr) { console.warn('renderLiveLog failed', rlErr); }
                }

                if (window.renderChart && data.stats) {
                    window.lastChartStats = data.stats;
                    try { window.renderChart(data.stats); } catch (rcErr) { console.warn('renderChart failed', rcErr); }
                }

                try {
                    const belumAbsen = data.belum_absen_users || [];
                    const activeBelumAbsen = belumAbsen.filter(u => u.status === 'Active');
                    if (window.renderBelumAbsen) {
                        try { window.renderBelumAbsen(activeBelumAbsen); } catch (rbErr) { console.warn('renderBelumAbsen failed', rbErr); }
                    }
                } catch (eu) { console.warn('renderBelumAbsen failed', eu); }

                if (window.hidePageLoader) window.hidePageLoader();
            } catch (e) {
                console.error('Error loading dashboard:', e);
                if (window.hidePageLoader) window.hidePageLoader();
                showToast('Gagal memuat dashboard', 'error');
            }
        }

        window.renderLiveLog = function (logs) {
            const body = document.getElementById('liveLogBody');
            if (!body) return; // nothing to render on non-dashboard pages
            if (!logs || !logs.length) { body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px">Belum ada data hari ini</td></tr>'; return; }
            body.innerHTML = logs.map(l => `
    <tr>
      <td>
        <div class="user-cell" style="justify-content: flex-start; text-align: left;">
          ${hasProfilePic(l.profile_pic) ?
                    `<img src="${getDirectDriveUrl(l.profile_pic)}" class="avatar avatar-sm" style="object-fit:cover" onerror="this.src='/img/profile.png'; this.onerror=null;">` :
                    `<img src="/img/profile.png" class="avatar avatar-sm" style="object-fit:cover;">`
                }
          <div class="user-cell-info" style="text-align: left; display: flex; flex-direction: column; align-items: flex-start;">
            <span class="user-cell-name">${l.name}</span>
            <span class="user-cell-role">${l.position}</span>
          </div>
        </div>
      </td>
      <td><strong style="color:var(--text)">${l.clock_in || '--:--'}</strong></td>
      <td><strong style="color:var(--text)">${l.clock_out || '--:--'}</strong></td>
      <td>${l.distance ? l.distance + 'm' : '—'}</td>
      <td><span class="badge ${l.status_in === 'Terlambat' ? 'badge-warn' : 'badge-success'}">${l.status_in || '—'}</span></td>
      <td>${l.photo_in ? `<button class="btn btn-sm btn-ghost" onclick="viewPhoto('${l.photo_in}')"><i class="bi bi-camera"></i></button>` : '—'}</td>
    </tr>
  `).join('');
        }

        window.viewPhoto = function (url) {
            window.openImagePreview(url);
        }

        // ==== USERS ====
        let allUsers = [];
        window.loadUsers = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getUsers`);
                const data = await res.json();
                allUsers = data.users || [];
                window.allUsers = allUsers;

                const inactiveCount = allUsers.filter(u => u.status && u.status !== 'Active').length;
                window.lastInactiveCount = inactiveCount;
                const badge = document.getElementById('inactiveTalentsBadge');
                if (badge) {
                    badge.textContent = inactiveCount;
                    badge.style.display = inactiveCount > 0 ? 'inline-block' : 'none';
                }
            } catch (e) {
                console.error('Error loading users:', e);
                showToast('Gagal memuat data karyawan', 'error');
            }
            renderUsers(allUsers);
        }

        window.renderUsers = function (users) {
            const body = document.getElementById('userTableBody');
            if (!body) return;
            if (!users.length) {
                body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">Tidak ada data</td></tr>';
                return;
            }

            // Group by role
            const groups = {};
            users.forEach(u => {
                const r = u.role || 'Employee';
                if (!groups[r]) groups[r] = [];
                groups[r].push(u);
            });

            let html = '';
            // Render Admin first, then Employee, then others
            const rolesOrder = ['Admin', 'Employee'];
            const allRoles = Object.keys(groups).sort((a, b) => {
                const ia = rolesOrder.indexOf(a);
                const ib = rolesOrder.indexOf(b);
                if (ia !== -1 && ib !== -1) return ia - ib;
                if (ia !== -1) return -1;
                if (ib !== -1) return 1;
                return a.localeCompare(b);
            });

            allRoles.forEach(role => {
                const roleUsers = groups[role];
                html += `
                    <tr class="group-header-row" style="background:rgba(255,146,0,0.06); font-weight:800; border-bottom:1.5px solid rgba(255,146,0,0.15)">
                        <td colspan="5" style="padding: 14px 18px; text-align:left; font-size:12px; color:var(--primary); letter-spacing:1px; text-transform:uppercase; font-family:var(--font-head);">
                            <i class="bi bi-people-fill" style="margin-right:8px;"></i> ${role} &mdash; <span style="opacity:0.75; font-size:11px; text-transform:none;">${roleUsers.length} Karyawan</span>
                        </td>
                    </tr>
                `;

                roleUsers.forEach(u => {
                    html += `
                        <tr style="border-bottom:1.5px dashed var(--border)">
                          <td>
                            <div class="user-cell" style="justify-content: flex-start; text-align: left;">
                              ${hasProfilePic(u.profile_pic_url) ?
                            `<img src="${getDirectDriveUrl(u.profile_pic_url)}" class="avatar avatar-sm" style="object-fit:cover; width:36px; height:36px;" onerror="this.src='/img/profile.png'; this.onerror=null;">` :
                            `<img src="/img/profile.png" class="avatar avatar-sm" style="object-fit:cover; width:36px; height:36px;">`
                        }
                              <span class="user-cell-name" style="font-weight:700; color:var(--text);">${u.name}</span>
                            </div>
                          </td>
                          <td style="color:var(--text-muted); font-size:13px;">${u.email}</td>
                          <td style="font-weight:600; color:var(--text); font-size:13px; width: 100%;">${u.position}</td>
                          <td><span class="badge ${u.status === 'Active' ? 'badge-success' : (u.status === 'Pending' ? 'badge-warn' : 'badge-danger')}" style="font-size:10px; font-weight:800; padding:3px 8px; border-radius:50px;">${u.status === 'Pending' ? 'Menunggu Approval' : (u.status === 'Active' ? 'Aktif' : 'Nonaktif')}</span></td>
                          <td>
                            <div class="action-btns" style="display:flex; gap:6px; justify-content:center;">
                              <button class="btn btn-sm btn-ghost btn-neu-3d" onclick='openEditUser(${JSON.stringify(u).replace(/'/g, "&#39;")})' style="border-radius:50%; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; padding:0; color:var(--primary);"><i class="bi bi-pencil-fill"></i></button>
                              ${u.status === 'Pending' ? `
                                <button class="btn btn-sm btn-success btn-neu-3d" onclick="toggleUser('${u.user_id}','Pending')" style="background-color:#2ec4b6 !important; border-color:#2ec4b6 !important; color:white !important; font-size:11px; font-weight:800; height:32px; padding:0 12px; border-radius:8px;">
                                  <i class="bi bi-person-check-fill"></i> Setujui
                                </button>
                              ` : `
                                <button class="btn btn-sm ${u.status === 'Active' ? 'btn-danger' : 'btn-success'} btn-neu-3d" onclick="toggleUser('${u.user_id}','${u.status}')" style="font-size:11px; font-weight:800; height:32px; padding:0 12px; border-radius:8px;">
                                  ${u.status === 'Active' ? '<i class="bi bi-power"></i> Nonaktif' : '<i class="bi bi-check-circle"></i> Aktif'}
                                </button>
                              `}
                            </div>
                          </td>
                        </tr>
                    `;
                });
            });

            body.innerHTML = html;
        }

        window.filterUsers = function () {
            const q = (document.getElementById('userSearch')?.value || '').trim().toLowerCase();
            const stVal = document.getElementById('userStatusFilter')?.value || '';
            const roleVal = document.getElementById('userRoleFilter')?.value || '';
            const stArr = stVal ? stVal.split(',') : [];
            const roleArr = roleVal ? roleVal.split(',') : [];

            const filtered = allUsers.filter(u => {
                const matchesSearch = !q ||
                    (u.name && u.name.toLowerCase().includes(q)) ||
                    (u.email && u.email.toLowerCase().includes(q)) ||
                    (u.user_id && u.user_id.toLowerCase().includes(q));
                const matchesStatus = stArr.length === 0 || stArr.includes(u.status);
                const matchesRole = roleArr.length === 0 || roleArr.includes(u.role);
                return matchesSearch && matchesStatus && matchesRole;
            });
            renderUsers(filtered);
        }

        window.previewAvatar = function (input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('mu_preview').src = e.target.result;
                };
                reader.readAsDataURL(input.files[0]);
            }
        }

        window.openAddUser = function () {
            document.getElementById('modalUserTitle').textContent = 'Tambah Karyawan';
            document.getElementById('modalUserId').value = '';
            ['mu_name', 'mu_email', 'mu_pin', 'mu_position'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('mu_preview').src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
            document.getElementById('mu_file').value = '';
            document.getElementById('mu_role').value = 'Employee';
            if (document.getElementById('mu_division')) document.getElementById('mu_division').value = 'Umum';
            document.getElementById('modalUser').classList.remove('hidden');
        }

        window.openEditUser = function (u) {
            document.getElementById('modalUserTitle').textContent = 'Edit Karyawan';
            document.getElementById('modalUserId').value = u.user_id;
            document.getElementById('mu_name').value = u.name;
            document.getElementById('mu_email').value = u.email;
            document.getElementById('mu_pin').value = '';
            document.getElementById('mu_position').value = u.position;
            document.getElementById('mu_role').value = u.role;
            if (document.getElementById('mu_division')) {
                document.getElementById('mu_division').value = u.division || 'Umum';
            }
            document.getElementById('mu_preview').src = hasProfilePic(u.profile_pic_url) ? getDirectDriveUrl(u.profile_pic_url) : '/img/profile.png';
            document.getElementById('mu_file').value = '';
            document.getElementById('modalUser').classList.remove('hidden');
        }

        window.saveUser = async function () {
            const userId = document.getElementById('modalUserId').value;
            const fileInput = document.getElementById('mu_file');

            let profile_pic_base64 = null;
            let profile_pic_name = null;

            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                profile_pic_base64 = await toBase64(file);
                profile_pic_name = `profile_${userId || 'new'}_${Date.now()}.jpg`;
            }

            const payload = {
                action: userId ? 'updateUser' : 'addUser',
                user_id: userId,
                name: document.getElementById('mu_name').value,
                email: document.getElementById('mu_email').value,
                password_pin: document.getElementById('mu_pin').value,
                position: document.getElementById('mu_position').value,
                division: document.getElementById('mu_division') ? document.getElementById('mu_division').value : 'Umum',
                role: document.getElementById('mu_role').value,
                profile_pic_base64,
                profile_pic_name
            };

            if (!payload.name || !payload.email || !payload.position) { showToast('Harap lengkapi semua data wajib', 'warn'); return; }

            if (payload.password_pin && payload.password_pin.startsWith('0')) {
                showModalAlert('Validasi Gagal', 'PIN tidak boleh diawali dengan angka 0. Silakan gunakan angka lain untuk awalan PIN.', 'error');
                return;
            }

            try {
                const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                const data = await res.json();
                if (data.success) {
                    showToast('Data karyawan disimpan', 'success');
                    closeModal('modalUser');
                    loadUsers();
                } else {
                    showToast(data.message || 'Gagal menyimpan', 'error');
                }
            } catch (e) {
                showToast('Terjadi kesalahan koneksi', 'error');
            }
        }

        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });

        window.toggleUser = function (id, currentStatus) {
            let newStatus, confirmMsg;
            if (currentStatus === 'Pending') {
                newStatus = 'Active';
                confirmMsg = 'Yakin menyetujui pendaftaran karyawan ini dan mengaktifkan akun?';
            } else {
                newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
                confirmMsg = `Yakin mengubah status karyawan menjadi ${newStatus}?`;
            }
            window.customConfirm(confirmMsg, async () => {
                try {
                    await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'updateUserStatus', user_id: id, status: newStatus }) });
                    showToast(currentStatus === 'Pending' ? 'Pendaftaran disetujui & Akun Aktif' : 'Status diubah', 'success');
                    loadUsers();
                } catch (e) { showToast('Gagal mengubah status', 'error'); }
            });
        }

        // ==== APPROVALS ====

        // Update sidebar badge showing pending approvals (safe if element missing)
        window.updatePendingBadge = function (count) {
            try {
                const n = Number(count) || 0;
                window.lastPendingCount = n;
                const el = document.getElementById('pendingBadge');
                if (!el) return;
                el.textContent = n;
                el.style.display = n > 0 ? 'inline-block' : 'none';
            } catch (e) { /* ignore */ }
        };

        window.loadApprovals = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getPendingLeaves`);
                const data = await res.json();
                window.allApprovals = data.requests || [];
                // Render with any active filters applied
                if (typeof applyApprovalFilters === 'function') applyApprovalFilters();

                // Update pending count badge automatically
                try {
                    const pendingCount = (window.allApprovals || []).filter(r => String(r.status) === 'Pending').length;
                    window.updatePendingBadge(pendingCount);
                } catch (e) { /* ignore */ }
            } catch (e) {
                console.error('Error loading approvals:', e);
                showToast('Gagal memuat data pengajuan', 'error');
            }
        }

        // Auto-refresh approvals (badge) every 60s while in admin area
        try {
            setInterval(() => { if (typeof loadApprovals === 'function') loadApprovals(); }, 60 * 1000);
            setTimeout(() => { if (typeof loadApprovals === 'function') loadApprovals(); }, 1500); // Initial badge load
        } catch (e) { /* ignore */ }

        // Format a date string as YY-MM-DD (tries several common formats)
        window.formatShortDate = function (d) {
            if (!d) return '';
            if (typeof d !== 'string') d = String(d);
            const ymd = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (ymd) return `${ymd[1].slice(2)}-${ymd[2]}-${ymd[3]}`;
            // Try to parse ISO-ish string
            const iso = d.match(/(\d{4})\/(\d{2})\/(\d{2})/);
            if (iso) return `${iso[1].slice(2)}-${iso[2]}-${iso[3]}`;
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) {
                const yy = String(dt.getFullYear()).slice(2);
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                return `${yy}-${mm}-${dd}`;
            }
            return d;
        }

        window.renderApprovals = function (reqs) {
            const body = document.getElementById('approvalBody');
            if (!body) return;
            const hasDecisionContent = reqs.some(r => String(r.status) === 'Pending');
            const approvalThead = document.getElementById('approvalThead');
            if (approvalThead) approvalThead.classList.toggle('hide-decision-col', !hasDecisionContent);
            const colspan = hasDecisionContent ? 9 : 8;
            if (!reqs.length) { body.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;padding:30px">Tidak ada pengajuan</td></tr>`; return; }
            body.innerHTML = reqs.map(r => {
                const statusText = {
                    Pending: 'Menunggu',
                    Approved: 'Disetujui',
                    Rejected: 'Ditolak'
                }[r.status] || r.status;
                const typeText = r.type || '—';
                const typeKey = String(typeText).toLowerCase();
                const typeChipClass = typeKey.includes('cuti') ? 'cuti' : (typeKey.includes('sakit') ? 'sakit' : (typeKey.includes('izin') ? 'izin' : 'other'));
                const startShort = window.formatShortDate(r.start_date);
                const endShort = window.formatShortDate(r.end_date);
                return `
    <tr>
      <td style="min-width:180px; max-width:220px; white-space:normal; line-height:1.4;"><strong>${r.user_name}</strong></td>
      <td><span class="approval-type-chip approval-type-${typeChipClass}"><span class="approval-type-dot"></span><span>${typeText}</span></span></td>
      <td style="white-space:nowrap">${startShort}</td>
      <td style="white-space:nowrap">${endShort}</td>
      <td style="max-width:180px;text-overflow:ellipsis;overflow:hidden">${r.reason}</td>
      <td>${r.attachment_url ? `<button class="btn btn-sm btn-ghost" onclick="viewDoc('${r.attachment_url}')"><i class="bi bi-file-earmark-text"></i> Lihat</button>` : '—'}</td>
      <td><span class="badge ${r.status === 'Pending' ? 'badge-warn' : r.status === 'Approved' ? 'badge-success' : 'badge-danger'}">${statusText}</span></td>
      <td>
        ${r.status === 'Pending' ? `
          <div class="action-btns" style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-success" onclick="processApproval('${r.request_id}', 'Approved')"><i class="bi bi-check-lg"></i> Terima</button>
            <button class="btn btn-sm btn-danger" onclick="processApproval('${r.request_id}', 'Rejected')"><i class="bi bi-x-lg"></i> Tolak</button>
          </div>
        ` : '—'}
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm btn-primary" onclick="editApproval('${r.request_id}')" style="padding:6px; border-radius:8px; line-height:1; display:inline-flex; align-items:center; justify-content:center;" title="Edit"><i class="bi bi-pencil-fill" style="font-size:14px;"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteLeaveAdmin('${r.request_id}')" style="background:#EF4444 !important; border-color:#EF4444 !important; color:#FFFFFF !important; padding:6px; border-radius:8px; line-height:1; display:inline-flex; align-items:center; justify-content:center;" title="Hapus"><i class="bi bi-trash-fill" style="font-size:14px;"></i></button>
        </div>
      </td>
    </tr>
  `;
            }).join('');
        }

        // Apply filters (name, type) to approvals and render
        window.applyApprovalFilters = function () {
            const nameEl = document.getElementById('appFilterName');
            const typeEl = document.getElementById('appFilterType');
            const name = nameEl ? nameEl.value.trim().toLowerCase() : '';
            const type = typeEl ? typeEl.value : '';
            let list = Array.isArray(window.allApprovals) ? window.allApprovals.slice() : [];
            if (name) {
                list = list.filter(r => (r.user_name || '').toLowerCase().includes(name));
            }
            if (type) {
                const typeArr = type.split(',');
                list = list.filter(r => typeArr.includes(r.type || ''));
            }
            renderApprovals(list);
        }

        window.resetApprovalFilters = function () {
            const nameEl = document.getElementById('appFilterName');
            const typeEl = document.getElementById('appFilterType');
            if (nameEl) nameEl.value = '';
            if (typeEl) {
                typeEl.value = '';
                // Reset badges visually
                const container = typeEl.nextElementSibling;
                if (container && container.classList.contains('filter-badges')) {
                    container.querySelectorAll('.badge').forEach(b => b.classList.remove('active'));
                    const defaultBadge = container.querySelector('.badge[data-val=""]');
                    if (defaultBadge) defaultBadge.classList.add('active');
                }
            }
            if (typeof applyApprovalFilters === 'function') applyApprovalFilters();
        }

        window.viewDoc = function (url) {
            const body = document.getElementById('modalDocBody');
            if (!body) return;
            const directUrl = getDirectDriveUrl(url);
            // Detect if it's an image or a document
            if (directUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || directUrl.includes('lh3.googleusercontent.com')) {
                body.innerHTML = `<img src="${directUrl}" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:8px;" onerror="this.outerHTML='<p style=color:var(--text-muted);text-align:center;padding:40px>Gagal memuat lampiran</p>'">`;
            } else {
                body.innerHTML = `<iframe src="${directUrl}" style="width:100%; height:70vh; border:none; border-radius:8px;" frameborder="0"></iframe>`;
            }
            document.getElementById('modalDoc').classList.remove('hidden');
        }

        window.processApproval = function (id, status) {
            window.customConfirm(`Yakin ${status === 'Approved' ? 'menerima' : 'menolak'} pengajuan ini?`, async () => {
                try {
                    await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'decideLeave', request_id: id, status, approved_by: userData.name }) });
                    showToast(`Pengajuan ${status}`, 'success'); loadApprovals(); loadDashboard();
                } catch (e) { showToast('Gagal memproses pengajuan', 'error'); }
            });
        }

        window.editApproval = function (id) {
            const r = window.allApprovals.find(x => x.request_id === id);
            if (!r) return;
            document.getElementById('editAppId').value = r.request_id;
            document.getElementById('editAppName').value = r.user_name;
            document.getElementById('editAppType').value = r.type;
            document.getElementById('editAppStart').value = r.start_date;
            document.getElementById('editAppEnd').value = r.end_date;
            document.getElementById('editAppReason').value = r.reason;
            document.getElementById('editAppStatus').value = r.status;
            // Populate existing attachment preview if any
            try {
                const attUrlEl = document.getElementById('editAppAttachmentUrl');
                const previewEl = document.getElementById('editAppAttachmentPreview');
                const fileInput = document.getElementById('editAppFile');
                if (attUrlEl) attUrlEl.value = r.attachment_url || '';
                if (previewEl) previewEl.innerHTML = r.attachment_url ? `<button class="btn btn-sm btn-ghost" onclick="viewDoc('${r.attachment_url}')"><i class="bi bi-file-earmark-text"></i> Lampiran Saat Ini</button>` : '';
                if (fileInput) fileInput.value = '';
            } catch (e) { /* ignore preview errors */ }
            document.getElementById('modalEditApproval').classList.remove('hidden');
        }

        window.saveEditApproval = async function (e) {
            e.preventDefault();
            const id = document.getElementById('editAppId').value;
            const type = document.getElementById('editAppType').value;
            const start_date = document.getElementById('editAppStart').value;
            const end_date = document.getElementById('editAppEnd').value;
            const reason = document.getElementById('editAppReason').value;
            const status = document.getElementById('editAppStatus').value;

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerHTML = 'Menyimpan...';
            try {
                const payload = { action: 'editLeave', request_id: id, type, start_date, end_date, reason, status };
                // Handle optional file upload
                const fileInput = document.getElementById('editAppFile');
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    try {
                        const file = fileInput.files[0];
                        const base64 = await toBase64(file);
                        payload.attachment_base64 = base64; // raw base64 string
                        payload.attachment_name = file.name;
                    } catch (errFile) { console.warn('File read failed', errFile); }
                } else {
                    // preserve existing attachment if any
                    const existing = document.getElementById('editAppAttachmentUrl') ? document.getElementById('editAppAttachmentUrl').value : '';
                    if (existing) payload.existing_attachment_url = existing;
                }

                const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                let data = null;
                try { data = await res.json(); } catch (e) { /* ignore parse error */ }

                // Consider success when server returns success flag or HTTP OK
                if ((res && res.ok && (data === null || data.success === undefined)) || (data && (data.success || data.updated || data.result === 'ok'))) {
                    showToast('Pengajuan berhasil diperbarui', 'success');
                    closeModal('modalEditApproval');
                    // Refresh approvals from datasheet to reflect immediate update
                    try { await loadApprovals(); } catch (e) { /* ignore */ }
                    if (typeof loadDashboard === 'function') loadDashboard();
                } else {
                    showToast((data && data.message) ? data.message : 'Gagal memperbarui pengajuan', 'error');
                }
            } catch (err) {
                showToast('Gagal memperbarui pengajuan', 'error');
            }
            btn.disabled = false; btn.innerHTML = 'Simpan';
        }

        window.deleteLeaveAdmin = function (id) {
            window.customConfirm('Apakah Anda yakin ingin menghapus data pengajuan ini secara permanen dari spreadsheet?', async () => {
                try {
                    const res = await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'deleteLeave',
                            request_id: id,
                            user_id: userData.user_id,
                            user_role: 'Admin'
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast('Data pengajuan berhasil dihapus!', 'success');
                        loadApprovals();
                        loadDashboard();
                    } else {
                        showToast(data.message || 'Gagal menghapus pengajuan', 'error');
                    }
                } catch (e) {
                    showToast('Data pengajuan berhasil dihapus!', 'success');
                    loadApprovals();
                    loadDashboard();
                }
            });
        }

        // ==== ATTENDANCE HISTORY ====
        window.attendanceLoadSeq = 0;

        window.loadAttendance = async function () {
            const loadSeq = ++window.attendanceLoadSeq;
            const startEl = document.getElementById('attFilterStart');
            const endEl = document.getElementById('attFilterEnd');
            const nameEl = document.getElementById('attFilterName');
            const statusEl = document.getElementById('attFilterStatus');
            const body = document.getElementById('attBody');
            const feed = document.getElementById('attendanceLiveFeed');

            // Default date range: last 7 days if user hasn't set filters
            const today = new Date();
            const toISO = d => d.toISOString().slice(0, 10);
            const defaultEnd = toISO(today);
            const defaultStart = toISO(new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)));

            const start = (startEl && startEl.value) ? startEl.value : (startEl ? (startEl.value = defaultStart) && defaultStart : defaultStart);
            const end = (endEl && endEl.value) ? endEl.value : (endEl ? (endEl.value = defaultEnd) && defaultEnd : defaultEnd);
            const name = nameEl ? nameEl.value.trim() : '';
            const status = statusEl ? statusEl.value : '';

            if (body) {
                body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Memuat data absensi...</td></tr>';
            }
            if (feed) {
                feed.setAttribute('aria-busy', 'true');
                feed.classList.remove('is-empty');
                feed.innerHTML = Array.from({ length: 4 }, () => '<div class="live-feed-card live-feed-loading" aria-hidden="true"></div>').join('');
            }

            try {
                const params = new URLSearchParams({
                    action: 'getAttendance',
                    start_date: start,
                    end_date: end
                });
                if (name) params.set('name', name);
                if (status) params.set('status', status);

                const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
                const data = await res.json();
                if (loadSeq !== window.attendanceLoadSeq) return;
                if (!data.success) throw new Error(data.message || 'Gagal memuat data absensi');

                window.allAttendance = data.records || [];
                renderAttendanceLiveFeed(window.allAttendance);
                renderAtt(window.allAttendance);
                renderAttendanceAnalytics(data.analytics);
            } catch (e) {
                if (loadSeq !== window.attendanceLoadSeq) return;
                console.error('Error loading attendance:', e);
                showToast('Gagal memuat data absensi', 'error');
                if (body) body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--danger)">Gagal memuat data</td></tr>';
                if (feed) {
                    feed.classList.add('is-empty');
                    feed.innerHTML = '<div class="live-feed-empty">Gagal memuat foto absensi</div>';
                }
            } finally {
                if (loadSeq === window.attendanceLoadSeq && feed) {
                    feed.removeAttribute('aria-busy');
                }
            }
        }

        window.renderAttendanceLiveFeed = function (records) {
            const container = document.getElementById('attendanceLiveFeed');
            if (!container) return;

            const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));

            const getSortTime = record => {
                const time = parseTime(record.clock_in_time) || '00:00';
                const stamp = new Date(`${record.date || ''}T${time}:00`).getTime();
                return Number.isNaN(stamp) ? 0 : stamp;
            };

            const latestPhotos = (records || [])
                .filter(record => record.photo_in_url || record.photo_in)
                .sort((a, b) => getSortTime(b) - getSortTime(a))
                .slice(0, 10);

            if (!latestPhotos.length) {
                container.classList.remove('has-scroll');
                container.classList.add('is-empty');
                container.innerHTML = '<div class="live-feed-empty">Belum ada foto absensi terbaru</div>';
                return;
            }

            container.classList.remove('is-empty');
            container.classList.toggle('has-scroll', latestPhotos.length > 4);
            container.innerHTML = latestPhotos.map(record => {
                const photo = getDirectDriveUrl(record.photo_in_url || record.photo_in);
                const status = record.status_in === 'Terlambat' ? 'Terlambat' : 'Tepat Waktu';
                const badgeClass = status === 'Terlambat' ? 'is-late' : 'is-on-time';
                const safePhoto = escapeHTML(photo);
                const safeName = escapeHTML(record.name || 'Karyawan');

                return `
                    <button type="button" class="live-feed-card" data-photo="${safePhoto}" onclick="viewPhoto(this.dataset.photo)" aria-label="Preview foto absensi ${safeName}">
                        <img src="${safePhoto}" alt="Foto absensi ${safeName}" loading="lazy" decoding="async" onerror="this.src='/img/profile.png'; this.onerror=null;">
                        <div class="live-feed-overlay">
                            <span class="live-feed-name">${safeName}</span>
                            <span class="live-feed-badge ${badgeClass}">${status}</span>
                        </div>
                    </button>
                `;
            }).join('');
        }

        window.renderAttendanceAnalytics = function (analytics) {
            const container = document.getElementById('attendanceAnalyticsContainer');
            if (!container) return;

            if (!analytics || (!analytics.top_absent?.length && !analytics.top_sick_permit?.length && !analytics.top_late?.length)) {
                container.style.display = 'none';
                return;
            }
            container.style.display = 'flex';

            const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));

            const buildList = (list, type) => {
                if (!list || !list.length) {
                    return `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">Tidak ada data mencukupi</div>`;
                }
                const statConfig = {
                    absent: { key: 'absent_days', suffix: 'Hari', className: 'stat-absent' },
                    sickPermit: { key: 'sick_permit_days', suffix: 'Hari', className: 'stat-sick-permit' },
                    late: { key: 'late_count', suffix: 'Kali', className: 'stat-late' }
                }[type] || { key: 'score', suffix: '', className: '' };

                return list.map((emp, idx) => {
                    const avatarHTML = hasProfilePic(emp.profile_pic_url) ?
                        `<img src="${getDirectDriveUrl(emp.profile_pic_url)}" class="avatar avatar-sm" style="width:36px; height:36px; object-fit:cover;" onerror="this.src='/img/profile.png'; this.onerror=null;">` :
                        `<img src="/img/profile.png" class="avatar avatar-sm" style="width:36px; height:36px; object-fit:cover;">`;

                    const rawValue = Number(emp[statConfig.key] || 0);
                    const statValue = `${rawValue} ${statConfig.suffix}`.trim();

                    return `
                        <div class="top-emp-item">
                            <div class="top-emp-left">
                                <span class="top-emp-rank">${idx + 1}</span>
                                ${avatarHTML}
                                <div class="top-emp-info">
                                    <span class="top-emp-name">${escapeHTML(emp.name || 'Karyawan')}</span>
                                    <span class="top-emp-pos">${escapeHTML(emp.position || 'Employee')}</span>
                                </div>
                            </div>
                            <span class="top-emp-stat ${statConfig.className}">${statValue}</span>
                        </div>
                    `;
                }).join('');
            };

            container.innerHTML = `
                <!-- Box 1: Paling Banyak Tidak Hadir -->
                <div class="analytics-card">
                    <h4 class="analytics-title">
                        <i class="bi bi-person-x-fill text-danger" style="font-size:16px;"></i> 
                        Top 3 Paling Banyak Tidak Hadir
                    </h4>
                    <div class="top-emp-list">
                        ${buildList(analytics.top_absent, 'absent')}
                    </div>
                </div>

                <!-- Box 2: Paling Sering Sakit & Izin -->
                <div class="analytics-card">
                    <h4 class="analytics-title">
                        <i class="bi bi-heart-pulse-fill text-warning" style="font-size:16px;"></i> 
                        Top 3 Paling Sering Sakit & Izin
                    </h4>
                    <div class="top-emp-list">
                        ${buildList(analytics.top_sick_permit, 'sickPermit')}
                    </div>
                </div>

                <!-- Box 3: Paling Sering Terlambat -->
                <div class="analytics-card">
                    <h4 class="analytics-title">
                        <i class="bi bi-alarm-fill text-danger" style="font-size:16px;"></i>
                        Top 3 Paling Sering Terlambat
                    </h4>
                    <div class="top-emp-list">
                        ${buildList(analytics.top_late, 'late')}
                    </div>
                </div>
            `;
        }

        window.renderAtt = function (records) {
            const body = document.getElementById('attBody');
            if (!records.length) { body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px">Data tidak ditemukan</td></tr>'; return; }
            body.innerHTML = records.map(r => {
                const inTime = parseTime(r.clock_in_time) || '--:--';
                const outTime = parseTime(r.clock_out_time) || '--:--';
                const dist = r.distance_meters || r.distance;
                const photo = r.photo_in_url || r.photo_in;
                const encodedData = encodeURIComponent(JSON.stringify(r));
                return `
    <tr>
      <td>
        <div class="user-cell" style="justify-content: flex-start; text-align: left;">
          ${hasProfilePic(r.profile_pic) ?
                        `<img src="${getDirectDriveUrl(r.profile_pic)}" class="avatar avatar-sm" style="object-fit:cover" onerror="this.src='/img/profile.png'; this.onerror=null;">` :
                        `<img src="/img/profile.png" class="avatar avatar-sm" style="object-fit:cover;">`
                    }
          <strong>${r.name}</strong>
        </div>
      </td>
      <td style="white-space:nowrap">${r.date}</td>
      <td><strong style="color:var(--text)">${inTime}</strong></td>
      <td><strong style="color:var(--text)">${outTime}</strong></td>
      <td>${dist ? dist + 'm' : '—'}</td>
      <td><span class="badge ${r.status_in === 'Terlambat' ? 'badge-warn' : (r.status_in === 'Absen' ? 'badge-danger' : 'badge-success')}">${r.status_in || '—'}</span></td>
      <td>${photo ? `<button class="btn btn-sm btn-ghost" onclick="viewPhoto('${getDirectDriveUrl(photo)}')"><i class="bi bi-camera"></i></button>` : '—'}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm btn-primary" onclick="editAttendance('${encodedData}')" style="padding:6px; border-radius:8px; line-height:1; display:inline-flex; align-items:center; justify-content:center;" title="Edit"><i class="bi bi-pencil-fill" style="font-size:14px;"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteAttendance('${encodedData}')" style="background:#EF4444 !important; border-color:#EF4444 !important; color:#FFFFFF !important; padding:6px; border-radius:8px; line-height:1; display:inline-flex; align-items:center; justify-content:center;" title="Hapus"><i class="bi bi-trash-fill" style="font-size:14px;"></i></button>
        </div>
      </td>
    </tr>
  `;
            }).join('');
        }

        window.exportCSV = function () {
            if (!window.allAttendance || window.allAttendance.length === 0) {
                showToast('Tidak ada data absensi untuk diekspor', 'error');
                return;
            }
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Nama,Tanggal,Jam Masuk,Jam Pulang,Jarak (m),Status\n";
            window.allAttendance.forEach(function (r) {
                let row = [
                    `"${r.name || ''}"`,
                    `"${r.date || ''}"`,
                    `"${parseTime(r.clock_in_time) || '--:--'}"`,
                    `"${parseTime(r.clock_out_time) || '--:--'}"`,
                    `"${r.distance_meters || r.distance || '-'}"`,
                    `"${r.status_in || '-'}"`
                ];
                csvContent += row.join(",") + "\n";
            });
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "data_absensi.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            document.body.removeChild(link);
            showToast('Ekspor CSV berhasil', 'success');
        }

        window.editAttendance = function (encodedStr) {
            const r = JSON.parse(decodeURIComponent(encodedStr));
            document.getElementById('editAttId').value = r.record_id || r.id || `${r.name}_${r.date}`;
            document.getElementById('editAttName').value = r.name;
            document.getElementById('editAttDate').value = r.date;
            document.getElementById('editAttIn').value = r.clock_in_time || '';
            document.getElementById('editAttOut').value = r.clock_out_time || '';
            document.getElementById('editAttStatus').value = r.status_in || 'Tepat Waktu';
            document.getElementById('editAttDistance').value = r.distance_meters || r.distance || 0;
            document.getElementById('modalEditAttendance').classList.remove('hidden');
        }

        window.saveEditAttendance = async function (e) {
            e.preventDefault();
            const id = document.getElementById('editAttId').value;
            const name = document.getElementById('editAttName').value;
            const date = document.getElementById('editAttDate').value;
            const clock_in = document.getElementById('editAttIn').value;
            const clock_out = document.getElementById('editAttOut').value;
            const status = document.getElementById('editAttStatus').value;
            const distance = document.getElementById('editAttDistance').value;

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerHTML = 'Menyimpan...';
            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'editAttendance',
                        record_id: id, name, date, clock_in, clock_out, status, distance
                    })
                });
                showToast('Absensi berhasil diperbarui', 'success');
                closeModal('modalEditAttendance');
                loadAttendance();
            } catch (err) {
                showToast('Gagal memperbarui absensi', 'error');
            }
            btn.disabled = false; btn.innerHTML = 'Simpan';
        }

        window.deleteAttendance = function (encodedStr) {
            const r = JSON.parse(decodeURIComponent(encodedStr));
            window.customConfirm(`Yakin ingin menghapus data absensi ${r.name} pada ${r.date}?`, async () => {
                try {
                    await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'deleteAttendance',
                            record_id: r.record_id || r.id,
                            name: r.name,
                            date: r.date
                        })
                    });
                    showToast('Absensi dihapus', 'success');
                    loadAttendance();
                } catch (e) {
                    showToast('Gagal menghapus absensi', 'error');
                }
            });
        }

        // ==== CONFIG ====
        let leafletMap = null;
        let configMarker = null;
        let configCircle = null;

        window.initLiveMap = function (lat, lng, radius) {
            const defaultLat = parseFloat(lat) || -6.4063219;
            const defaultLng = parseFloat(lng) || 106.7731088;
            const defaultRadius = parseFloat(radius) || 50;

            const mapDiv = document.getElementById('configMap');
            if (!mapDiv) return;

            if (!leafletMap) {
                leafletMap = L.map('configMap').setView([defaultLat, defaultLng], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(leafletMap);

                configMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(leafletMap);
                configCircle = L.circle([defaultLat, defaultLng], {
                    radius: defaultRadius,
                    color: 'var(--primary)',
                    fillColor: 'var(--primary-glow)',
                    fillOpacity: 0.4
                }).addTo(leafletMap);

                // Update inputs when marker is dragged
                configMarker.on('dragend', function (e) {
                    const position = configMarker.getLatLng();
                    document.getElementById('cfg_lat').value = position.lat.toFixed(7);
                    document.getElementById('cfg_lng').value = position.lng.toFixed(7);
                    updateMapCircle();
                });

                // Update inputs when map is clicked
                leafletMap.on('click', function (e) {
                    const position = e.latlng;
                    configMarker.setLatLng(position);
                    document.getElementById('cfg_lat').value = position.lat.toFixed(7);
                    document.getElementById('cfg_lng').value = position.lng.toFixed(7);
                    updateMapCircle();
                });

                // Attach inputs update listener
                const inputs = ['cfg_lat', 'cfg_lng', 'cfg_radius'];
                inputs.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.addEventListener('input', updateMapCircle);
                    }
                });
            } else {
                leafletMap.setView([defaultLat, defaultLng], 16);
                configMarker.setLatLng([defaultLat, defaultLng]);
                configCircle.setLatLng([defaultLat, defaultLng]);
                configCircle.setRadius(defaultRadius);
            }

            setTimeout(() => leafletMap.invalidateSize(), 300);
        }

        window.updateMapCircle = function () {
            const lat = parseFloat(document.getElementById('cfg_lat').value) || 0;
            const lng = parseFloat(document.getElementById('cfg_lng').value) || 0;
            const radius = parseFloat(document.getElementById('cfg_radius').value) || 50;

            if (configMarker && configCircle && leafletMap) {
                const newPos = [lat, lng];
                configMarker.setLatLng(newPos);
                configCircle.setLatLng(newPos);
                configCircle.setRadius(radius);
                leafletMap.panTo(newPos);
            }
        }

        window.loadConfig = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getConfig`);
                const data = await res.json();
                if (data.config) {
                    const lat = data.config.office_latitude || '';
                    const lng = data.config.office_longitude || '';
                    const radius = data.config.max_radius_meters || 50;

                    if (document.getElementById('cfg_lat')) document.getElementById('cfg_lat').value = lat;
                    if (document.getElementById('cfg_lng')) document.getElementById('cfg_lng').value = lng;
                    if (document.getElementById('cfg_radius')) document.getElementById('cfg_radius').value = radius;
                    if (document.getElementById('cfg_wday_start')) document.getElementById('cfg_wday_start').value = parseTime(data.config.weekday_start) || '';
                    if (document.getElementById('cfg_wday_end')) document.getElementById('cfg_wday_end').value = parseTime(data.config.weekday_end) || '';
                    if (document.getElementById('cfg_tolerance')) document.getElementById('cfg_tolerance').value = data.config.tolerance_minutes || 15;
                    if (document.getElementById('cfg_sat_start')) document.getElementById('cfg_sat_start').value = parseTime(data.config.saturday_start) || '';
                    if (document.getElementById('cfg_sat_end')) document.getElementById('cfg_sat_end').value = parseTime(data.config.saturday_end) || '';
                    if (document.getElementById('cfg_wa_admin')) document.getElementById('cfg_wa_admin').value = data.config.wa_admin || '';
                    if (document.getElementById('cfg_email_hrd')) document.getElementById('cfg_email_hrd').value = data.config.email_hrd || '';

                    initLiveMap(lat, lng, radius);
                }
                let holidays = data.holidays;
                if (!holidays) {
                    try {
                        const hRes = await fetch(`${APPS_SCRIPT_URL}?action=getHolidays`);
                        const hData = await hRes.json();
                        holidays = hData.holidays || [];
                    } catch (err) {
                        holidays = [];
                    }
                }
                renderHolidays(holidays);
            } catch (e) { renderHolidays([]); }
        }

        window.saveConfig = async function () {
            const payload = {
                action: 'saveConfig',
                office_latitude: document.getElementById('cfg_lat') ? document.getElementById('cfg_lat').value : '',
                office_longitude: document.getElementById('cfg_lng') ? document.getElementById('cfg_lng').value : '',
                max_radius_meters: document.getElementById('cfg_radius') ? document.getElementById('cfg_radius').value : '',
                weekday_start: document.getElementById('cfg_wday_start') ? document.getElementById('cfg_wday_start').value : '',
                weekday_end: document.getElementById('cfg_wday_end') ? document.getElementById('cfg_wday_end').value : '',
                tolerance_minutes: document.getElementById('cfg_tolerance') ? document.getElementById('cfg_tolerance').value : '',
                saturday_start: document.getElementById('cfg_sat_start') ? document.getElementById('cfg_sat_start').value : '',
                saturday_end: document.getElementById('cfg_sat_end') ? document.getElementById('cfg_sat_end').value : '',
                wa_admin: document.getElementById('cfg_wa_admin') ? document.getElementById('cfg_wa_admin').value : '',
                email_hrd: document.getElementById('cfg_email_hrd') ? document.getElementById('cfg_email_hrd').value : ''
            };
            try {
                await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                showToast('Konfigurasi disimpan', 'success');
            } catch (e) { showToast('Gagal menyimpan konfigurasi', 'error'); }
        }

        window.renderHolidays = function (holidays) {
            window.allHolidays = holidays;
            if (typeof renderCalendar === 'function') renderCalendar();
            const list = document.getElementById('holidayList');
            if (!list) return;
            if (!holidays.length) { list.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px">Belum ada data hari libur</div>'; return; }
            list.innerHTML = holidays.map(h => {
                const dateText = h.start_date === h.end_date ? h.start_date : `${h.start_date} s/d ${h.end_date}`;
                const id = h.holiday_id || h.id;
                return `
                    <div class="holiday-item" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-deep); border-radius:10px; padding:12px 16px; margin-bottom:8px; border:1px solid var(--border);">
                        <div class="holiday-info">
                            <span class="holiday-desc" style="font-weight:700; color:var(--text);">${h.description}</span>
                            <span class="holiday-date" style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;"><i class="bi bi-calendar3"></i> ${dateText}</span>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button class="edit-btn-pos btn-neu-3d" onclick="editHoliday('${id}')" style="background:rgba(255,183,3,0.12); border:1px solid rgba(255,183,3,0.3); color:var(--primary); border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;"><i class="bi bi-pencil-fill"></i></button>
                            <button class="del-btn btn-neu-3d" onclick="delHoliday('${id}')" style="background:rgba(231,76,60,0.12); border:1px solid rgba(231,76,60,0.3); color:#e74c3c; border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;"><i class="bi bi-trash-fill"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        window.addHoliday = async function () {
            const start = document.getElementById('holiday_start_date').value;
            const end = document.getElementById('holiday_end_date').value || start;
            const desc = document.getElementById('holiday_desc').value;
            if (!start || !desc) { showToast('Lengkapi tanggal mulai & keterangan libur', 'warn'); return; }
            try {
                if (oldId) {
                    await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({ action: 'deleteHoliday', holiday_id: oldId })
                    });
                }

                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'addHoliday',
                        start_date: start,
                        end_date: end,
                        description: desc
                    })
                });

                showToast(oldId ? 'Hari libur berhasil diperbarui' : 'Hari libur ditambahkan', 'success');
                document.getElementById('holiday_old_id').value = '';
                document.getElementById('holiday_start_date').value = '';
                document.getElementById('holiday_end_date').value = '';
                document.getElementById('holiday_desc').value = '';

                document.getElementById('holidayBtnText').textContent = 'Tambah';
                document.getElementById('holidayBtnIcon').className = 'bi bi-plus-lg';

                loadConfig();
            } catch (e) {
                showToast(oldId ? 'Gagal memperbarui hari libur' : 'Gagal menambah hari libur', 'error');
            }
        }

        window.delHoliday = async function (id) {
            window.customConfirm('Hapus hari libur ini secara permanen?', async () => {
                try {
                    await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteHoliday', holiday_id: id }) });
                    showToast('Hari libur dihapus', 'success'); loadConfig();
                } catch (e) { showToast('Gagal menghapus hari libur', 'error'); }
            });
        }

        window.editHoliday = function (id) {
            const hol = window.allHolidays.find(h => (h.holiday_id || h.id || h.start_date) === id);
            if (!hol) return;
            document.getElementById('holiday_old_id').value = id;
            document.getElementById('holiday_start_date').value = hol.start_date;
            document.getElementById('holiday_end_date').value = hol.end_date || hol.start_date;
            document.getElementById('holiday_desc').value = hol.description;

            document.getElementById('holidayBtnText').textContent = 'Simpan Perubahan';
            document.getElementById('holidayBtnIcon').className = 'bi bi-check-circle-fill';
        };

        window.loadHolidays = function () {
            loadConfig();
        }

        // ============ POSISI & DIVISI CRUD FUNCTIONS ============
        window.allPositions = [];
        window.loadPositions = async function () {
            const body = document.getElementById('positionsTableBody');
            const summary = document.getElementById('divisionSummaryChart');
            const filterSelect = document.getElementById('posDivisionFilter');

            if (body) body.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--text-muted)">Memuat data jabatan...</td></tr>';
            if (summary) summary.innerHTML = '<div style="text-align:center; color:var(--text-muted)">Memuat data chart...</div>';

            try {
                if (window.loadDivisions) await window.loadDivisions();

                const res = await fetch(`${APPS_SCRIPT_URL}?action=getPositions`);
                const data = await res.json();
                if (data.success && data.positions) {
                    window.allPositions = data.positions;

                    // Render Table
                    renderPositionsTable(window.allPositions);

                    // Render Division filter dropdown
                    const divisions = [...new Set(data.positions.map(p => p.division || 'Unassigned'))].sort();
                    if (filterSelect) {
                        const currentVal = filterSelect.value;
                        filterSelect.innerHTML = '<option value="">Semua Divisi</option>' +
                            divisions.map(d => `<option value="${d}">${d}</option>`).join('');
                        filterSelect.value = currentVal;
                    }

                    // Populate employee registration select dropdown
                    const regSelect = document.getElementById('regPosition');
                    if (regSelect) {
                        regSelect.innerHTML = '<option value="" disabled selected>Pilih Jabatan...</option>' +
                            data.positions.map(p => `<option value="${p.position}">${p.position} (${p.division || 'Unassigned'})</option>`).join('');
                    }

                    // Compute and render Division Bento Summary Chart
                    const divCounts = {};
                    data.positions.forEach(p => {
                        const div = p.division || 'Unassigned';
                        divCounts[div] = (divCounts[div] || 0) + 1;
                    });

                    if (summary) {
                        const maxVal = Math.max(...Object.values(divCounts), 1);
                        summary.innerHTML = Object.entries(divCounts).map(([divName, count]) => {
                            const pct = Math.min(100, Math.round((count / maxVal) * 100));
                            return `
                                <div style="display:flex; flex-direction:column; gap:6px;">
                                    <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:var(--text);">
                                        <span>${divName}</span>
                                        <span style="color:var(--primary); font-weight:800;">${count} Jabatan</span>
                                    </div>
                                    <div style="background:var(--bg-deep); height:8px; border-radius:10px; overflow:hidden; border:1px solid var(--border); position:relative;">
                                        <div style="background:var(--primary); height:100%; width: ${pct}%; border-radius:10px; transition: width 0.8s ease;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                } else {
                    if (body) body.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--text-muted)">Gagal memuat data jabatan.</td></tr>';
                }
            } catch (err) {
                console.error("loadPositions error:", err);
                if (body) body.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--text-muted)">Koneksi terputus. Gagal memuat data.</td></tr>';
            }
        }

        window.renderPositionsTable = function (list) {
            const body = document.getElementById('positionsTableBody');
            if (!body) return;
            if (!list.length) {
                body.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted)">Belum ada data jabatan.</td></tr>';
                return;
            }
            body.innerHTML = list.map(p => `
                <tr style="border-bottom:1px solid var(--border)">
                  <td style="font-weight:700; color:var(--text); padding:12px; border-right:1px solid var(--border);">${p.position}</td>
                  <td style="font-weight:600; color:var(--text-muted); padding:12px; border-right:1px solid var(--border);">${p.division || 'Unassigned'}</td>
                  <td style="text-align:center; padding:12px;">
                    <div style="display:flex; justify-content:center; gap:8px;">
                      <button class="btn btn-sm btn-ghost text-primary btn-neu-3d" onclick="editPositionAdmin('${p.position}', '${p.division || 'Umum'}')" title="Edit Jabatan" style="border-radius:50%; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; padding:0;">
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                      <button class="btn btn-sm btn-ghost text-danger btn-neu-3d" onclick="deletePositionAdmin('${p.position}')" title="Hapus Jabatan" style="border-radius:50%; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; padding:0;">
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
            `).join('');
        }

        window.editPositionAdmin = function (posName, divName) {
            document.getElementById('pos_name').value = posName;
            document.getElementById('pos_division').value = divName;
        };

        window.filterPositionsTable = function (division) {
            if (!division) {
                renderPositionsTable(window.allPositions);
            } else {
                const filtered = window.allPositions.filter(p => p.division === division);
                renderPositionsTable(filtered);
            }
        }

        window.addPositionAdmin = async function () {
            const pos = document.getElementById('pos_name').value.trim();
            const div = document.getElementById('pos_division').value.trim();
            if (!pos || !div) {
                showToast('Nama jabatan dan divisi wajib diisi!', 'warn');
                return;
            }
            try {
                const res = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'addPosition',
                        position: pos,
                        division: div
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Jabatan baru berhasil disimpan!', 'success');
                    document.getElementById('pos_name').value = '';
                    document.getElementById('pos_division').value = '';
                    loadPositions();
                } else {
                    showToast(data.message || 'Gagal menyimpan jabatan', 'error');
                }
            } catch (err) {
                showToast('Koneksi terputus. Gagal menyimpan data.', 'error');
            }
        }

        window.deletePositionAdmin = async function (posName) {
            window.customConfirm(`Apakah Anda yakin ingin menghapus jabatan "${posName}" secara permanen? Karyawan yang menjabat jabatan ini mungkin perlu diperbarui.`, async () => {
                try {
                    const res = await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'deletePosition',
                            position: posName
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast('Jabatan berhasil dihapus!', 'success');
                        loadPositions();
                    } else {
                        showToast(data.message || 'Gagal menghapus jabatan', 'error');
                    }
                } catch (err) {
                    showToast('Koneksi terputus. Gagal menghapus data.', 'error');
                }
            });
        }

        // ============ LAPORAN & JATAH CUTI FUNCTIONS ============
        window.loadLeaveReport = async function () {
            const start = document.getElementById('repFilterStart').value;
            const end = document.getElementById('repFilterEnd').value;
            const tbody = document.getElementById('leaveReportBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px">Memuat laporan...</td></tr>';
            }

            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getLeaveReport&start_date=${start}&end_date=${end}`);
                const data = await res.json();
                if (data.success && data.report) {
                    window.allLeaveReports = data.report;
                    renderLeaveReport(window.allLeaveReports);
                } else {
                    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Gagal memuat laporan</td></tr>';
                }
            } catch (e) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Gagal memuat laporan</td></tr>';
            }
        }

        window.renderLeaveReport = function (report) {
            const tbody = document.getElementById('leaveReportBody');
            if (!tbody) return;
            if (!report.length) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px">Tidak ada data karyawan</td></tr>';
                return;
            }
            tbody.innerHTML = report.map(r => {
                const profileSrc = hasProfilePic(r.profile_pic_url) ? getDirectDriveUrl(r.profile_pic_url) : '/img/profile.png';

                return `
                    <tr>
                        <td style="text-align:center; padding: 6px 12px;">
                            <img src="${profileSrc}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #c2c2c24f; display:block; margin:0 auto;" alt="${r.name}" onerror="this.src='/img/profile.png'; this.onerror=null;">
                        </td>
                        <td><strong>${r.name}</strong></td>
                        <td><span class="badge badge-info">${r.position}</span></td>
                        <td style="text-align:center; font-weight:700; font-size:14px; color:var(--primary);">${r.allowed_leave_quota} Hari</td>
                        <td style="text-align:center; font-weight:700; font-size:14px; color:var(--success);">${r.remaining_leave_quota} Hari</td>
                        <td style="text-align:center; font-weight:600; color:var(--danger);">${r.sick_count} Hari</td>
                        <td style="text-align:center; font-weight:600; color:var(--warning);">${r.permit_count} Hari</td>
                        <td style="text-align:center; font-weight:600; color:var(--primary);">${r.cuti_count} Hari</td>
                        <td style="text-align:center;">
                            <button class="btn btn-sm btn-ghost" onclick="adjustQuota('${r.user_id}', '${r.name}', ${r.allowed_leave_quota})" style="padding:6px 12px; border-radius:50px; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                                <i class="bi bi-pencil-square"></i> Edit Jatah
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        window.adjustQuota = function (userId, name, currentQuota) {
            document.getElementById('adjustUserId').value = userId;
            document.getElementById('adjustUserName').value = name;
            document.getElementById('adjustAllowedQuota').value = currentQuota;
            document.getElementById('modalAdjustQuota').classList.remove('hidden');
        }

        window.submitAdjustQuota = async function (e) {
            e.preventDefault();
            const userId = document.getElementById('adjustUserId').value;
            const name = document.getElementById('adjustUserName').value;
            const quota = document.getElementById('adjustAllowedQuota').value;

            showToast('Menyimpan...', 'warn');
            try {
                const res = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'updateLeaveQuota',
                        user_id: userId,
                        name: name,
                        allowed_leave_quota: Number(quota)
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Jatah cuti berhasil diperbarui!', 'success');
                    closeModal('modalAdjustQuota');
                    loadLeaveReport();
                } else {
                    showToast(data.message || 'Gagal menyimpan', 'error');
                }
            } catch (err) {
                showToast('Jatah cuti berhasil diperbarui!', 'success');
                closeModal('modalAdjustQuota');
                loadLeaveReport();
            }
        }

        window.toggleCompactSidebar = function () {
            const layout = document.querySelector('.admin-layout');
            const icon = document.getElementById('compactIcon');
            if (layout) {
                const isCompact = layout.classList.toggle('sidebar-compact');
                if (icon) {
                    icon.className = isCompact ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
                }
                try { localStorage.setItem('hris_sidebar_compact', isCompact ? '1' : '0'); } catch (e) { /* ignore */ }
            }
        }

        document.addEventListener('sidebarLoaded', () => {
            // Restore last sidebar compact state (persisted across pages)
            try {
                const compact = localStorage.getItem('hris_sidebar_compact');
                const layout = document.querySelector('.admin-layout');
                const icon = document.getElementById('compactIcon');
                if (compact === '1') {
                    if (layout && !layout.classList.contains('sidebar-compact')) layout.classList.add('sidebar-compact');
                    if (icon) icon.className = 'bi bi-chevron-right';
                } else if (compact === '0') {
                    if (layout && layout.classList.contains('sidebar-compact')) layout.classList.remove('sidebar-compact');
                    if (icon) icon.className = 'bi bi-chevron-left';
                }
            } catch (e) { /* ignore */ }

            if (window.lastPendingCount !== undefined) {
                window.updatePendingBadge(window.lastPendingCount);
            }
            if (window.lastInactiveCount !== undefined) {
                const badge = document.getElementById('inactiveTalentsBadge');
                if (badge) {
                    badge.textContent = window.lastInactiveCount;
                    badge.style.display = window.lastInactiveCount > 0 ? 'inline-block' : 'none';
                }
            }
        });
    })();
}

if (currentPage === 'attendance.html' || (currentPage === '' && 'attendance.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL;
        let MAX_RADIUS = 100;
        let OFFICE_LAT = 0;
        let OFFICE_LNG = 0;

        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData) window.location.href = window.getRedirectUrl('index');

        let geoOk = false;
        let photoOk = false;
        let currentDist = 0;
        let photoBase64 = null;
        let stream = null;
        let isLockedOut = false;
        let attendanceMode = 'in'; // 'in' or 'out'

        let geoWatchId = null;
        let currentLat = null;
        let currentLng = null;

        // ---- CLOCK ----
        const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        window.tick = function () {
            const now = new Date();
            document.getElementById('clockDisplay').textContent =
                [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
            document.getElementById('clockDate').textContent =
                `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
        }
        tick(); setInterval(tick, 1000);

        // ---- TOAST ----
        window.showToast = function (msg, type = 'success') {
            const t = document.getElementById('toastEl');
            t.textContent = msg;
            t.className = `toast ${type} show`;
            setTimeout(() => { t.className = `toast ${type}`; }, 3500);
        }

        // ---- HAVERSINE ----
        window.haversine = function (lat1, lng1, lat2, lng2) {
            const R = 6371000;
            const rad = x => x * Math.PI / 180;
            const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        // ---- GEOFENCE ----
        window.updateGeoUI = function (dist, safe) {
            const widget = document.getElementById('geoWidget');
            const dot = document.getElementById('geoDot');
            const icon = document.getElementById('geoIcon');
            const title = document.getElementById('geoTitle');
            const distEl = document.getElementById('geoDistance');
            const cls = safe ? 'safe' : 'unsafe';
            widget.className = `geo-widget ${cls}`;
            dot.className = `geo-status-dot ${cls}`;
            icon.className = `geo-icon ${cls}`;
            icon.textContent = safe ? '✅' : '🔒';
            title.textContent = safe
                ? 'Anda berada di area kantor'
                : 'Anda di luar area kantor';
            distEl.innerHTML =
                `Jarak dari kantor:
    <strong>${Math.round(dist)} meter</strong>
    <br>Maksimal radius:
    <strong>${MAX_RADIUS} meter</strong>`;
        }

        window.startGeo = function () {

            if (!navigator.geolocation) {

                showToast(
                    'Browser tidak mendukung GPS',
                    'error'
                );

                return;
            }

            // stop watch lama
            if (geoWatchId) {
                navigator.geolocation.clearWatch(geoWatchId);
            }

            // Track best accuracy reading
            let bestAccuracy = 9999;

            // Collect multiple readings for median filtering (improves laptop accuracy)
            let positionSamples = [];
            const MIN_SAMPLES = 3;
            const MAX_SAMPLES = 8;
            let settled = false;

            function medianOf(arr) {
                const sorted = [...arr].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            }

            function processPosition(pos) {
                const accuracy = Number(pos.coords.accuracy || 999);
                const lat = Number(pos.coords.latitude);
                const lng = Number(pos.coords.longitude);

                // Collect sample
                positionSamples.push({ lat, lng, accuracy });
                if (positionSamples.length > MAX_SAMPLES) {
                    positionSamples.shift();
                }

                // Keep position with best accuracy
                if (accuracy <= bestAccuracy) {
                    bestAccuracy = accuracy;
                    currentLat = lat;
                    currentLng = lng;
                }

                // Use median filtering when we have enough samples for better accuracy
                if (!settled && positionSamples.length >= MIN_SAMPLES) {
                    const goodSamples = positionSamples.filter(s => s.accuracy <= 200);
                    if (goodSamples.length >= MIN_SAMPLES) {
                        currentLat = medianOf(goodSamples.map(s => s.lat));
                        currentLng = medianOf(goodSamples.map(s => s.lng));
                        bestAccuracy = Math.min(...goodSamples.map(s => s.accuracy));
                        settled = true;
                    }
                }

                // Require reasonable accuracy (200m for laptops, improves over time)
                if (bestAccuracy > 200) {

                    geoOk = false;

                    updateGeoUI(
                        9999,
                        false
                    );

                    document.getElementById(
                        'geoTitle'
                    ).textContent =
                        'Menunggu GPS Akurat';

                    document.getElementById(
                        'geoDistance'
                    ).innerHTML =
                        `Akurasi GPS: <strong>${Math.round(bestAccuracy)}m</strong><br>Sampel: ${positionSamples.length}/${MIN_SAMPLES}<br>Mohon tunggu, sedang mencari sinyal...`;

                    checkReady();

                    return;
                }

                const dist = haversine(
                    currentLat,
                    currentLng,
                    OFFICE_LAT,
                    OFFICE_LNG
                );

                currentDist = Number(dist);

                geoOk = currentDist <= Number(MAX_RADIUS);

                console.log('USER GPS', {
                    lat: currentLat,
                    lng: currentLng,
                    accuracy: bestAccuracy,
                    samples: positionSamples.length,
                    settled: settled
                });

                console.log('OFFICE GPS', {
                    lat: OFFICE_LAT,
                    lng: OFFICE_LNG,
                    radius: MAX_RADIUS
                });

                console.log('DISTANCE', currentDist);

                updateGeoUI(
                    currentDist,
                    geoOk
                );

                checkReady();
            }

            function handleError(err) {
                geoOk = false;

                document.getElementById(
                    'geoTitle'
                ).textContent =
                    'GPS Tidak Aktif';

                document.getElementById(
                    'geoDistance'
                ).textContent =
                    'Izinkan akses lokasi';

                showToast(
                    'Aktifkan GPS dan izinkan akses lokasi',
                    'error'
                );

                checkReady();
            }

            const geoOptions = {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 30000
            };

            // First, get a quick initial position
            navigator.geolocation.getCurrentPosition(
                processPosition,
                function () { /* ignore initial error, watchPosition will retry */ },
                geoOptions
            );

            // Then continuously watch for more accurate positions
            geoWatchId = navigator.geolocation.watchPosition(
                processPosition,
                handleError,
                geoOptions
            );
        }
        // ---- CAMERA ----
        let currentFacingMode = 'user';
        window.flipCamera = async function () {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
            await startCamera();
        };

        window.startCamera = async function () {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: currentFacingMode, width: { ideal: 640 }, height: { ideal: 480 } }
                });
                const video = document.getElementById('videoEl');
                video.srcObject = stream;
                // Don't mirror environment camera
                video.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
                document.getElementById('cameraOverlay').classList.add('hidden');
                document.getElementById('faceGuide').style.display = 'block';
                document.getElementById('btnCapture').disabled = false;
                document.getElementById('cameraToggle').textContent = 'On-Cam ✓';
                document.getElementById('cameraToggle').style.color = 'var(--success)';
                const flipBtn = document.getElementById('btnFlipCamera');
                if (flipBtn) flipBtn.style.display = 'inline-flex';
            } catch (e) {
                showToast('Gagal mengakses kamera. Izinkan akses kamera.', 'error');
            }
        }

        window.capturePhoto = function () {
            const video = document.getElementById('videoEl');
            const canvas = document.getElementById('photoCanvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.scale(-1, 1); // Mirror
            ctx.drawImage(video, -canvas.width, 0);
            ctx.restore();
            photoBase64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];

            // Show preview
            const img = document.getElementById('capturedImg');
            img.src = canvas.toDataURL('image/jpeg', 0.75);
            img.style.display = 'block';

            // Stop stream
            if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
            document.getElementById('videoEl').style.display = 'none';
            document.getElementById('faceGuide').style.display = 'none';
            document.getElementById('btnCapture').style.display = 'none';
            document.getElementById('btnRetake').style.display = 'block';

            photoOk = true;
            checkReady();
            showToast('Foto berhasil diambil ✓', 'success');
        }

        window.retakePhoto = function () {
            photoOk = false; photoBase64 = null;
            document.getElementById('capturedImg').style.display = 'none';
            document.getElementById('capturedImg').src = '';
            document.getElementById('videoEl').style.display = 'block';
            document.getElementById('btnCapture').style.display = 'block';
            document.getElementById('btnCapture').disabled = false;
            document.getElementById('btnRetake').style.display = 'none';
            checkReady();
            startCamera();
        }

        // ---- READY CHECK ----
        window.checkReady = function () {
            const btn = document.getElementById('mainBtn');
            const ready = !isLockedOut && photoOk && geoOk;
            btn.disabled = !ready;
            btn.classList.toggle('clock-floating', ready);
        }

        // ---- PRE-FLIGHT CHECK ----
        window.preFlightCheck = async function () {
            if (new Date().getDay() === 0) {
                showLock('holiday', 'Libur Operasional (Hari Kerja: Senin - Sabtu)');
                return;
            }
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=preflight&user_id=${userData.user_id}`);
                const data = await res.json();
                if (!data.success) {
                    // Locked
                    showLock(data.lock_type, data.message);
                    return;
                }
                // Set mode
                attendanceMode = data.has_clocked_in && !data.has_clocked_out ? 'out' : 'in';
                const btn = document.getElementById('mainBtn');
                btn.textContent = attendanceMode === 'in' ? '⬆ CLOCK IN' : '⬇ CLOCK OUT';
                btn.className = `btn-clock ${attendanceMode === 'in' ? 'clock-in' : 'clock-out'}`;
                document.getElementById('headerSub').textContent = attendanceMode === 'in' ? 'Siap Clock In' : 'Siap Clock Out';

                // Get config
                if (data.config) {

                    OFFICE_LAT = parseFloat(
                        data.config.office_latitude || 0
                    );

                    OFFICE_LNG = parseFloat(
                        data.config.office_longitude || 0
                    );

                    MAX_RADIUS = parseFloat(
                        data.config.max_radius_meters || 100
                    );

                    if (isNaN(OFFICE_LAT)) OFFICE_LAT = 0;
                    if (isNaN(OFFICE_LNG)) OFFICE_LNG = 0;
                    if (isNaN(MAX_RADIUS)) MAX_RADIUS = 100;

                    console.log('OFFICE CONFIG', {
                        OFFICE_LAT,
                        OFFICE_LNG,
                        MAX_RADIUS
                    });
                }

                startGeo();
            } catch (e) {
                console.error(e);
                document.getElementById('headerSub').textContent = 'Koneksi ke Server Terputus';
                showToast('Gagal memuat konfigurasi absensi dari server', 'error');
                isLockedOut = true;
                checkReady();
            }
        }

        window.showLock = function (type, reason) {
            isLockedOut = true;
            const banner = document.getElementById('lockBanner');
            banner.classList.add('show');
            document.getElementById('lockTitle').textContent =
                type === 'holiday' ? '🎉 Hari Libur' :
                    type === 'leave' ? '📋 Status Cuti/Izin' : '🔒 Absensi Dikunci';
            document.getElementById('lockReason').textContent = reason;
            document.getElementById('mainBtn').disabled = true;
            document.getElementById('headerSub').textContent = 'Tidak tersedia hari ini';

            // Show Popup Centered Modal
            if (window.showModalAlert) {
                window.showModalAlert(
                    type === 'holiday' ? 'Hari Libur Operasional' : 'Absensi Terkunci',
                    reason,
                    type === 'holiday' ? 'info' : 'warn'
                );
            }
        }

        // ---- SUBMIT ----
        window.submitAttendance = async function () {
            if (!photoOk) { showToast('Pastikan foto selfie sudah siap', 'warn'); return; }
            if (!geoOk) {
                showToast(`Anda berada di luar radius ${MAX_RADIUS} meter dari kantor`, 'error');
                return;
            }

            if (!currentLat || !currentLng) {

                showToast(
                    'GPS belum valid',
                    'error'
                );

                return;
            }

            if (Number(currentDist) > Number(MAX_RADIUS)) {
                geoOk = false;
                updateGeoUI(currentDist, false);
                checkReady();
                showToast(`Jarak ${Math.round(currentDist)}m melebihi batas ${MAX_RADIUS}m`, 'error');
                return;
            }

            const btn = document.getElementById('mainBtn');
            const origText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '⏳ Menyimpan...';

            try {
                const n = new Date();
                const pad = (v) => String(v).padStart(2, '0');
                const clientTime = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;

                const payload = {
                    action: attendanceMode === 'in' ? 'clockIn' : 'clockOut',

                    user_id: userData.user_id,

                    lat: currentLat,

                    lng: currentLng,

                    office_lat: OFFICE_LAT,

                    office_lng: OFFICE_LNG,

                    distance_meters: Math.round(currentDist),

                    photo_base64: photoBase64,
                    client_time: clientTime
                };


                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.success) {
                    const actionLabel = attendanceMode === 'in' ? 'Clock In' : 'Clock Out';
                    const successMessage = `${actionLabel} berhasil${result.status ? ` dengan status ${result.status}` : ''}.`;
                    showToast(successMessage, 'success');
                    if (typeof window.showModalAlert === 'function') {
                        window.showModalAlert('Absensi Berhasil', successMessage, 'success');
                    }
                    setTimeout(() => window.location.href = window.getRedirectUrl('employee'), 2800);
                } else {
                    showToast(result.message || 'Gagal menyimpan absensi', 'error');
                    btn.disabled = false;
                    btn.textContent = origText;
                }
            } catch (e) {
                console.error(e);
                showToast('Gagal terhubung ke server', 'error');
                btn.disabled = false;
                btn.textContent = origText;
            }
        }

        // INIT
        preFlightCheck();
    })();
}

if (currentPage === 'employee.html' || (currentPage === '' && 'employee.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL;

        // Auth Guard
        let userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData || userData.role !== 'Employee') { window.location.href = window.getRedirectUrl('index'); }

        // Profile
        const unEl = document.getElementById('userName');
        if (unEl) unEl.textContent = userData?.name || '—';
        const upEl = document.getElementById('userPosition');
        if (upEl) upEl.textContent = userData?.position || '—';
        const initials = (userData?.name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        window.updateAvatar = function (url) {
            const avatarEl = document.getElementById('avatarEl');
            if (!avatarEl) return;
            const hasPic = hasProfilePic(url);
            const finalUrl = hasPic ? getDirectDriveUrl(url) : '';
            if (finalUrl) {
                const img = document.createElement('img');
                img.src = finalUrl;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.onerror = () => { avatarEl.textContent = initials; };
                avatarEl.textContent = '';
                avatarEl.appendChild(img);
            } else {
                avatarEl.textContent = initials;
            }
        };

        // Load awal dari session
        updateAvatar(userData?.profile_pic_url);

        // Clock
        const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        window.updateClock = function () {
            const now = new Date();
            const dName = document.getElementById('dayName');
            if (dName) dName.textContent = DAYS[now.getDay()];
            const dStr = document.getElementById('dateStr');
            if (dStr) dStr.textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
            const clockEl = document.getElementById('liveClock');
            if (clockEl) {
                const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
                clockEl.innerHTML = `<i class="bi bi-clock-fill text-primary" style="font-size:16px;"></i> &nbsp;${timeStr}`;
            }
        }
        updateClock();
        setInterval(updateClock, 1000);

        // Load dashboard data
        window.loadDashboard = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=employeeDashboard&user_id=${userData.user_id}`);
                const data = await res.json();
                if (data.success) {
                    // Update profile pic if changed
                    if (data.profile_pic_url) {
                        updateAvatar(data.profile_pic_url);
                        // Sync to session
                        userData.profile_pic_url = data.profile_pic_url;
                        sessionStorage.setItem('hris_user', JSON.stringify(userData));
                    }

                    const h = data.stats.hadir ?? 0;
                    const t = data.stats.terlambat ?? 0;
                    document.getElementById('statHadir').textContent = h;
                    document.getElementById('statTerlambat').textContent = t;
                    document.getElementById('statCuti').textContent = data.stats.sisa_cuti ?? 12;

                    const tot = h + t;
                    const pRate = tot > 0 ? Math.round((h / tot) * 100) : 100;
                    const ring = document.getElementById('attendanceRing');
                    const valText = document.getElementById('attendanceRateVal');
                    if (ring && valText) {
                        valText.textContent = pRate + '%';
                        const offset = 251.2 - (251.2 * pRate) / 100;
                        ring.style.strokeDashoffset = offset;
                    }

                    // Load Notifications
                    if (window.loadNotifications) window.loadNotifications(data);

                    // Update User Division Label
                    const divLabel = document.getElementById('userDivisionLabel');
                    if (divLabel) {
                        divLabel.textContent = (data.division || userData.division || 'Umum').toUpperCase();
                    }

                    // Check for active holiday or approved leave today
                    const alertEl = document.getElementById('holidayLeaveAlert');
                    if (alertEl) {
                        if (data.today_holiday || data.today_leave) {
                            let alertHTML = '';
                            if (data.today_holiday) {
                                alertHTML = `
                                    <div class="alert-banner animate-slide-up" style="background:linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.18) 100%); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-neu-soft);">
                                        <div style="width:38px; height:38px; border-radius:50%; background:rgba(239, 68, 68, 0.15); color:#ef4444; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
                                            <i class="bi bi-calendar-x-fill"></i>
                                        </div>
                                        <div>
                                            <h4 style="font-size:13px; font-weight:800; color:#ef4444; margin:0 0 2px; font-family:var(--font-head); letter-spacing:0.3px;">HARI LIBUR OPERASIONAL</h4>
                                            <p style="font-size:12px; color:var(--text); opacity:0.85; margin:0;">Hari ini kantor libur: <strong>${data.today_holiday}</strong></p>
                                        </div>
                                    </div>
                                `;
                            } else if (data.today_leave) {
                                alertHTML = `
                                    <div class="alert-banner animate-slide-up" style="background:linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.18) 100%); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-neu-soft);">
                                        <div style="width:38px; height:38px; border-radius:50%; background:rgba(59, 130, 246, 0.15); color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
                                            <i class="bi bi-briefcase-fill"></i>
                                        </div>
                                        <div>
                                            <h4 style="font-size:13px; font-weight:800; color:#3b82f6; margin:0 0 2px; font-family:var(--font-head); letter-spacing:0.3px;">SEDANG MENJALANI CUTI</h4>
                                            <p style="font-size:12px; color:var(--text); opacity:0.85; margin:0;">Status Anda hari ini: <strong>${data.today_leave}</strong></p>
                                        </div>
                                    </div>
                                `;
                            }
                            alertEl.innerHTML = alertHTML;
                            alertEl.style.display = 'block';
                        } else {
                            alertEl.style.display = 'none';
                        }
                    }

                    window.dismissLeaveAlert = function (startDate, type) {
                        localStorage.setItem(`dismiss_leave_${startDate}_${type}`, 'true');
                        loadDashboard();
                    };

                    if (data.today_in) {
                        document.getElementById('clockInTime').textContent = data.today_in;
                        document.getElementById('statusIn').textContent = data.status_in || 'Tepat Waktu';
                        document.getElementById('statusIn').className = 'status-chip ' + (data.status_in === 'Terlambat' ? 'chip-late' : 'chip-ok');
                        document.getElementById('statusIn').style.cursor = 'default';
                        document.getElementById('statusIn').onclick = null;
                    } else {
                        document.getElementById('clockInTime').textContent = '--:--';
                        document.getElementById('statusIn').textContent = 'Belum absen';
                        document.getElementById('statusIn').className = 'status-chip chip-empty';
                        document.getElementById('statusIn').style.cursor = 'pointer';
                        document.getElementById('statusIn').onclick = function () {
                            window.location.href = window.getRedirectUrl('attendance');
                        };
                    }
                    if (data.today_out) {
                        document.getElementById('clockOutTime').textContent = data.today_out;
                        document.getElementById('clockOutTime').className = 'time-val';
                        document.getElementById('statusOut').textContent = data.status_out || 'Normal';
                        document.getElementById('statusOut').className = 'status-chip chip-ok';
                    }

                    if (data.activities && data.activities.length) {
                        const list = document.getElementById('activityList');
                        list.innerHTML = data.activities.map(a => `
            <div class="activity-item">
              <div class="act-dot act-dot-${a.color || 'yellow'}"><i class="bi bi-check2-circle"></i></div>
              <div class="act-content">
                <strong>${a.title}</strong>
                <span>${a.desc}</span>
              </div>
              <div class="act-time">${formatActivityDate(a.time)}</div>
            </div>
          `).join('');
                    }
                }
                if (window.hidePageLoader) window.hidePageLoader();
            } catch (e) {
                // Demo fallback
                document.getElementById('statHadir').textContent = 18;
                document.getElementById('statTerlambat').textContent = 2;
                document.getElementById('statCuti').textContent = 10;

                const ring = document.getElementById('attendanceRing');
                const valText = document.getElementById('attendanceRateVal');
                if (ring && valText) {
                    valText.textContent = '90%';
                    ring.style.strokeDashoffset = 251.2 - (251.2 * 90) / 100;
                }
                document.getElementById('activityList').innerHTML = `
        <div class="activity-item">
          <div class="activity-dot green"></div>
          <div class="activity-content"><strong>Clock In berhasil</strong><span>Tepat Waktu</span></div>
          <div class="activity-time">09:58</div>
        </div>
        <div class="activity-item">
          <div class="activity-dot purple"></div>
          <div class="activity-content"><strong>Cuti disetujui</strong><span>17–18 Mei 2026</span></div>
          <div class="activity-time">Kemarin</div>
        </div>
      `;
                if (window.hidePageLoader) window.hidePageLoader();
            }
        }
        let editProfilePhotoBase64 = null;

        window.openEditProfileModal = function () {
            const user = JSON.parse(sessionStorage.getItem('hris_user') || '{}');
            document.getElementById('editProfileName').value = user.name || '';
            document.getElementById('editProfilePin').value = '';

            const previewEl = document.getElementById('modalAvatarPreview');
            if (hasProfilePic(user.profile_pic_url)) {
                previewEl.innerHTML = `<img src="${getDirectDriveUrl(user.profile_pic_url)}" style="width:100%; height:100%; object-fit:cover;">`;
            } else {
                previewEl.innerHTML = (user.name || 'U').charAt(0).toUpperCase();
            }

            editProfilePhotoBase64 = null;
            document.getElementById('editProfilePicFile').value = '';
            document.getElementById('editProfileModal').classList.remove('hidden');
        }

        window.closeEditProfileModal = function () {
            document.getElementById('editProfileModal').classList.add('hidden');
        }

        window.toggleEditProfilePinVis = function () {
            const pinEl = document.getElementById('editProfilePin');
            const eyeEl = document.getElementById('editProfilePinEye');
            if (pinEl.type === 'password') {
                pinEl.type = 'text';
                eyeEl.className = 'bi bi-eye-slash-fill';
            } else {
                pinEl.type = 'password';
                eyeEl.className = 'bi bi-eye-fill';
            }
        }

        window.previewEditProfilePic = function (input) {
            const file = input.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                showModalAlert('File Terlalu Besar', 'Maksimal ukuran file adalah 5MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                const base64 = e.target.result;
                document.getElementById('modalAvatarPreview').innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover;">`;
                editProfilePhotoBase64 = base64.split(',')[1];
            }
            reader.readAsDataURL(file);
        }

        window.submitEditProfile = async function () {
            const user = JSON.parse(sessionStorage.getItem('hris_user') || '{}');
            const newPin = document.getElementById('editProfilePin').value.trim();

            if (newPin && newPin.startsWith('0')) {
                showModalAlert('Validasi Gagal', 'PIN tidak boleh diawali dengan angka 0.', 'error');
                return;
            }

            if (newPin && !/^\d{6}$/.test(newPin)) {
                showModalAlert('PIN Tidak Valid', 'PIN harus berupa 6 digit angka.', 'error');
                return;
            }

            const btn = document.getElementById('btnSaveProfile');
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';

            try {
                const body = {
                    action: 'updateUser',
                    user_id: user.user_id
                };
                if (newPin) body.password_pin = newPin;
                if (editProfilePhotoBase64) body.profile_pic_base64 = editProfilePhotoBase64;

                const res = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                const data = await res.json();

                if (data.success) {
                    if (newPin) user.password_pin = newPin;
                    if (data.profile_pic_url) user.profile_pic_url = data.profile_pic_url;
                    sessionStorage.setItem('hris_user', JSON.stringify(user));
                    userData = user; // SINKRONISASI VARIABLE LOKAL CLOSURE!

                    if (window.updateAvatar && user.profile_pic_url) {
                        window.updateAvatar(user.profile_pic_url);
                    }

                    closeEditProfileModal();
                    showModalAlert('Sukses', 'Profil berhasil diperbarui!', 'success');
                    loadDashboard();
                } else {
                    showModalAlert('Gagal', data.message || 'Gagal memperbarui profil.', 'error');
                }
            } catch (e) {
                console.error(e);
                showAlert('Gagal', 'Gagal menghubungkan ke server untuk memperbarui profil.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }

        window.loadHistory = function () { window.location.href = window.getRedirectUrl('history'); }
        window.loadLeaveHistory = function () { window.location.href = window.getRedirectUrl('leave'); }

        loadDashboard();
    })();
}

if (currentPage === 'history.html' || (currentPage === '' && 'history.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL;
        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData || userData.role !== 'Employee') window.location.href = window.getRedirectUrl('index');

        let allHistory = [], currentFilter = 'all';

        window.loadHistory = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getAttendance&user_id=${userData.user_id}`);
                const data = await res.json();
                allHistory = data.success && data.records ? data.records : [];
                renderHistory();
            } catch (e) {
                console.error('Error loading history:', e);
                allHistory = [];
                renderHistory();
            }
        }

        window.filterByStatus = function (records, status) {
            if (status === 'all') return records;
            if (status === 'on-time') return records.filter(r => r.status_in !== 'Terlambat' && r.status_in);
            if (status === 'late') return records.filter(r => r.status_in === 'Terlambat');
            return records;
        }

        // Helper for badge filters (Multi-select enabled)
        window.setBadgeFilter = function(inputId, badgeEl) {
            const input = document.getElementById(inputId);
            const container = badgeEl.parentElement;
            const val = badgeEl.dataset.val;

            if (!input) return;

            if (val === '') {
                // If "Semua" is clicked, reset all
                input.value = '';
                container.querySelectorAll('.badge').forEach(b => b.classList.remove('active'));
                badgeEl.classList.add('active');
            } else {
                // Toggle this specific value
                badgeEl.classList.toggle('active');
                
                // Get all active specific values
                const activeVals = Array.from(container.querySelectorAll('.badge.active'))
                    .map(b => b.dataset.val)
                    .filter(v => v !== '');
                
                if (activeVals.length === 0) {
                    // If none selected, activate "Semua"
                    input.value = '';
                    const defaultBadge = container.querySelector('.badge[data-val=""]');
                    if (defaultBadge) defaultBadge.classList.add('active');
                } else {
                    // If some selected, deactivate "Semua"
                    input.value = activeVals.join(',');
                    const defaultBadge = container.querySelector('.badge[data-val=""]');
                    if (defaultBadge) defaultBadge.classList.remove('active');
                }
            }
            
            if (inputId.startsWith('user')) {
                if (typeof filterUsers === 'function') filterUsers();
            } else if (inputId.startsWith('att')) {
                if (typeof filterLocalAttendance === 'function') filterLocalAttendance();
                else if (typeof loadAttendance === 'function') loadAttendance();
            } else if (inputId.startsWith('rep')) {
                if (typeof filterLocalLeaveReport === 'function') filterLocalLeaveReport();
                else if (typeof loadLeaveReport === 'function') loadLeaveReport();
            }
        };

        window.filterHistory = function (status, el) {
            currentFilter = status;
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            renderHistory();
        }

        window.formatDate = function (dateStr) {
            const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const [y, m, d] = dateStr.split('-');
            const dt = new Date(y, m - 1, d);
            return { day: DAYS[dt.getDay()], date: `${d} ${MONTHS[m - 1]} ${y}` };
        }

        window.renderHistory = function () {
            const filtered = filterByStatus(allHistory, currentFilter);
            const container = document.getElementById('historyList');
            if (!filtered.length) {
                container.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><h4>Tidak ada data</h4><p>Tidak ada riwayat kehadiran ditemukan</p></div>`;
                return;
            }
            container.innerHTML = filtered.map(r => {
                const { day, date } = formatDate(r.date);
                const hasOut = !!r.clock_out_time;
                const statusCls = r.status_in === 'Terlambat' ? 's-late' : r.status_in ? 's-ok' : 's-empty';
                const statusTxt = r.status_in || 'Belum Absen';
                const inTime = parseTime(r.clock_in_time) || '--:--';
                const outTime = hasOut ? (parseTime(r.clock_out_time) || '--:--') : '--:--';
                const inStatusCls = r.clock_in_time ? (r.status_in === 'Terlambat' ? 'status-danger' : 'status-success') : '';
                return `
      <div class="history-item">
        <div class="history-header">
          <div>
            <div class="history-date">${day}, ${date}</div>
          </div>
          <span class="status-badge ${statusCls}">${statusTxt}</span>
        </div>
        <div class="history-times">
          <div class="time-block block-in ${inStatusCls}">
            <div class="time-lbl">Masuk</div>
            <div class="time-val ${r.clock_in_time ? '' : 'empty'}">${inTime}</div>
          </div>
          <div class="time-block block-out">
            <div class="time-lbl">Pulang</div>
            <div class="time-val ${hasOut ? '' : 'empty'}">${outTime}</div>
          </div>
        </div>
        ${r.notes ? `<div class="history-notes"><i class="bi bi-chat-left-text"></i>${r.notes}</div>` : ''}
      </div>`;
            }).join('');
        }

        window.goBack = function () { window.location.href = window.getRedirectUrl('employee'); }

        loadHistory();
    })();
}

if (currentPage === 'leave.html' || (currentPage === '' && 'leave.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL;
        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData) window.location.href = window.getRedirectUrl('index');

        let selectedType = 'Cuti', fileBase64 = null, fileName = null;
        let remainingQuota = 12; // default
        async function loadQuota() {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=employeeDashboard&user_id=${userData.user_id}`);
                const data = await res.json();
                if (data.success && data.stats) {
                    remainingQuota = Number(data.stats.sisa_cuti);
                }
            } catch (e) {
                console.error('Error loading quota:', e);
            }
        }
        loadQuota();

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').min = today;
        document.getElementById('endDate').min = today;

        window.showToast = function (msg, type = 'success') {
            const t = document.getElementById('toastEl');
            const icons = { success: 'check-circle-fill', error: 'x-circle-fill', warn: 'exclamation-triangle-fill' };
            t.innerHTML = `<i class="bi bi-${icons[type] || 'info-circle'}"></i> ${msg}`;
            t.className = `toast-lv ${type} show`;
            setTimeout(() => { t.className = `toast-lv ${type}`; }, 3500);
        }

        window.switchTab = function (tab) {
            document.getElementById('tab-form').classList.toggle('active', tab === 'form');
            document.getElementById('tab-history').classList.toggle('active', tab === 'history');
            document.getElementById('tabForm').classList.toggle('active', tab === 'form');
            document.getElementById('tabHistory').classList.toggle('active', tab === 'history');
            if (tab === 'history') loadHistory();
        }

        window.selectType = function (type) {
            selectedType = type;
            document.getElementById('selectedType').value = type;
            ['Cuti', 'Sakit', 'Izin'].forEach(t => { document.getElementById(`type-${t}`).className = 'type-card'; });
            const clsMap = { Cuti: 'sel-cuti', Sakit: 'sel-sakit', Izin: 'sel-izin' };
            document.getElementById(`type-${type}`).classList.add(clsMap[type]);
            document.getElementById('uploadSection').style.display = type === 'Sakit' ? 'block' : 'none';
        }

        window.updateDateRange = function () {
            const s = document.getElementById('startDate').value, e = document.getElementById('endDate').value;
            const info = document.getElementById('dateRangeInfo');
            if (s && e) {
                const days = Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1;
                if (days < 1) { info.textContent = '⚠ Tanggal selesai harus setelah tanggal mulai'; info.classList.add('show'); return; }
                info.textContent = `📅 Total ${days} hari`; info.classList.add('show');
                document.getElementById('endDate').min = s;
            }
        }

        window.handleFile = function (input) {
            const file = input.files[0]; if (!file) return;
            if (file.size > 5 * 1024 * 1024) { showToast('File terlalu besar. Maks 5MB.', 'error'); return; }
            fileName = file.name;
            document.getElementById('fileName').textContent = fileName;
            document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
            const reader = new FileReader();
            reader.onload = e => {
                const base64 = e.target.result; fileBase64 = base64.split(',')[1];
                if (file.type.startsWith('image/')) { document.getElementById('previewImg').src = base64; document.getElementById('previewImg').style.display = 'block'; }
                else { document.getElementById('previewImg').style.display = 'none'; }
                document.getElementById('uploadPreview').classList.add('show');
            };
            reader.readAsDataURL(file);
        }

        window.clearFile = function () {
            fileBase64 = null; fileName = null;
            document.getElementById('fileInput').value = '';
            document.getElementById('uploadPreview').classList.remove('show');
            document.getElementById('previewImg').src = '';
        }

        window.submitLeave = async function () {
            const startDate = document.getElementById('startDate').value, endDate = document.getElementById('endDate').value, reason = document.getElementById('reason').value.trim();
            if (!startDate || !endDate) { showToast('Pilih tanggal mulai & selesai', 'warn'); return; }

            const daysRequested = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
            if (selectedType === 'Cuti' && daysRequested > remainingQuota) {
                window.customAlert(`Jatah cuti Anda tersisa ${remainingQuota} hari. Anda tidak dapat mengajukan Cuti selama ${daysRequested} hari.`);
                return;
            }
            if (!reason) { showToast('Alasan wajib diisi', 'warn'); return; }
            if (selectedType === 'Sakit' && !fileBase64) { showToast('Upload surat dokter untuk pengajuan sakit', 'warn'); return; }
            const btn = document.getElementById('submitBtn');
            btn.disabled = true; btn.innerHTML = '<div class="spinner" style="border-top-color:#000"></div> Mengirim...';
            try {
                const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'submitLeave', user_id: userData.user_id, type: selectedType, start_date: startDate, end_date: endDate, reason, attachment_base64: fileBase64, attachment_name: fileName }) });
                const data = await res.json();
                if (data.success) {
                    window.customAlert('Pengajuan berhasil dikirim! Menunggu persetujuan HR.');
                    document.getElementById('startDate').value = ''; document.getElementById('endDate').value = ''; document.getElementById('reason').value = '';
                    clearFile(); document.getElementById('dateRangeInfo').classList.remove('show');
                    switchTab('history');
                } else { showToast(data.message || 'Gagal mengirim pengajuan', 'error'); }
            } catch (e) {
                window.customAlert('Pengajuan berhasil dikirim! Menunggu persetujuan HR.');
                document.getElementById('startDate').value = ''; document.getElementById('endDate').value = ''; document.getElementById('reason').value = '';
                clearFile(); document.getElementById('dateRangeInfo').classList.remove('show');
                switchTab('history');
            }
            btn.disabled = false; btn.innerHTML = '<i class="bi bi-send-fill"></i> KIRIM PENGAJUAN';
        }

        window.loadHistory = async function () {
            const list = document.getElementById('historyList');
            const statusBadge = (s) => {
                const m = {
                    pending: 'badge-warn',
                    approved: 'badge-success',
                    rejected: 'badge-danger'
                };
                const translation = {
                    pending: 'Menunggu',
                    approved: 'Disetujui',
                    rejected: 'Ditolak'
                }[s.toLowerCase()] || s;
                return `<span class="badge ${m[s.toLowerCase()] || 'badge-muted'}">${translation}</span>`;
            };
            const typeIcon = (t) => {
                const iconMap = {
                    Cuti: '<i class="bi bi-calendar-check-fill" style="color:#22C55E; margin-right:6px;"></i>',
                    Sakit: '<i class="bi bi-heart-pulse-fill" style="color:#EF4444; margin-right:6px;"></i>',
                    Izin: '<i class="bi bi-file-earmark-text-fill" style="color:#3B82F6; margin-right:6px;"></i>'
                };
                return iconMap[t] || '<i class="bi bi-file-earmark-text-fill" style="color:var(--primary); margin-right:6px;"></i>';
            };
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=leaveHistory&user_id=${userData.user_id}`);
                const data = await res.json();
                const items = data.success && data.requests ? data.requests : [];
                if (!items.length) {
                    list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)">Belum ada riwayat pengajuan</div>';
                    return;
                }
                list.innerHTML = items.map(r => {
                    const isPending = r.status.toLowerCase() === 'pending';
                    const cancelBtn = isPending ? `
                        <div style="display:flex; justify-content:flex-end; margin-top:12px; border-top:1px dashed var(--border); padding-top:10px;">
                            <button onclick="cancelLeave('${r.request_id}')" 
                                style="font-size:11px; padding:6px 12px; border-radius:50px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.25); color:var(--danger); font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all var(--transition);">
                                <i class="bi bi-trash3-fill"></i> Batalkan Pengajuan
                            </button>
                        </div>
                    ` : '';

                    return `
                        <div class="history-card fade-in">
                            <div class="history-card-header">
                                <div class="history-type">${typeIcon(r.type)}${r.type}</div>
                                ${statusBadge(r.status)}
                            </div>
                            <div class="history-dates"><i class="bi bi-calendar3"></i> ${r.start_date} s.d ${r.end_date}</div>
                            <div class="history-reason">${r.reason}</div>
                            ${cancelBtn}
                        </div>
                    `;
                }).join('');
            } catch (e) {
                list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)">Gagal memuat riwayat</div>';
            }
        }

        window.cancelLeave = async function (requestId) {
            window.customConfirm('Apakah Anda yakin ingin membatalkan pengajuan ini?', async () => {
                showToast('Sedang membatalkan...', 'warn');
                try {
                    const res = await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'deleteLeave',
                            request_id: requestId,
                            user_id: userData.user_id,
                            user_role: userData.role || 'Employee'
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast('Pengajuan cuti berhasil dibatalkan!', 'success');
                        loadHistory();
                    } else {
                        showToast(data.message || 'Gagal membatalkan pengajuan', 'error');
                    }
                } catch (e) {
                    showToast('Pengajuan berhasil dibatalkan!', 'success');
                    loadHistory();
                }
            });
        }
    })();
}

// ============ GLOBAL UTILITY, CALENDAR, & NOTIFICATION ENGINE ============
(function () {
    const userData = (() => {
        try {
            return JSON.parse(sessionStorage.getItem('hris_user')) || JSON.parse(localStorage.getItem('hris_user')) || {};
        } catch (e) {
            return {};
        }
    })();

    // ============ CUSTOM CONFIRM & ALERT ENGINE ============
    window.customAlert = function (message, onOK) {
        let overlay = document.getElementById('globalModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'globalModalOverlay';
            overlay.className = 'overlay';
            overlay.style.zIndex = '999999';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="modal border-animated-modal" style="text-align:center; padding: 40px 30px; max-width: 400px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); position:relative;">
                <div class="card-border-glow"></div>
                <button id="customAlertCloseX" style="position:absolute; top:12px; right:12px; z-index:10; background:rgba(255,255,255,0.08); border:1px solid var(--border); border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; font-size:14px; transition:all 0.2s;"><i class="bi bi-x-lg"></i></button>
                <div style="position:relative; z-index:2;">
                    <div style="width:60px; height:60px; border-radius:50%; background:rgba(59, 130, 246, 0.15); color:var(--info); display:flex; align-items:center; justify-content:center; font-size:28px; margin: 0 auto 20px;"><i class="bi bi-info-circle-fill"></i></div>
                    <h3 style="font-size:18px; font-weight:800; margin-bottom:12px; font-family:var(--font-head); color:var(--text);">Notifikasi</h3>
                    <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:24px;">${message}</p>
                    <button class="btn btn-primary btn-xl btn-neu-3d" id="customAlertOKBtn" style="width:100%; border-radius:50px;">Tutup</button>
                </div>
            </div>
        `;
        overlay.classList.remove('hidden');

        const okBtn = document.getElementById('customAlertOKBtn');
        okBtn.focus();
        okBtn.onclick = function () {
            overlay.remove();
            if (onOK) onOK();
        };
        document.getElementById('customAlertCloseX').onclick = function () {
            overlay.remove();
        };
    };

    window.customConfirm = function (message, onOK, onCancel) {
        let overlay = document.getElementById('globalModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'globalModalOverlay';
            overlay.className = 'overlay';
            overlay.style.zIndex = '999999';
            document.body.appendChild(overlay);
        }

        // Responsive, non-scrolling confirmation with larger tappable buttons
        overlay.innerHTML = `
                <div class="modal border-animated-modal" style="text-align:center; padding: 24px; max-width:420px; width: min(420px,95%); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); position:relative;">
                    <div class="card-border-glow"></div>
                    <button id="customConfirmCloseX" style="position:absolute; top:12px; right:12px; z-index:10; background:rgba(255,255,255,0.08); border:1px solid var(--border); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; font-size:14px; transition:all 0.2s;"><i class="bi bi-x-lg"></i></button>
                    <div style="position:relative; z-index:2;">
                        <div style="width:64px; height:64px; border-radius:50%; background:rgba(255, 146, 0, 0.12); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:28px; margin: 0 auto 16px;"><i class="bi bi-question-circle-fill"></i></div>
                        <h3 style="font-size:18px; font-weight:800; margin-bottom:8px; font-family:var(--font-head); color:var(--text);">Konfirmasi</h3>
                        <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:20px;">${message}</p>
                        <div style="display:flex; gap:12px;">
                            <button class="btn btn-ghost" id="customConfirmCancelBtn" style="flex:1; border-radius:12px; height:48px;">Batal</button>
                            <button class="btn btn-primary btn-neu-3d" id="customConfirmOKBtn" style="flex:1; border-radius:12px; height:48px;">Oke</button>
                        </div>
                    </div>
                </div>
            `;
        overlay.classList.remove('hidden');

        document.getElementById('customConfirmOKBtn').onclick = function () {
            overlay.remove();
            if (onOK) onOK();
        };
        document.getElementById('customConfirmCancelBtn').onclick = function () {
            overlay.remove();
            if (onCancel) onCancel();
        };
        document.getElementById('customConfirmCloseX').onclick = function () {
            overlay.remove();
            if (onCancel) onCancel();
        };
    };

    // ============ DIVISION CRUD OPERATIONS ============
    window.allDivisions = [];
    window.loadDivisions = async function () {
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getDivisions`);
            const data = await res.json();
            if (data.success && data.divisions) {
                window.allDivisions = data.divisions;

                // Render list
                renderDivisionsTable(data.divisions);

                // Populate pos_division select dropdown in Kelola Jabatan form
                const posDivSelect = document.getElementById('pos_division');
                if (posDivSelect) {
                    posDivSelect.innerHTML = '<option value="" disabled selected>Pilih Divisi...</option>' +
                        data.divisions.map(d => `<option value="${d}">${d}</option>`).join('');
                }

                // Populate mu_division select dropdown in edit user modal
                const muDivSelect = document.getElementById('mu_division');
                if (muDivSelect) {
                    muDivSelect.innerHTML = data.divisions.map(d => `<option value="${d}">${d}</option>`).join('');
                }
            }
        } catch (err) {
            console.error("Gagal memuat divisi:", err);
        }
    };

    window.renderDivisionsTable = function (list) {
        const body = document.getElementById('divisionsTableBody');
        if (!body) return;
        if (!list.length) {
            body.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px; color:var(--text-muted)">Belum ada data divisi.</td></tr>';
            return;
        }
        body.innerHTML = list.map(d => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="font-weight:700; color:var(--text); padding:12px;">${d}</td>
              <td style="text-align:center; padding:12px;">
                <button class="btn btn-sm btn-ghost text-danger btn-neu-3d" onclick="deleteDivisionAdmin('${d}')" title="Hapus Divisi" style="border-radius:50%; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; padding:0;">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </td>
            </tr>
        `).join('');
    };

    window.addDivisionAdmin = async function () {
        const div = document.getElementById('div_name').value.trim();
        if (!div) {
            showToast('Nama divisi wajib diisi!', 'warn');
            return;
        }
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addDivision', division: div })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Divisi baru berhasil disimpan!', 'success');
                document.getElementById('div_name').value = '';
                await loadDivisions();
                await loadPositions();
            } else {
                showToast(data.message || 'Gagal menyimpan divisi', 'error');
            }
        } catch (err) {
            showToast('Koneksi terputus. Gagal menyimpan divisi.', 'error');
        }
    };

    window.deleteDivisionAdmin = async function (divName) {
        window.customConfirm(`Apakah Anda yakin ingin menghapus divisi "${divName}" secara permanen?`, async () => {
            try {
                const res = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'deleteDivision', division: divName })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Divisi berhasil dihapus!', 'success');
                    await loadDivisions();
                    await loadPositions();
                } else {
                    showToast(data.message || 'Gagal menghapus divisi', 'error');
                }
            } catch (err) {
                showToast('Koneksi terputus. Gagal menghapus divisi.', 'error');
            }
        });
    };

    // ============ TABLE SORTING OPERATIONS ============
    window.positionsSortOrder = { col: '', asc: true };
    window.sortPositionsTable = function (col) {
        const order = window.positionsSortOrder;
        if (order.col === col) {
            order.asc = !order.asc;
        } else {
            order.col = col;
            order.asc = true;
        }

        const sorted = [...window.allPositions].sort((a, b) => {
            let valA = a[col] || '';
            let valB = b[col] || '';
            if (order.asc) {
                return valA.localeCompare(valB);
            } else {
                return valB.localeCompare(valA);
            }
        });
        renderPositionsTable(sorted);
    };

    window.divisionsSortOrder = { asc: true };
    window.sortDivisionsTable = function () {
        const asc = window.divisionsSortOrder.asc;
        window.divisionsSortOrder.asc = !asc;

        const sorted = [...window.allDivisions].sort((a, b) => {
            if (asc) {
                return a.localeCompare(b);
            } else {
                return b.localeCompare(a);
            }
        });
        renderDivisionsTable(sorted);
    };

    // Helper comparison function for robust sorting
    function compareValues(a, b, col, asc) {
        let valA = a[col];
        let valB = b[col];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        const numericCols = [
            'distance', 'distance_meters', 'allowed_leave_quota',
            'remaining_leave_quota', 'sick_count', 'permit_count',
            'cuti_count', 'score', 'absent_days', 'sick_permit_days'
        ];

        if (numericCols.includes(col)) {
            let numA = parseFloat(valA) || 0;
            let numB = parseFloat(valB) || 0;
            return asc ? numA - numB : numB - numA;
        }

        const strA = String(valA).trim();
        const strB = String(valB).trim();

        return asc ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' }) : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
    }

    // Helper function to update header icons based on active sort
    window.updateSortIcons = function (theadId, activeCol, asc) {
        const thead = document.getElementById(theadId);
        if (!thead) return;
        const headers = thead.querySelectorAll('th[data-sort]');
        headers.forEach(th => {
            const col = th.getAttribute('data-sort');
            const icon = th.querySelector('i.bi-sort-icon');
            if (icon) {
                if (col === activeCol) {
                    icon.className = asc ? 'bi bi-sort-up-alt text-primary bi-sort-icon' : 'bi bi-sort-down text-primary bi-sort-icon';
                    icon.style.opacity = '1';
                } else {
                    icon.className = 'bi bi-arrow-down-up bi-sort-icon';
                    icon.style.opacity = '0.35';
                }
            }
        });
    };

    // Live Logs Table (Dashboard)
    window.liveLogsSortOrder = { col: '', asc: true };
    window.sortLiveLogsTable = function (col) {
        if (!window.allLiveLogs || !window.allLiveLogs.length) return;
        const order = window.liveLogsSortOrder;
        if (order.col === col) {
            order.asc = !order.asc;
        } else {
            order.col = col;
            order.asc = true;
        }
        window.allLiveLogs.sort((a, b) => compareValues(a, b, col, order.asc));
        renderLiveLog(window.allLiveLogs);
        window.updateSortIcons('liveLogThead', col, order.asc);
    };

    // Employees / Users Table
    window.usersSortOrder = { col: '', asc: true };
    window.sortUsersTable = function (col) {
        if (!window.allUsers || !window.allUsers.length) return;
        const order = window.usersSortOrder;
        if (order.col === col) {
            order.asc = !order.asc;
        } else {
            order.col = col;
            order.asc = true;
        }
        window.allUsers.sort((a, b) => compareValues(a, b, col, order.asc));
        renderUsers(window.allUsers);
        window.updateSortIcons('usersThead', col, order.asc);
    };

    // Approvals Table
    window.approvalsSortOrder = { col: '', asc: true };
    window.sortApprovalsTable = function (col) {
        if (!window.allApprovals || !window.allApprovals.length) return;
        const order = window.approvalsSortOrder;
        if (order.col === col) {
            order.asc = !order.asc;
        } else {
            order.col = col;
            order.asc = true;
        }
        window.allApprovals.sort((a, b) => compareValues(a, b, col, order.asc));
        renderApprovals(window.allApprovals);
        window.updateSortIcons('approvalThead', col, order.asc);
    };

    // Attendance History Table
    window.attendanceSortOrder = { col: '', asc: true };
    window.sortAttendanceTable = function (col) {
        if (!window.allAttendance || !window.allAttendance.length) return;
        const order = window.attendanceSortOrder;
        if (order.col === col) {
            order.asc = !order.asc;
        } else {
            order.col = col;
            order.asc = true;
        }

        let sortCol = col;
        if (col === 'clock_in') sortCol = 'clock_in_time';
        if (col === 'clock_out') sortCol = 'clock_out_time';
        if (col === 'distance') sortCol = 'distance_meters';

        window.allAttendance.sort((a, b) => compareValues(a, b, sortCol, order.asc));
        renderAtt(window.allAttendance);
        window.updateSortIcons('attendanceThead', col, order.asc);
    };

    // Leave Report Table
    window.leaveReportSortOrder = { col: '', asc: true };
    window.sortLeaveReportTable = function (col) {
        if (!window.allLeaveReports || !window.allLeaveReports.length) return;
        const order = window.leaveReportSortOrder;
        if (order.col === col) {
            order.asc = !order.asc;
        } else {
            order.col = col;
            order.asc = true;
        }
        window.allLeaveReports.sort((a, b) => compareValues(a, b, col, order.asc));
        renderLeaveReport(window.allLeaveReports);
        window.updateSortIcons('leaveReportThead', col, order.asc);
    };

    // Tasks Table Renderer (Standalone)
    window.renderAdminTasksTable = function (filtered) {
        const body = document.getElementById('taskAdminBody');
        if (!body) return;
        if (filtered.length === 0) {
            body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Tidak ada data tugas ditemukan</td></tr>';
            return;
        }

        body.innerHTML = filtered.map(t => {
            const statusBadge = t.status === 'Completed' ? 'badge-success' : 'badge-warn';
            const statusTranslation = t.status === 'Completed' ? 'Selesai' : 'Belum Selesai';
            const scoreDisp = t.score ? `<span class="badge badge-success" style="font-weight:800; font-size:12px;"><i class="bi bi-star-fill" style="color:#F59E0B; margin-right:4px;"></i> ${t.score}</span>` : '<span style="color:var(--text-muted)">—</span>';
            const taskJsonStr = encodeURIComponent(JSON.stringify(t));

            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            ${hasProfilePic(t.profile_pic_url) ?
                    `<img src="${getDirectDriveUrl(t.profile_pic_url)}" class="avatar avatar-sm" style="object-fit:cover" onerror="this.src='/img/profile.png'; this.onerror=null;">` :
                    `<img src="/img/profile.png" class="avatar avatar-sm" style="object-fit:cover;">`
                }
                            <div>
                                <strong>${t.name}</strong>
                                <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${t.position}</div>
                            </div>
                        </div>
                    </td>
                    <td style="white-space:nowrap">${t.date}</td>
                    <td>
                        <strong style="font-size:13px; color:var(--text);">${t.task_name}</strong>
                        <div style="font-size:10px; color:var(--text-muted); margin-top:3px; display:flex; gap:8px; align-items:center;">
                            <span class="badge badge-info" style="font-size:9px; padding:2px 6px;">${t.category}</span>
                            <span><i class="bi bi-clock-fill" style="margin-right:2px;"></i> ${t.start_time || '—'} - ${t.end_time || '—'}</span>
                        </div>
                    </td>
                    <td style="text-align:center;"><span class="badge ${statusBadge}">${statusTranslation}</span></td>
                    <td style="text-align:center;">${scoreDisp}</td>
                    <td>
                        <div style="display:flex; gap:6px; justify-content:center;">
                            <button class="btn btn-sm btn-ghost" onclick="viewAdminTaskDetail('${taskJsonStr}')" style="padding:6px 12px; border-radius:50px; font-size:11px; font-weight:600;"><i class="bi bi-eye"></i> Detail</button>
                            <button class="btn btn-sm btn-primary" onclick="openEditTaskModal('${taskJsonStr}')" style="padding:6px 12px; border-radius:50px; font-size:11px; font-weight:600;"><i class="bi bi-pencil-square"></i> Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteAdminTask('${t.task_id}')" style="padding:6px 12px; border-radius:50px; font-size:11px; font-weight:600;"><i class="bi bi-trash-fill"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Tasks Table Sorting
    window.tasksSortOrder = { col: '', asc: true };
    window.sortTasksTable = function (col) {
        if (!window.allAdminTasks || !window.allAdminTasks.length) return;
        const order = window.tasksSortOrder;
        if (order.col === col) {
            order.asc = !order.asc;
        } else {
            order.col = col;
            order.asc = true;
        }
        window.allAdminTasks.sort((a, b) => compareValues(a, b, col, order.asc));
        window.renderAdminTasksTable(window.allAdminTasks);
        window.updateSortIcons('tasksThead', col, order.asc);
    };

    // ============ DYNAMIC CALENDAR WIDGET ============
    window.calendarCurrentDate = new Date();
    window.prevCalendarMonth = function () {
        window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() - 1);
        renderCalendar();
    };

    window.nextCalendarMonth = function () {
        window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() + 1);
        renderCalendar();
    };

    window.renderCalendar = function () {
        const grid = document.getElementById('calendarGrid');
        const header = document.getElementById('calendarMonthYear');
        if (!grid || !header) return;

        const year = window.calendarCurrentDate.getFullYear();
        const month = window.calendarCurrentDate.getMonth();

        const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        header.textContent = `${monthNames[month]} ${year}`;

        const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        let html = dayHeaders.map((d, idx) => `<div class="calendar-day-header ${idx === 0 ? 'sunday-header' : ''}">${d}</div>`).join('');

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();

        for (let i = firstDayIndex; i > 0; i--) {
            html += `<div class="calendar-cell other-month">${prevLastDay - i + 1}</div>`;
        }

        const today = new Date();
        const holidays = window.allHolidays || [];

        for (let i = 1; i <= lastDay; i++) {
            const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayOfWeek = new Date(year, month, i).getDay();
            const isSunday = dayOfWeek === 0;

            const activeHoliday = holidays.find(h => {
                const start = h.start_date;
                const end = h.end_date || start;
                return currentDateStr >= start && currentDateStr <= end;
            });

            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;
            const cellClass = `calendar-cell ${activeHoliday ? 'holiday' : ''} ${isToday ? 'today' : ''} ${isSunday ? 'sunday' : ''}`;
            const tooltipAttr = activeHoliday ? `data-tooltip="${activeHoliday.description}"` : '';

            html += `<div class="${cellClass}" ${tooltipAttr}>${i}</div>`;
        }

        const totalCells = firstDayIndex + lastDay;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-cell other-month">${i}</div>`;
        }

        grid.innerHTML = html;
    };

    // ============ EMPLOYEE NOTIFICATION CENTER ============
    window.toggleNotifDropdown = function (e) {
        if (e) e.stopPropagation();
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    };

    // Click outside closes notification dropdown
    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('notifDropdown');
        const bellBtn = document.getElementById('notifBellBtn');
        if (dropdown && !dropdown.contains(e.target) && (!bellBtn || !bellBtn.contains(e.target))) {
            dropdown.classList.add('hidden');
        }
    });

    window.loadNotifications = function (data) {
        if (!userData || !userData.user_id) return;
        let notifications = JSON.parse(localStorage.getItem(`notifs_${userData.user_id}`)) || [];

        if (data.latest_approved_leave) {
            const key = `dismiss_leave_${data.latest_approved_leave.start_date}_Approved`;
            const alreadyNotified = notifications.some(n => n.type === 'Approved' && n.start_date === data.latest_approved_leave.start_date);
            if (!alreadyNotified && !localStorage.getItem(key)) {
                notifications.unshift({
                    id: 'notif_' + Date.now() + '_app',
                    type: 'Approved',
                    start_date: data.latest_approved_leave.start_date,
                    message: `Pengajuan cuti Anda (${data.latest_approved_leave.leave_type}) mulai tanggal ${data.latest_approved_leave.start_date} s/d ${data.latest_approved_leave.end_date} telah DISETUJUI oleh HRD.`,
                    read: false,
                    timestamp: Date.now()
                });
            }
        }

        if (data.latest_rejected_leave) {
            const key = `dismiss_leave_${data.latest_rejected_leave.start_date}_Rejected`;
            const alreadyNotified = notifications.some(n => n.type === 'Rejected' && n.start_date === data.latest_rejected_leave.start_date);
            if (!alreadyNotified && !localStorage.getItem(key)) {
                notifications.unshift({
                    id: 'notif_' + Date.now() + '_rej',
                    type: 'Rejected',
                    start_date: data.latest_rejected_leave.start_date,
                    message: `Pengajuan cuti Anda (${data.latest_rejected_leave.leave_type}) mulai tanggal ${data.latest_rejected_leave.start_date} telah DITOLAK. Alasan: ${data.latest_rejected_leave.reason || '-'}`,
                    read: false,
                    timestamp: Date.now()
                });
            }
        }

        localStorage.setItem(`notifs_${userData.user_id}`, JSON.stringify(notifications));
        updateNotificationsUI();
    };

    window.updateNotificationsUI = function () {
        if (!userData || !userData.user_id) return;
        const list = document.getElementById('notifItemsContainer');
        const badge = document.getElementById('notifCountBadge');
        if (!list) return;

        let notifications = JSON.parse(localStorage.getItem(`notifs_${userData.user_id}`)) || [];
        const unreadCount = notifications.filter(n => !n.read).length;

        if (badge) {
            badge.textContent = unreadCount;
            if (unreadCount > 0) {
                badge.classList.remove('hidden');
                badge.style.display = 'flex';
            } else {
                badge.classList.add('hidden');
                badge.style.display = 'none';
            }
        }

        if (!notifications.length) {
            list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">Belum ada notifikasi baru</div>';
            return;
        }

        list.innerHTML = notifications.map(n => `
            <div class="notif-item ${n.read ? 'read-muted' : 'unread'}" onclick="markNotifAsRead('${n.id}', event)" style="
                padding: 10px 12px;
                border-bottom: 1px solid var(--border);
                cursor: pointer;
                transition: all var(--transition);
                position: relative;
                border-radius: var(--radius-sm);
                background: ${n.read ? 'transparent' : 'rgba(255, 146, 0, 0.04)'};
                opacity: ${n.read ? '0.5' : '1'};
            ">
                <div style="display:flex; gap:10px; align-items:flex-start;">
                    <div style="width:28px; height:28px; border-radius:50%; background:${n.read ? 'rgba(255,255,255,0.05)' : (n.type === 'Approved' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)')}; color:${n.read ? 'var(--text-muted)' : (n.type === 'Approved' ? 'var(--success)' : 'var(--danger)')}; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0;">
                        <i class="bi ${n.type === 'Approved' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                    </div>
                    <div style="flex:1;">
                        <p style="margin:0; font-size:11px; color:${n.read ? 'var(--text-muted)' : 'var(--text)'}; line-height:1.4; font-weight:${n.read ? '500' : '700'}; text-align:left;">${n.message}</p>
                        <span style="font-size:9px; color:var(--text-muted); display:block; margin-top:4px; text-align:left;">${new Date(n.timestamp).toLocaleDateString('id-ID')} ${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    ${n.read ? '' : `<span style="width:6px; height:6px; border-radius:50%; background:var(--primary); display:block; flex-shrink:0; margin-top:4px; box-shadow: 0 0 8px var(--primary);"></span>`}
                </div>
            </div>
        `).join('');
    };

    window.markNotifAsRead = function (id, event) {
        if (event) event.stopPropagation();
        let notifications = JSON.parse(localStorage.getItem(`notifs_${userData.user_id}`)) || [];
        const notif = notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            localStorage.setItem(`dismiss_leave_${notif.start_date}_${notif.type}`, 'true');
        }
        localStorage.setItem(`notifs_${userData.user_id}`, JSON.stringify(notifications));
        updateNotificationsUI();
    };

    window.markAllNotifAsRead = function () {
        let notifications = JSON.parse(localStorage.getItem(`notifs_${userData.user_id}`)) || [];
        notifications.forEach(n => {
            n.read = true;
            localStorage.setItem(`dismiss_leave_${n.start_date}_${n.type}`, 'true');
        });
        localStorage.setItem(`notifs_${userData.user_id}`, JSON.stringify(notifications));
        updateNotificationsUI();
    };

    // ============ ADMIN TASK SYSTEM ============
    function getEmbedPreviewUrl(url) {
        if (!url) return '';
        const match = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        return url;
    }

    window.previewAdminAttachment = function (url) {
        const body = document.getElementById('modalDocBody');
        const embedUrl = getEmbedPreviewUrl(url);
        body.innerHTML = `<iframe src="${embedUrl}" style="width:100%; height:450px; border-radius:12px; border:none; background:#000;"></iframe>`;
        openModal('modalDoc');
    };

    window.loadAdminTasks = async function () {
        const body = document.getElementById('taskAdminBody');
        if (!body) return;
        body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px">Memuat data tugas...</td></tr>';

        // Ensure users list is loaded globally
        if (!window.allUsers || !window.allUsers.length) {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getUsers`);
                const data = await res.json();
                window.allUsers = data.users || [];
            } catch (err) {
                console.error("Failed to load users for tasks", err);
            }
        }

        // Set default filter values if not set
        if (!document.getElementById('taskFilterStart').value) {
            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 30);
            document.getElementById('taskFilterStart').value = sevenDaysAgo.toISOString().substring(0, 10);
            document.getElementById('taskFilterEnd').value = today.toISOString().substring(0, 10);
        }

        const start = document.getElementById('taskFilterStart').value;
        const end = document.getElementById('taskFilterEnd').value;
        const name = document.getElementById('taskFilterName').value.trim();
        const category = document.getElementById('taskFilterCategory').value;
        const status = document.getElementById('taskFilterStatus').value;
        const division = document.getElementById('taskFilterDivision') ? document.getElementById('taskFilterDivision').value : '';

        // Populate Division Filter dynamically if not already populated
        const divFilter = document.getElementById('taskFilterDivision');
        if (divFilter && divFilter.options.length <= 1 && window.allUsers) {
            const divisions = [...new Set(window.allUsers.map(u => u.division).filter(Boolean))].sort();
            divFilter.innerHTML = '<option value="">Semua Divisi</option>' +
                divisions.map(d => `<option value="${d}">${d}</option>`).join('');
            if (division) divFilter.value = division;
        }

        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getTasks&start_date=${start}&end_date=${end}`);
            const data = await res.json();

            if (data.success && data.tasks) {
                let filtered = data.tasks;
                if (name) {
                    filtered = filtered.filter(t => t.name.toLowerCase().includes(name.toLowerCase()));
                }
                if (category) {
                    filtered = filtered.filter(t => t.category === category);
                }
                if (status) {
                    filtered = filtered.filter(t => t.status === status);
                }
                if (division) {
                    filtered = filtered.filter(t => {
                        const userObj = window.allUsers?.find(u => u.user_id === t.user_id || u.name?.toLowerCase() === t.name?.toLowerCase());
                        return userObj && userObj.division === division;
                    });
                }

                // Dynamic calculation for task statistics
                const totalTasks = filtered.length;
                const completedTasks = filtered.filter(t => t.status === 'Completed').length;
                const pendingTasks = totalTasks - completedTasks;

                // Calculate average productivity score (only for tasks with a score)
                const scoredTasks = filtered.filter(t => t.score && !isNaN(t.score));
                const avgScore = scoredTasks.length > 0
                    ? Math.round(scoredTasks.reduce((sum, t) => sum + Number(t.score), 0) / scoredTasks.length)
                    : 0;

                // Update Task Insights UI dynamically!
                if (document.getElementById('taskStatTotal')) document.getElementById('taskStatTotal').textContent = totalTasks;
                if (document.getElementById('taskStatCompleted')) document.getElementById('taskStatCompleted').textContent = completedTasks;
                if (document.getElementById('taskStatPending')) document.getElementById('taskStatPending').textContent = pendingTasks;
                if (document.getElementById('taskStatAvgScore')) {
                    document.getElementById('taskStatAvgScore').innerHTML = avgScore > 0
                        ? `<i class="bi bi-star-fill text-warn" style="margin-right:4px;"></i> ${avgScore}%`
                        : '—';
                }

                window.allAdminTasks = filtered;
                window.renderAdminTasksTable(window.allAdminTasks);
            } else {
                body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Gagal memuat tugas</td></tr>';
            }
        } catch (err) {
            console.error(err);
            body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--danger)">Gagal terhubung ke server</td></tr>';
        }
    };

    window.openAddTaskModal = function () {
        document.getElementById('modalTaskTitle').innerHTML = '<i class="bi bi-list-task text-primary" style="margin-right:8px"></i> Tambah Tugas Baru';
        document.getElementById('adminTaskForm').reset();
        document.getElementById('modalTaskId').value = '';
        document.getElementById('modalTaskDate').value = new Date().toISOString().substring(0, 10);
        document.getElementById('modalTaskTarget').value = '';
        document.getElementById('modalTaskStartTime').value = '';
        document.getElementById('modalTaskEndTime').value = '';
        document.getElementById('modalTaskOutput').value = '';
        document.getElementById('modalTaskOthers').value = '';

        // Populate employee dropdown from active employees
        const userSelect = document.getElementById('modalTaskUser');
        if (userSelect && window.allUsers) {
            const employees = window.allUsers.filter(u => u.role === 'Employee' && u.status === 'Active');
            userSelect.innerHTML = employees.map(u => `
                <option value="${u.user_id}">${u.name} (${u.position || 'Employee'})</option>
            `).join('');
        }

        openModal('modalTask');
    };

    window.viewAdminTaskDetail = function (taskJsonStr) {
        const t = JSON.parse(decodeURIComponent(taskJsonStr));
        const body = document.getElementById('modalViewTaskAdminBody');

        const attachmentBtn = t.attachment_url ? `
            <button onclick="previewAdminAttachment('${t.attachment_url}')" class="btn btn-primary" style="margin-top:8px; padding:10px 16px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; width:100%;">
                <i class="bi bi-file-earmark-arrow-up-fill"></i> Buka Dokumen Lampiran
            </button>
        ` : `<div style="padding:12px; background:rgba(0,0,0,0.05); border-radius:8px; text-align:center; color:var(--text-muted); font-size:12px; margin-top:8px;"><i class="bi bi-dash-circle"></i> Tidak ada dokumen yang dilampirkan</div>`;

        const statusBadge = t.status === 'Completed' ? 'badge-success' : 'badge-warn';
        const statusText = t.status === 'Completed' ? 'Selesai' : 'Belum Selesai';

        body.innerHTML = `
            <div class="bento-detail-grid">
                <div style="display:flex; gap:12px; padding-bottom:16px; border-bottom:1px dashed var(--border); margin-bottom:4px;">
                    ${hasProfilePic(t.profile_pic_url) ?
                `<img src="${getDirectDriveUrl(t.profile_pic_url)}" class="avatar" style="width:50px; height:50px; object-fit:cover; border-radius:14px;" onerror="this.src='/img/profile.png'; this.onerror=null;">` :
                `<img src="/img/profile.png" class="avatar" style="width:50px; height:50px; object-fit:cover; border-radius:14px;">`
            }
                    <div style="display:flex; flex-direction:column; justify-content:center;">
                        <h4 style="margin:0; font-size:18px; font-weight:800; color:var(--text);">${t.name}</h4>
                        <span style="color:var(--text-muted); font-size:12px;">${t.position || 'Employee'} • ${t.division || '-'}</span>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div class="bento-detail-item">
                        <span class="bento-detail-label">Tanggal Laporan</span>
                        <span class="bento-detail-value"><i class="bi bi-calendar-event text-primary" style="margin-right:6px"></i>${t.date}</span>
                    </div>
                    <div class="bento-detail-item">
                        <span class="bento-detail-label">Status & Skor</span>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
                            <span class="badge ${statusBadge}">${statusText}</span>
                            ${t.score ? `<span class="badge badge-success" style="font-weight:800;"><i class="bi bi-star-fill" style="color:#F59E0B; margin-right:4px;"></i> ${t.score}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="bento-detail-item" style="background:rgba(59,130,246,0.05); border-color:rgba(59,130,246,0.15);">
                    <span class="bento-detail-label text-primary">Nama Tugas Utama</span>
                    <span class="bento-detail-value" style="font-size:16px;">${t.task_name}</span>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div class="bento-detail-item">
                        <span class="bento-detail-label">Waktu Pengerjaan</span>
                        <span class="bento-detail-value"><i class="bi bi-clock-fill text-warn" style="margin-right:6px"></i>${t.start_time || '--:--'} s/d ${t.end_time || '--:--'}</span>
                    </div>
                    <div class="bento-detail-item">
                        <span class="bento-detail-label">Kategori Tugas</span>
                        <span class="bento-detail-value">${t.category}</span>
                    </div>
                </div>

                <div class="bento-detail-item">
                    <span class="bento-detail-label">Target / Goals</span>
                    <span class="bento-detail-value">${t.target_goals || '<span style="color:var(--text-muted)">-</span>'}</span>
                </div>

                <div class="bento-detail-item">
                    <span class="bento-detail-label">Output Yang Dihasilkan</span>
                    <span class="bento-detail-value">${t.output || '<span style="color:var(--text-muted)">-</span>'}</span>
                </div>

                ${t.notes ? `
                <div class="bento-detail-item" style="background:rgba(245,158,11,0.05); border-color:rgba(245,158,11,0.15);">
                    <span class="bento-detail-label text-warn">Kendala / Issue / Catatan</span>
                    <span class="bento-detail-value">${t.notes}</span>
                </div>
                ` : ''}

                ${t.others ? `
                <div class="bento-detail-item">
                    <span class="bento-detail-label">Lainnya</span>
                    <span class="bento-detail-value">${t.others}</span>
                </div>
                ` : ''}

                <div class="bento-detail-item" style="margin-top:8px;">
                    <span class="bento-detail-label">File Lampiran Bukti Kerja</span>
                    ${attachmentBtn}
                </div>
            </div>
        `;

        openModal('modalViewTaskAdmin');
    };

    window.openEditTaskModal = function (taskJsonStr) {
        const task = JSON.parse(decodeURIComponent(taskJsonStr));
        document.getElementById('modalTaskTitle').innerHTML = '<i class="bi bi-pencil-square text-primary" style="margin-right:8px"></i> Edit Tugas & Productivity';

        document.getElementById('modalTaskId').value = task.task_id;

        // Populate employee dropdown from active employees
        const userSelect = document.getElementById('modalTaskUser');
        if (userSelect && window.allUsers) {
            const employees = window.allUsers.filter(u => u.role === 'Employee' && u.status === 'Active');
            userSelect.innerHTML = employees.map(u => `
                <option value="${u.user_id}" ${u.user_id === task.user_id ? 'selected' : ''}>${u.name} (${u.position || 'Employee'})</option>
            `).join('');
        }

        document.getElementById('modalTaskName').value = task.task_name || '';
        document.getElementById('modalTaskTarget').value = task.target_goals || '';
        document.getElementById('modalTaskStartTime').value = task.start_time || '';
        document.getElementById('modalTaskEndTime').value = task.end_time || '';
        document.getElementById('modalTaskOutput').value = task.output || '';
        document.getElementById('modalTaskCategory').value = task.category || 'Other';
        document.getElementById('modalTaskDate').value = task.date || '';
        document.getElementById('modalTaskNotes').value = task.notes || '';
        document.getElementById('modalTaskOthers').value = task.others || '';
        document.getElementById('modalTaskStatus').value = task.status || 'Pending';
        document.getElementById('modalTaskScore').value = task.score || '';

        openModal('modalTask');
    };

    window.saveAdminTask = async function (e) {
        e.preventDefault();
        const taskId = document.getElementById('modalTaskId').value;
        const userId = document.getElementById('modalTaskUser').value;
        const taskName = document.getElementById('modalTaskName').value.trim();
        const target = document.getElementById('modalTaskTarget').value.trim();
        const startTime = document.getElementById('modalTaskStartTime').value;
        const endTime = document.getElementById('modalTaskEndTime').value;
        const output = document.getElementById('modalTaskOutput').value.trim();
        const category = document.getElementById('modalTaskCategory').value;
        const date = document.getElementById('modalTaskDate').value;
        const notes = document.getElementById('modalTaskNotes').value.trim();
        const others = document.getElementById('modalTaskOthers').value.trim();
        const status = document.getElementById('modalTaskStatus').value;
        const score = document.getElementById('modalTaskScore').value;
        const fileInput = document.getElementById('modalTaskFile');

        const submitBtn = document.getElementById('btnSaveTask');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split spin"></i> Menyimpan...';

        let attachment_base64 = '';
        let attachment_filename = '';

        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            attachment_filename = file.name;
            const getBase64 = (f) => new Promise((res, rej) => {
                const r = new FileReader();
                r.readAsDataURL(f);
                r.onload = () => res(r.result);
                r.onerror = e => rej(e);
            });
            try {
                attachment_base64 = await getBase64(file);
            } catch (err) {
                console.error("Failed to read file", err);
            }
        }

        const payload = {
            action: taskId ? 'updateTask' : 'createTask',
            task_id: taskId || undefined,
            user_id: userId,
            task_name: taskName,
            target_goals: target,
            start_time: startTime,
            end_time: endTime,
            output: output,
            category: category,
            date: date,
            notes: notes,
            others: others,
            status: status,
            score: score || undefined,
            attachment_base64: attachment_base64 || undefined,
            attachment_filename: attachment_filename || undefined
        };

        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast(taskId ? 'Tugas berhasil diperbarui!' : 'Tugas berhasil ditambahkan!', 'success');
                closeModal('modalTask');
                loadAdminTasks();
            } else {
                showToast(data.message || 'Gagal menyimpan tugas', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan koneksi', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    };

    window.deleteAdminTask = function (taskId) {
        window.customConfirm('Apakah Anda yakin ingin menghapus tugas ini secara permanen?', async () => {
            try {
                const res = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'deleteTask', task_id: taskId })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Tugas berhasil dihapus!', 'success');
                    loadAdminTasks();
                } else {
                    showToast(data.message || 'Gagal menghapus tugas', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Terjadi kesalahan koneksi', 'error');
            }
        });
    };

    // Automatic Tab Deep-Linking System
    if (currentPage === 'leave.html') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'history' || window.location.hash === '#tab-history') {
            window.switchTab('history');
        }
    }
})();
