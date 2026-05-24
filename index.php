<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JEF HRIS — Login</title>
  <meta name="description" content="Platform manajemen kehadiran dan SDM terpadu untuk tim JEF Group">
  <meta name="theme-color" content="#FFB703">
  <link rel="manifest" href="json/manifest.json">
  <link rel="apple-touch-icon" href="images/icon-192.png">
  <meta property="og:title" content="JEF HRIS">
  <meta property="og:description" content="HR Information System — JEF Group">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
    rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>

<body class="login-page">

  <!-- Premium Page Loader -->
  <div id="pageLoader"
    style="position: fixed; inset: 0; background: var(--bg-deep); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.5s ease, visibility 0.5s ease; backdrop-filter: blur(10px);">
    <div style="text-align: center;">
      <!-- <div class="brand" style="margin-bottom: 24px; justify-content: center;">
        <div class="brand-logo" style="width: 60px; height: 60px; font-size: 24px; border-radius: 16px; background: var(--primary-grad); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-head);">JG</div>
        <div class="brand-name" style="font-size: 22px; font-family: var(--font-head); font-weight: 800; color: var(--text); margin-left: 10px;">JEF <span style="color: var(--primary);">GROUP</span></div>
      </div> -->
      <div
        style="width: 48px; height: 48px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;">
      </div>
      <p
        style="font-family: var(--font-body); font-size: 13px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">
        SINKRONISASI SISTEM...</p>
    </div>
  </div>

  <!-- Floating Theme Toggle for Login Page -->
  <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Ganti Mode"
    style="position: absolute; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 18px; transition: all var(--transition); cursor: pointer; z-index: 100;">
    <i class="bi bi-sun-fill"></i>
  </button>

  <div class="bg-wrap">
    <div class="bg-orb-1"></div>
    <div class="bg-orb-2"></div>
    <div class="bg-grid"></div>
  </div>

  <!-- LEFT PANEL -->
  <div class="left-panel">
    <div class="brand" onclick="window.location.reload()" style="cursor: pointer;">
      <img src="img/logo-jef.png" alt="JEF GROUP" class="logo-dark" style="height: 46px; width: auto; object-fit: contain;">
      <img src="img/logo-jef-light.png" alt="JEF GROUP" class="logo-light" style="height: 46px; width: auto; object-fit: contain;">
    </div>

    <div class="hero">
      <h1 class="animate-h1">Human Capital <span class="hc-pulse-badge">⚡</span><br><span
          class="grad">HRIS Platform</span></h1>
      <p class="animate-p">Platform manajemen kehadiran karyawan berbasis Google Workspace untuk seluruh tim JEF Group.
      </p>

      <!-- CREATIVE NEUMORPHIC LIVE CLOCK -->
      <div class="login-clock-container fade-in-clock">
        <div class="login-clock-face">
          <div class="login-clock-time" id="loginClockTime">00:00:00</div>
          <div class="login-clock-date" id="loginClockDate">Memuat waktu...</div>
        </div>
      </div>

      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-dot"><i class="bi bi-geo-alt-fill"></i></div>Absensi dengan Geofencing &amp; Selfie
        </div>
        <div class="feature-item">
          <div class="feature-dot"><i class="bi bi-calendar-check-fill"></i></div>Manajemen Cuti, Sakit &amp; Izin
        </div>
        <div class="feature-item">
          <div class="feature-dot"><i class="bi bi-graph-up-arrow"></i></div>HR Dashboard &amp; Laporan Real-time
        </div>
        <div class="feature-item">
          <div class="feature-dot"><i class="bi bi-gear-fill"></i></div>Konfigurasi Dinamis
        </div>
      </div>
    </div>
  </div>

  <!-- RIGHT PANEL (LOGIN FORM) -->
  <div class="right-panel">
    <!-- MOBILE BRAND LOGO (Shown only on Mobile) -->
    <div class="brand mobile-brand" onclick="window.location.reload()" style="cursor: pointer;">
      <img src="img/logo-jef.png" alt="JEF GROUP" class="logo-dark" style="height: 46px; width: auto; object-fit: contain;">
      <img src="img/logo-jef-light.png" alt="JEF GROUP" class="logo-light" style="height: 46px; width: auto; object-fit: contain;">
    </div>

    <div id="loginFormSection">
      <div class="form-header">
        <h2>Selamat Datang 👋</h2>
        <p>Masuk dengan email &amp; PIN karyawan Anda</p>
      </div>

      <div class="alert-box" id="alertBox">
        <i class="bi bi-exclamation-triangle-fill" id="alertIcon"></i>
        <span id="alertMsg">—</span>
        <button class="alert-close-btn" onclick="hideAlert()" type="button">&times;</button>
      </div>

      <div class="form-group">
        <label class="form-label">Email Karyawan</label>
        <div class="input-wrap">
          <i class="bi bi-envelope input-icon"></i>
          <input type="email" id="emailInput" placeholder="nama@jefgroup.id" autocomplete="email">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">PIN / Password</label>
        <div class="input-wrap">
          <i class="bi bi-shield-lock input-icon"></i>
          <input type="password" id="pinInput" placeholder="Masukkan PIN Anda" autocomplete="current-password"
            maxlength="20">
          <button class="toggle-pass" id="togglePassBtn" onclick="togglePass()" type="button">
            <i class="bi bi-eye" id="togglePassIcon"></i>
          </button>
        </div>
      </div>

      <button class="btn-login btn-neu-3d" id="loginBtn" onclick="doLogin()">
        <span id="btnText">MASUK</span>
      </button>

      <div style="text-align: center; margin-top: 24px; font-size: 13px; font-weight: 600; color: var(--text-muted);">
        Belum punya akses? <a href="javascript:void(0)" onclick="showRegistration()"
          style="color: var(--primary); text-decoration: none; font-weight: 700;">Registrasi Karyawan</a>
      </div>
    </div>

    <div class="form-footer" style="line-height: 1.6; text-align: center;">
      <div>JEF GROUP HRIS v2.0 © 2026</div>
      <div style="font-size: 11px; margin-top: 4px; opacity: 0.8;">Powered by Google Workspace</div>
    </div>
  </div>

  <!-- REGISTRATION MODAL OVERLAY -->
  <div class="reg-modal-overlay hidden" id="registerFormSection" onclick="if(event.target===this)showLogin()">
    <div class="reg-modal-container">

      <!-- Registration Card Neumorphisme -->
      <div class="reg-modal-card">
        <div class="card-border-glow"></div>
        <button class="reg-modal-close" onclick="showLogin()" type="button">&times;</button>

        <div class="form-header" style="margin-bottom: 20px; text-align:center;">
          <h2 style="font-size:22px; font-weight:800; color:var(--text); font-family:var(--font-head); margin: 0;">
            Registrasi Karyawan</h2>
          <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">Lengkapi data diri Anda untuk akses
            HRIS Platform</p>
        </div>

        <div class="alert-box" id="registerAlertBox">
          <i class="bi bi-exclamation-triangle-fill" id="registerAlertIcon"></i>
          <span id="registerAlertMsg">—</span>
          <button class="alert-close-btn" onclick="hideRegAlert()" type="button">&times;</button>
        </div>

        <form id="formRegister" onsubmit="doRegister(event)" style="display:flex; flex-direction:column; gap:12px;">
          <!-- Avatar Uploader at the Top -->
          <div class="reg-avatar-upload-container"
            style="display:flex; flex-direction:column; align-items:center; position:relative; cursor:pointer; margin-bottom: 4px;"
            onclick="document.getElementById('regPhoto').click()">
            <div class="reg-avatar-preview" id="regAvatarPreview"
              style="width:84px; height:84px; border-radius:50%; border:3px dashed var(--primary); padding:3px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:var(--bg-deep); transition: all var(--transition); box-shadow: var(--shadow-neu-inset);">
              <span id="regAvatarInitials"
                style="font-family:var(--font-head); font-weight:800; font-size:28px; color:var(--primary); transition: all var(--transition);">JG</span>
              <img id="previewAvatarImg" src=""
                style="width:100%; height:100%; border-radius:50%; object-fit:cover; display:none;" alt="Preview Foto">
            </div>
            <span
              style="font-size:10px; color:var(--primary); font-weight:700; margin-top:6px; text-transform:uppercase; letter-spacing:0.5px;"><i
                class="bi bi-camera-fill"></i> Ubah Foto Profil</span>
            <input type="file" id="regPhoto" accept="image/*" style="display:none;" onchange="previewRegPhoto(this)"
              required>
          </div>

          <div class="form-group">
            <label class="form-label" style="text-align:left; font-size:11px;">Nama Lengkap</label>
            <div class="input-wrap">
              <i class="bi bi-person input-icon"></i>
              <input type="text" id="regName" placeholder="Masukkan nama lengkap Anda" required
                oninput="updateRegInitials(this.value)">
            </div>
          </div>

          <!-- Side-by-Side row: Username and PIN -->
          <div class="grid-2-resp" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:0; padding:0;">
            <div class="form-group">
              <label class="form-label" style="text-align:left; font-size:11px;">Email Karyawan</label>
              <div class="input-wrap reg-email-wrap">
                <i class="bi bi-envelope input-icon"></i>
                <input type="text" id="regEmail" placeholder="username" required>
                <span class="reg-email-suffix">@jefgroup.id</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="text-align:left; font-size:11px;">PIN Login (6 Digit)</label>
              <div class="input-wrap">
                <i class="bi bi-shield-lock input-icon"></i>
                <input type="password" id="regPassword" placeholder="Buat PIN" required maxlength="6" pattern="\d{6}"
                  inputmode="numeric">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" style="text-align:left; font-size:11px;">Jabatan (Position)</label>
            <div class="input-wrap" style="position: relative;">
              <i class="bi bi-briefcase input-icon"></i>
              <select id="regPosition" class="form-control reg-custom-select" required>
                <option value="" disabled selected>Memuat daftar jabatan...</option>
              </select>
              <i class="bi bi-chevron-down" style="position: absolute; right: 14px; pointer-events: none; color: var(--text-muted); font-size: 12px;"></i>
            </div>
          </div>

          <!-- Actions Row -->
          <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:12px; margin-top:8px;">
            <button class="btn btn-muted btn-neu-3d" type="button" onclick="resetRegisterForm()"
              style="height:42px; border-radius:50px; font-weight:700; font-size:12px; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:6px; background:var(--bg-deep); color:var(--text-muted); border:1px solid var(--border);">
              <i class="bi bi-arrow-counterclockwise"></i> Reset Data
            </button>
            <button class="btn-login btn-neu-3d" type="submit"
              style="margin:0; height:42px; display:flex; align-items:center; justify-content:center; font-size: 12px; border-radius: 50px;">
              <span>DAFTAR SEKARANG</span>
            </button>
          </div>
        </form>

        <div style="text-align: center; margin-top: 16px; font-size: 13px; font-weight: 600; color: var(--text-muted);">
          Sudah punya akun? <a href="javascript:void(0)" onclick="showLogin()"
            style="color: var(--primary); text-decoration: none; font-weight: 700;">Masuk di sini</a>
        </div>
      </div>
    </div>
  </div>

  <!-- FLOATING CUSTOMER SERVICE (WhatsApp Live Chat) -->
  <div class="floating-cs" id="floatingCS" onclick="contactCS()" title="Hubungi CS (WhatsApp)">
    <div class="cs-pulse"></div>
    <i class="bi bi-whatsapp"></i>
    <span class="cs-tooltip">Live Chat Admin WA</span>
  </div>

  <!-- WA CHAT POPUP WINDOW -->
  <div class="wa-chat-popup hidden" id="waChatPopup">
    <div class="wa-chat-header">
      <div class="wa-chat-avatar"><i class="bi bi-person-fill-gear" style="font-size:18px;"></i></div>
      <div class="wa-chat-header-info">
        <h4>HC Support</h4>
        <p><span class="wa-chat-dot"></span> Online</p>
      </div>
      <button class="wa-chat-close" onclick="toggleWAPopup()">&times;</button>
    </div>
    <div class="wa-chat-body">
      <p style="font-size:11px; margin-bottom:10px; color:var(--text-muted); line-height:1.4;">Hai! Tulis pesan Anda di
        bawah ini, kami akan langsung menghubungkan Anda ke WhatsApp Admin.</p>
      <textarea id="waChatMessage" class="form-control" rows="3" placeholder="Tulis pesan bantuan Anda..."
        style="resize:none; font-size:13px; font-weight:600; margin-bottom:10px; width:100%; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); color:var(--text); outline:none; padding:8px;"></textarea>
      <button class="btn btn-success btn-neu-3d"
        style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; height:38px; border-radius:50px; background:#25d366 !important; border-color:#25d366 !important; color:#000 !important; font-weight:800; font-size:12px; text-transform:uppercase;"
        onclick="sendWAMessage()">
        <i class="bi bi-send-fill"></i> Kirim ke WhatsApp
      </button>
    </div>
  </div>

  <script src="js/script.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const loader = document.getElementById('pageLoader');
      if (loader) {
        setTimeout(() => {
          loader.style.opacity = '0';
          loader.style.visibility = 'hidden';
        }, 1200);
      }

      // Live Clock in left panel
      function updateLoginClock() {
        const timeEl = document.getElementById('loginClockTime');
        const dateEl = document.getElementById('loginClockDate');
        if (!timeEl || !dateEl) return;

        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('id-ID', options);
      }
      setInterval(updateLoginClock, 1000);
      updateLoginClock();

      // Typewriter typing animation for HRIS Platform header & descriptions
      const h1El = document.querySelector('.animate-h1');
      const pEl = document.querySelector('.animate-p');
      if (h1El) {
        const originalH1 = `Human Capital <span class="hc-pulse-badge">⚡</span><br><span class="grad">HRIS Platform</span>`;
        h1El.innerHTML = '';
        let index = 0;
        const speed = 40;
        function typeH1() {
          if (index < originalH1.length) {
            if (originalH1[index] === '<') {
              const tagEnd = originalH1.indexOf('>', index);
              if (tagEnd !== -1) {
                h1El.innerHTML = originalH1.substring(0, tagEnd + 1);
                index = tagEnd + 1;
              } else {
                h1El.innerHTML = originalH1.substring(0, index + 1);
                index++;
              }
            } else {
              h1El.innerHTML = originalH1.substring(0, index + 1);
              index++;
            }
            setTimeout(typeH1, speed);
          } else {
            if (pEl) {
              pEl.style.opacity = '1';
              pEl.style.transform = 'translateY(0)';
            }
          }
        }
        typeH1();
      }

      // WA Support in-page chat popup functions
      window.toggleWAPopup = function () {
        const popup = document.getElementById('waChatPopup');
        popup.classList.toggle('hidden');
        if (!popup.classList.contains('hidden')) {
          document.getElementById('waChatMessage').focus();
        }
      }

      window.sendWAMessage = function () {
        const msg = document.getElementById('waChatMessage').value.trim();
        if (!msg) {
          alert('Tulis pesan Anda terlebih dahulu.');
          return;
        }
        const waNum = (window.systemConfig && window.systemConfig.wa_admin) || '628123456789';
        const formattedMsg = `Hai Admin, ${msg}`;
        const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(formattedMsg)}`;
        window.open(waUrl, '_blank');
        document.getElementById('waChatMessage').value = '';
        toggleWAPopup();
      }

      // Override global contactCS
      window.contactCS = function () {
        toggleWAPopup();
      }
    });

    // Helper functions for registration preview & reset
    window.updateRegInitials = function (val) {
      const img = document.getElementById('previewAvatarImg');
      const initialsSpan = document.getElementById('regAvatarInitials');
      if (img.style.display === 'none') {
        const initials = val ? val.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'JG';
        initialsSpan.textContent = initials;
      }
    }

    window.resetRegisterForm = function () {
      const form = document.getElementById('formRegister');
      if (form) form.reset();

      const img = document.getElementById('previewAvatarImg');
      const initialsSpan = document.getElementById('regAvatarInitials');
      img.src = '';
      img.style.display = 'none';
      initialsSpan.textContent = 'JG';
      initialsSpan.style.display = 'flex';
    }
  </script>
</body>

</html>
