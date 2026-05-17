// Gabungan script.js

const currentPage = window.location.pathname.split('/').pop() || 'index.html';

// Global Modal Alert (Centered Glassmorphism UI)
window.showModalAlert = function (title, message, type = 'info') {
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

    overlay.innerHTML = `
        <div class="modal" style="text-align:center; padding: 40px 30px; max-width: 400px; animation: slideUp 0.3s ease;">
            ${iconHTML}
            <h3 style="font-size:20px; font-weight:800; margin-bottom:12px; font-family:var(--font-head); color:var(--text);">${title}</h3>
            <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:24px;">${message}</p>
            <button class="btn btn-primary btn-xl" onclick="document.getElementById('globalModalOverlay').remove()" style="width:100%; border-radius:50px;">Tutup</button>
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
    
    overlay.innerHTML = `
        <div class="modal" style="text-align:center; padding: 40px 30px; max-width: 400px; animation: slideUp 0.3s ease;">
            <div style="width:60px; height:60px; border-radius:50%; background:rgba(239, 68, 68, 0.15); color:var(--danger); display:flex; align-items:center; justify-content:center; font-size:28px; margin: 0 auto 20px;">
                <i class="bi bi-box-arrow-right"></i>
            </div>
            <h3 style="font-size:20px; font-weight:800; margin-bottom:12px; font-family:var(--font-head); color:var(--text);">${title}</h3>
            <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:24px;">${message}</p>
            <div style="display:flex; gap:12px;">
                <button class="btn btn-ghost" onclick="document.getElementById('globalConfirmOverlay').remove()" style="flex:1; border-radius:50px;">Batal</button>
                <button class="btn btn-primary" id="confirmYesBtn" style="flex:1; border-radius:50px; background:linear-gradient(135deg, var(--danger), #dc2626); color:white !important; border:none; cursor:pointer;">Keluar</button>
            </div>
        </div>
    `;
    
    document.getElementById('confirmYesBtn').onclick = function() {
        overlay.remove();
        onConfirm();
    };
};

// Helper Global: Parse waktu dari berbagai format (ISO full string atau HH:MM) ke format HH:MM 24 jam
window.parseTime = function(val) {
    if (!val || val === '--:--' || val === '--') return null;
    if (typeof val === 'string' && val.includes('T')) {
        const timePart = val.split('T')[1]; 
        if (timePart) {
            const [h, m] = timePart.split(':');
            if (h !== undefined && m !== undefined) {
                return String(parseInt(h, 10)).padStart(2, '0') + ':' + String(parseInt(m, 10)).padStart(2, '0');
            }
        }
        return null;
    }
    if (typeof val === 'string') {
        const match = val.match(/(\d{2}):(\d{2}):\d{2}/);
        if (match) {
            return String(parseInt(match[1], 10)).padStart(2, '0') + ':' + String(parseInt(match[2], 10)).padStart(2, '0');
        }
    }
    if (typeof val === 'string' && val.includes(':')) {
        const parts = val.split(':');
        return String(parseInt(parts[0], 10)).padStart(2, '0') + ':' + String(parseInt(parts[1], 10)).padStart(2, '0');
    }
    return null;
};

window.formatActivityDate = function(val) {
    if (!val) return 'Hari ini';
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = val.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
    }
    if (typeof val === 'string' && (val.includes('Sat D') || val.includes('1899'))) {
        return 'Hari ini';
    }
    return val;
};

// Helper Global: Mengubah link Drive biasa menjadi Direct Link Gambar
window.getDirectDriveUrl = function(url) {
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

if (currentPage === 'index.html' || (currentPage === '' && 'index.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';

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

        window.setLoading = function (state) {
            const btn = document.getElementById('loginBtn');
            const txt = document.getElementById('btnText');
            btn.disabled = state;
            txt.innerHTML = state
                ? '<div class="loading-dots"><span></span><span></span><span></span></div>'
                : 'MASUK';
        }

        window.doLogin = async function () {
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
                    sessionStorage.setItem('hris_user', JSON.stringify(data.user));
                    showAlert('Login berhasil! Mengarahkan...', 'success');
                    setTimeout(() => {
                        window.location.href = data.user.role === 'Admin' ? 'admin.html' : 'employee.html';
                    }, 1000);
                } else {
                    showAlert(data.message || 'Email atau PIN salah.');
                }
            } catch (e) {
                showAlert('Gagal terhubung ke server. Cek koneksi internet Anda.');
            }
            setLoading(false);
        }

        document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('js/sw.js').catch(() => { });
        }
    })();
}

if (currentPage === 'admin.html' || (currentPage === '' && 'admin.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';
        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData || userData.role !== 'Admin') window.location.href = 'index.html';

        document.getElementById('sidebarName').textContent = userData?.name || 'Admin';
        const sidebarInitials = document.getElementById('sidebarInitials');
        const initials = (userData?.name || 'HR').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        
        window.updateAdminAvatar = function(url) {
            if (!sidebarInitials) return;
            const finalUrl = getDirectDriveUrl(url);
            if (finalUrl) {
                const img = document.createElement('img');
                img.src = finalUrl;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                img.onerror = () => { sidebarInitials.textContent = initials; };
                sidebarInitials.textContent = '';
                sidebarInitials.appendChild(img);
            } else {
                sidebarInitials.textContent = initials;
            }
        };

        // Init avatar
        updateAdminAvatar(userData?.profile_pic_url);

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
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        }

        window.closeModal = function (id) { document.getElementById(id).classList.add('hidden'); }

        // Clock
        setInterval(() => {
            const n = new Date();
            document.getElementById('liveTopClock').textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(x => String(x).padStart(2, '0')).join(':');
        }, 1000);

        // Navigation
        window.showPage = function (page, el) {
            if (el) {
                document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                el.classList.add('active');
            }
            document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`page-${page}`).classList.add('active');

            if (window.innerWidth <= 768) toggleSidebar();

            const titles = {
                dashboard: ['Dashboard', 'Overview kehadiran real-time'],
                users: ['Manajemen Karyawan', 'Kelola akun dan akses karyawan'],
                approval: ['Approval Pengajuan', 'Persetujuan Cuti, Sakit, dan Izin'],
                attendance: ['Riwayat Absensi', 'Log kehadiran seluruh karyawan'],
                config: ['Konfigurasi Sistem', 'Pengaturan lokasi, jam kerja, dan hari libur']
            };
            document.getElementById('topbarTitle').textContent = titles[page][0];
            document.getElementById('topbarSub').textContent = titles[page][1];

            if (page === 'dashboard') loadDashboard();
            else if (page === 'users') loadUsers();
            else if (page === 'approval') loadApprovals();
            else if (page === 'attendance') loadAttendance();
            else if (page === 'config') loadConfig();
        }

        // ==== DASHBOARD ====
        window.loadDashboard = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=adminDashboard&user_id=${userData.user_id}`);
                const data = await res.json();
                
                // Update profile pic if changed
                if (data.profile_pic_url) {
                    updateAdminAvatar(data.profile_pic_url);
                    // Sync to session
                    userData.profile_pic_url = data.profile_pic_url;
                    sessionStorage.setItem('hris_user', JSON.stringify(userData));
                }

                document.getElementById('s-hadir').textContent = data.stats?.hadir ?? 0;
                document.getElementById('s-total').textContent = data.stats?.total ?? 0;
                document.getElementById('s-late').textContent = data.stats?.terlambat ?? 0;
                document.getElementById('s-leave').textContent = data.stats?.cuti ?? 0;
                document.getElementById('s-absent').textContent = data.stats?.absen ?? 0;
                document.getElementById('pendingBadge').textContent = data.pending_count ?? 0;
                document.getElementById('pendingBadge').style.display = data.pending_count > 0 ? 'block' : 'none';
                renderLiveLog(data.live_log || []);
                
                if (window.renderChart && data.stats) {
                    window.renderChart(data.stats);
                }
                
                try {
                    const resUsers = await fetch(`${APPS_SCRIPT_URL}?action=getUsers`);
                    const dataUsers = await resUsers.json();
                    const allU = dataUsers.users || [];
                    const clockedInNames = (data.live_log || []).map(l => l.name);
                    const belumAbsen = allU.filter(u => u.role === 'Employee' && !clockedInNames.includes(u.name) && u.status === 'Active');
                    if (window.renderBelumAbsen) window.renderBelumAbsen(belumAbsen);
                } catch (eu) {}

            } catch (e) {
                console.error('Error loading dashboard:', e);
                showToast('Gagal memuat dashboard', 'error');
            }
        }

        window.renderLiveLog = function (logs) {
            const body = document.getElementById('liveLogBody');
            if (!logs.length) { body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px">Belum ada data hari ini</td></tr>'; return; }
            body.innerHTML = logs.map(l => `
    <tr>
      <td>
        <div class="user-cell">
          ${l.profile_pic ? 
            `<img src="${getDirectDriveUrl(l.profile_pic)}" class="avatar avatar-sm" style="object-fit:cover" onerror="this.outerHTML='<div class=\'avatar avatar-sm\'>${l.initials}</div>'">` : 
            `<div class="avatar avatar-sm">${l.initials}</div>`
          }
          <div class="user-cell-info">
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
            document.getElementById('modalPhotoImg').src = url;
            document.getElementById('modalPhoto').classList.remove('hidden');
        }

        // ==== USERS ====
        let allUsers = [];
        window.loadUsers = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getUsers`);
                const data = await res.json();
                allUsers = data.users || [];
            } catch (e) {
                console.error('Error loading users:', e);
                showToast('Gagal memuat data karyawan', 'error');
            }
            renderUsers(allUsers);
        }

        window.renderUsers = function (users) {
            const body = document.getElementById('userTableBody');
            if (!users.length) { body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px">Tidak ada data</td></tr>'; return; }
            body.innerHTML = users.map(u => `
    <tr>
      <td>
        <div class="user-cell">
          ${u.profile_pic_url ? 
            `<img src="${getDirectDriveUrl(u.profile_pic_url)}" class="avatar avatar-sm" style="object-fit:cover" onerror="this.outerHTML='<div class=\'avatar avatar-sm\'>${u.name?.substring(0, 2).toUpperCase()}</div>'">` : 
            `<div class="avatar avatar-sm">${u.name?.substring(0, 2).toUpperCase()}</div>`
          }
          <span class="user-cell-name">${u.name}</span>
        </div>
      </td>
      <td>${u.email}</td>
      <td>${u.position}</td>
      <td><span class="badge ${u.role === 'Admin' ? 'badge-primary' : 'badge-muted'}">${u.role}</span></td>
      <td><span class="badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}">${u.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-ghost" onclick='openEditUser(${JSON.stringify(u).replace(/'/g, "&#39;")})'><i class="bi bi-pencil-fill"></i></button>
          <button class="btn btn-sm ${u.status === 'Active' ? 'btn-danger' : 'btn-success'}" onclick="toggleUser('${u.user_id}','${u.status}')">
            ${u.status === 'Active' ? '<i class="bi bi-power"></i> Nonaktif' : '<i class="bi bi-check-circle"></i> Aktifkan'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
        }

        window.filterUsers = function () {
            const q = document.getElementById('userSearch').value.toLowerCase();
            const st = document.getElementById('userStatusFilter').value;
            renderUsers(allUsers.filter(u => (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (!st || u.status === st)));
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
            document.getElementById('mu_preview').src = u.profile_pic_url ? getDirectDriveUrl(u.profile_pic_url) : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
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
                role: document.getElementById('mu_role').value,
                profile_pic_base64,
                profile_pic_name
            };

            if (!payload.name || !payload.email || !payload.position) { showToast('Harap lengkapi semua data wajib', 'warn'); return; }

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

        window.toggleUser = async function (id, currentStatus) {
            const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
            if (!confirm(`Yakin mengubah status karyawan menjadi ${newStatus}?`)) return;
            try {
                await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'updateUserStatus', user_id: id, status: newStatus }) });
                showToast('Status diubah', 'success'); loadUsers();
            } catch (e) { showToast('Gagal mengubah status', 'error'); }
        }

        // ==== APPROVALS ====
        window.loadApprovals = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getPendingLeaves`);
                const data = await res.json();
                renderApprovals(data.requests || []);
            } catch (e) {
                console.error('Error loading approvals:', e);
                showToast('Gagal memuat data pengajuan', 'error');
            }
        }

        window.renderApprovals = function (reqs) {
            const body = document.getElementById('approvalBody');
            if (!reqs.length) { body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px">Tidak ada pengajuan</td></tr>'; return; }
            body.innerHTML = reqs.map(r => `
    <tr>
      <td><strong>${r.user_name}</strong></td>
      <td><span class="badge badge-info">${r.type}</span></td>
      <td style="white-space:nowrap">${r.start_date} - ${r.end_date}</td>
      <td style="max-width:200px;text-overflow:ellipsis;overflow:hidden">${r.reason}</td>
      <td>${r.attachment_url ? `<button class="btn btn-sm btn-ghost" onclick="viewDoc('${r.attachment_url}')"><i class="bi bi-file-earmark-text"></i> Lihat</button>` : '—'}</td>
      <td><span class="badge ${r.status === 'Pending' ? 'badge-warn' : r.status === 'Approved' ? 'badge-success' : 'badge-danger'}">${r.status}</span></td>
      <td>
        ${r.status === 'Pending' ? `
          <div class="action-btns">
            <button class="btn btn-sm btn-success" onclick="processApproval('${r.request_id}', 'Approved')"><i class="bi bi-check-lg"></i> Terima</button>
            <button class="btn btn-sm btn-danger" onclick="processApproval('${r.request_id}', 'Rejected')"><i class="bi bi-x-lg"></i> Tolak</button>
          </div>
        ` : '—'}
      </td>
    </tr>
  `).join('');
        }

        window.viewDoc = function (url) {
            document.getElementById('modalDocImg').src = url;
            document.getElementById('modalDoc').classList.remove('hidden');
        }

        window.processApproval = async function (id, status) {
            if (!confirm(`Yakin ${status === 'Approved' ? 'menerima' : 'menolak'} pengajuan ini?`)) return;
            try {
                await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'decideLeave', request_id: id, status, approved_by: userData.name }) });
                showToast(`Pengajuan ${status}`, 'success'); loadApprovals(); loadDashboard();
            } catch (e) { showToast('Gagal memproses pengajuan', 'error'); }
        }

        // ==== ATTENDANCE HISTORY ====
        window.loadAttendance = async function () {
            const start = document.getElementById('attFilterStart').value;
            const end = document.getElementById('attFilterEnd').value;
            const name = document.getElementById('attFilterName').value.trim();
            const status = document.getElementById('attFilterStatus').value;

            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getAttendance&start_date=${start}&end_date=${end}&name=${encodeURIComponent(name)}&status=${status}`);
                const data = await res.json();
                renderAtt(data.records || []);
            } catch (e) {
                console.error('Error loading attendance:', e);
                showToast('Gagal memuat data absensi', 'error');
            }
        }

        window.renderAtt = function (records) {
            const body = document.getElementById('attBody');
            if (!records.length) { body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px">Data tidak ditemukan</td></tr>'; return; }
            body.innerHTML = records.map(r => {
                const inTime = parseTime(r.clock_in_time) || '--:--';
                const outTime = parseTime(r.clock_out_time) || '--:--';
                const dist = r.distance_meters || r.distance;
                const photo = r.photo_in_url || r.photo_in;
                return `
    <tr>
      <td>
        <div class="user-cell">
          ${r.profile_pic ? 
            `<img src="${getDirectDriveUrl(r.profile_pic)}" class="avatar avatar-sm" style="object-fit:cover" onerror="this.outerHTML='<div class=\'avatar avatar-sm\'>${r.name?.substring(0, 2).toUpperCase()}</div>'">` : 
            `<div class="avatar avatar-sm">${r.name?.substring(0, 2).toUpperCase()}</div>`
          }
          <strong>${r.name}</strong>
        </div>
      </td>
      <td style="white-space:nowrap">${r.date}</td>
      <td><strong style="color:var(--text)">${inTime}</strong></td>
      <td><strong style="color:var(--text)">${outTime}</strong></td>
      <td>${dist ? dist + 'm' : '—'}</td>
      <td><span class="badge ${r.status_in === 'Terlambat' ? 'badge-warn' : 'badge-success'}">${r.status_in || '—'}</span></td>
      <td>${photo ? `<button class="btn btn-sm btn-ghost" onclick="viewPhoto('${getDirectDriveUrl(photo)}')"><i class="bi bi-camera"></i></button>` : '—'}</td>
    </tr>
  `;
            }).join('');
        }

        window.exportCSV = function () { showToast('Fungsi export CSV akan tersedia di versi produksi', 'info'); }

        // ==== CONFIG ====
        window.loadConfig = async function () {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=getConfig`);
                const data = await res.json();
                if (data.config) {
                    document.getElementById('cfg_lat').value = data.config.office_latitude || '';
                    document.getElementById('cfg_lng').value = data.config.office_longitude || '';
                    document.getElementById('cfg_radius').value = data.config.max_radius_meters || 50;
                    document.getElementById('cfg_wday_start').value = parseTime(data.config.weekday_start) || '';
                    document.getElementById('cfg_wday_end').value = parseTime(data.config.weekday_end) || '';
                    document.getElementById('cfg_tolerance').value = data.config.tolerance_minutes || 15;
                    document.getElementById('cfg_sat_start').value = parseTime(data.config.saturday_start) || '';
                    document.getElementById('cfg_sat_end').value = parseTime(data.config.saturday_end) || '';
                }
                renderHolidays(data.holidays || []);
            } catch (e) { renderHolidays([]); }
        }

        window.saveConfig = async function () {
            const payload = {
                action: 'saveConfig',

                office_latitude:
                    document.getElementById('cfg_lat').value,

                office_longitude:
                    document.getElementById('cfg_lng').value,

                max_radius_meters:
                    document.getElementById('cfg_radius').value,

                weekday_start:
                    document.getElementById('cfg_wday_start').value,

                weekday_end:
                    document.getElementById('cfg_wday_end').value,

                tolerance_minutes:
                    document.getElementById('cfg_tolerance').value,

                saturday_start:
                    document.getElementById('cfg_sat_start').value,

                saturday_end:
                    document.getElementById('cfg_sat_end').value,
            };
            try {
                await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                showToast('Konfigurasi disimpan', 'success');
            } catch (e) { showToast('Gagal menyimpan konfigurasi', 'error'); }
        }

        window.renderHolidays = function (holidays) {
            const list = document.getElementById('holidayList');
            if (!holidays.length) { list.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px">Belum ada data hari libur</div>'; return; }
            list.innerHTML = holidays.map(h => `
    <div class="holiday-item">
      <div class="holiday-info">
        <span class="holiday-desc">${h.description}</span>
        <span class="holiday-date"><i class="bi bi-calendar3"></i> ${h.date}</span>
      </div>
      <button class="del-btn" onclick="delHoliday('${h.id}')"><i class="bi bi-trash-fill"></i></button>
    </div>
  `).join('');
        }

        window.addHoliday = async function () {
            const date = document.getElementById('holiday_date').value;
            const desc = document.getElementById('holiday_desc').value;
            if (!date || !desc) { showToast('Lengkapi tanggal & keterangan libur', 'warn'); return; }
            try {
                await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'addHoliday', date, description: desc }) });
                showToast('Hari libur ditambahkan', 'success');
                document.getElementById('holiday_date').value = ''; document.getElementById('holiday_desc').value = '';
                loadConfig();
            } catch (e) { showToast('Gagal menambah hari libur', 'error'); }
        }

        window.delHoliday = async function (id) {
            if (!confirm('Hapus hari libur ini?')) return;
            try {
                await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteHoliday', holiday_id: id }) });
                showToast('Hari libur dihapus', 'success'); loadConfig();
            } catch (e) { showToast('Gagal menghapus hari libur', 'error'); }
        }

        window.logout = function () {
            showModalConfirm('Keluar Akun', 'Apakah Anda yakin ingin keluar dari sistem e-Attendance?', function() {
                sessionStorage.removeItem('hris_user');
                window.location.href = 'index.html';
            });
        }

        // Init
        showPage('dashboard');
    })();
}

