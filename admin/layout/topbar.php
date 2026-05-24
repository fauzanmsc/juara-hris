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
            <!-- <div class="live-dot"></div> -->
            <i class="bi bi-clock-fill text-primary" style="font-size:11px;"></i>
            <span id="liveTopClock">--:--:--</span>
          </div>
        </div>
      </header>

      <div class="admin-content">
