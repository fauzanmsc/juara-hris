const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';

function togglePass() {
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

function showAlert(msg, type = 'error') {
    const box = document.getElementById('alertBox');
    const icon = document.getElementById('alertIcon');
    box.className = 'alert-box ' + type;
    icon.className = type === 'error' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-check-circle-fill';
    document.getElementById('alertMsg').textContent = msg;
}
function hideAlert() { document.getElementById('alertBox').className = 'alert-box'; }

function setLoading(state) {
    const btn = document.getElementById('loginBtn');
    const txt = document.getElementById('btnText');
    btn.disabled = state;
    txt.innerHTML = state
        ? '<div class="loading-dots"><span></span><span></span><span></span></div>'
        : 'MASUK';
}

async function doLogin() {
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
    navigator.serviceWorker.register('/js/sw.js').catch(() => { });
}