if (currentPage === 'attendance.html' || (currentPage === '' && 'attendance.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';
        let MAX_RADIUS = 100;
        let OFFICE_LAT = 0;
        let OFFICE_LNG = 0;

        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData) window.location.href = 'index.html';

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
                ? 'Anda di area kantor'
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

            geoWatchId = navigator.geolocation.watchPosition(

                pos => {

                    const accuracy = Number(pos.coords.accuracy || 999);

                    currentLat = Number(pos.coords.latitude);
                    currentLng = Number(pos.coords.longitude);

                    // wajib akurat
                    if (accuracy > 50) {

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
                            `Akurasi GPS: <strong>${Math.round(accuracy)}m</strong><br>Mohon tunggu...`;

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
                        accuracy
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
                },

                err => {

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
                },

                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 15000
                }
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
                document.getElementById('cameraToggle').textContent = 'Kamera Aktif ✓';
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
            if (isLockedOut) { btn.disabled = true; return; }
            btn.disabled = !(geoOk && photoOk);
        }

        // ---- PRE-FLIGHT CHECK ----
        window.preFlightCheck = async function () {
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
                    type === 'holiday' ? 'Hari Libur Nasional' : 'Absensi Terkunci',
                    reason,
                    type === 'holiday' ? 'info' : 'warn'
                );
            }
        }

        // ---- SUBMIT ----
        window.submitAttendance = async function () {
            if (!geoOk || !photoOk) { showToast('Pastikan lokasi & foto selfie sudah siap', 'warn'); return; }

            if (!currentLat || !currentLng) {

                showToast(
                    'GPS belum valid',
                    'error'
                );

                return;
            }

            if (currentDist > MAX_RADIUS) {

                showToast(
                    'Anda berada di luar radius kantor',
                    'error'
                );

                return;
            }

            const btn = document.getElementById('mainBtn');
            const origText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '⏳ Menyimpan...';

            try {
                const payload = {
                    action: attendanceMode === 'in' ? 'clockIn' : 'clockOut',

                    user_id: userData.user_id,

                    lat: currentLat,

                    lng: currentLng,

                    office_lat: OFFICE_LAT,

                    office_lng: OFFICE_LNG,

                    distance_meters: Math.round(currentDist),

                    photo_base64: photoBase64
                };


                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.success) {
                    showToast(`${attendanceMode === 'in' ? 'Clock In' : 'Clock Out'} berhasil! ${result.status || ''}`, 'success');
                    setTimeout(() => window.location.href = 'employee.html', 2000);
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
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';

        // Auth Guard
        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData || userData.role !== 'Employee') { window.location.href = 'index.html'; }

        // Profile
        document.getElementById('userName').textContent = userData?.name || '—';
        document.getElementById('userPosition').textContent = userData?.position || '—';
        const initials = (userData?.name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const avatarEl = document.getElementById('avatarEl');
        
        window.updateAvatar = function(url) {
            if (!avatarEl) return;
            const finalUrl = getDirectDriveUrl(url);
            if (finalUrl) {
                const img = document.createElement('img');
                img.src = finalUrl;
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
            document.getElementById('dayName').textContent = DAYS[now.getDay()];
            document.getElementById('dateStr').textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
            document.getElementById('liveClock').textContent =
                [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
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
                    
                    document.getElementById('statHadir').textContent = data.stats.hadir ?? 0;
                    document.getElementById('statTerlambat').textContent = data.stats.terlambat ?? 0;
                    document.getElementById('statCuti').textContent = data.stats.sisa_cuti ?? 12;

                    if (data.today_in) {
                        document.getElementById('clockInTime').textContent = data.today_in;
                        document.getElementById('statusIn').textContent = data.status_in || 'Tepat Waktu';
                        document.getElementById('statusIn').className = 'status-badge ' + (data.status_in === 'Terlambat' ? 'late' : 'on-time');
                    }
                    if (data.today_out) {
                        document.getElementById('clockOutTime').textContent = data.today_out;
                        document.getElementById('clockOutTime').className = 'time-val';
                        document.getElementById('statusOut').textContent = data.status_out || 'Normal';
                        document.getElementById('statusOut').className = 'status-badge on-time';
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
            } catch (e) {
                // Demo fallback
                document.getElementById('statHadir').textContent = 18;
                document.getElementById('statTerlambat').textContent = 2;
                document.getElementById('statCuti').textContent = 10;
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
            }
        }

        window.logout = function () {
            showModalConfirm('Keluar Akun', 'Apakah Anda yakin ingin keluar dari sistem e-Attendance?', function() {
                sessionStorage.removeItem('hris_user');
                window.location.href = 'index.html';
            });
        }

        window.loadHistory = function () { window.location.href = 'history.html'; }
        window.loadLeaveHistory = function () { window.location.href = 'leave.html'; }

        loadDashboard();
    })();
}

if (currentPage === 'history.html' || (currentPage === '' && 'history.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';
        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData || userData.role !== 'Employee') window.location.href = 'index.html';

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
                return `
      <div class="history-item">
        <div class="history-header">
          <div>
            <div class="history-date">${day}, ${date}</div>
          </div>
          <span class="status-badge ${statusCls}">${statusTxt}</span>
        </div>
        <div class="history-times">
          <div class="time-block">
            <div class="time-lbl">Masuk</div>
            <div class="time-val ${r.clock_in_time ? '' : 'empty'}">${inTime}</div>
          </div>
          <div class="time-block">
            <div class="time-lbl">Pulang</div>
            <div class="time-val ${hasOut ? '' : 'empty'}">${outTime}</div>
          </div>
        </div>
        ${r.notes ? `<div class="history-notes"><i class="bi bi-chat-left-text"></i>${r.notes}</div>` : ''}
      </div>`;
            }).join('');
        }

        window.goBack = function () { window.location.href = 'employee.html'; }
        window.logout = function () {
            showModalConfirm('Keluar Akun', 'Apakah Anda yakin ingin keluar dari sistem e-Attendance?', function() {
                sessionStorage.removeItem('hris_user');
                window.location.href = 'index.html';
            });
        }

        loadHistory();
    })();
}

if (currentPage === 'leave.html' || (currentPage === '' && 'leave.js' === 'index.js')) {
    (function () {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';
        const userData = JSON.parse(sessionStorage.getItem('hris_user') || 'null');
        if (!userData) window.location.href = 'index.html';

        let selectedType = 'Cuti', fileBase64 = null, fileName = null;
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
            if (!reason) { showToast('Alasan wajib diisi', 'warn'); return; }
            if (selectedType === 'Sakit' && !fileBase64) { showToast('Upload surat dokter untuk pengajuan sakit', 'warn'); return; }
            const btn = document.getElementById('submitBtn');
            btn.disabled = true; btn.innerHTML = '<div class="spinner" style="border-top-color:#000"></div> Mengirim...';
            try {
                const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'submitLeave', user_id: userData.user_id, type: selectedType, start_date: startDate, end_date: endDate, reason, attachment_base64: fileBase64, attachment_name: fileName }) });
                const data = await res.json();
                if (data.success) {
                    showToast('Pengajuan berhasil dikirim! Menunggu persetujuan HR.', 'success');
                    document.getElementById('startDate').value = ''; document.getElementById('endDate').value = ''; document.getElementById('reason').value = '';
                    clearFile(); document.getElementById('dateRangeInfo').classList.remove('show');
                } else { showToast(data.message || 'Gagal mengirim pengajuan', 'error'); }
            } catch (e) { showToast('[DEMO] Pengajuan berhasil dikirim!', 'success'); }
            btn.disabled = false; btn.innerHTML = '<i class="bi bi-send-fill"></i> KIRIM PENGAJUAN';
        }

        window.loadHistory = async function () {
            const list = document.getElementById('historyList');
            const statusBadge = (s) => { const m = { pending: 'badge-warn', approved: 'badge-success', rejected: 'badge-danger' }; return `<span class="badge ${m[s.toLowerCase()] || 'badge-muted'}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`; };
            const typeIcon = (t) => ({ Cuti: '🌴', Sakit: '🏥', Izin: '📝' }[t] || '📄');
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=leaveHistory&user_id=${userData.user_id}`);
                const data = await res.json();
                const items = data.success && data.requests ? data.requests : [];
                if (!items.length) {
                    list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)">Belum ada riwayat pengajuan</div>';
                    return;
                }
                list.innerHTML = items.map(r => `
      <div class="history-card fade-in">
        <div class="history-card-header">
          <div class="history-type">${typeIcon(r.type)} ${r.type}</div>
          ${statusBadge(r.status)}
        </div>
        <div class="history-dates"><i class="bi bi-calendar3"></i> ${r.start_date} s.d ${r.end_date}</div>
        <div class="history-reason">${r.reason}</div>
      </div>`).join('');
            } catch (e) {
                list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)">Gagal memuat riwayat</div>';
            }
        }
    })();
}

