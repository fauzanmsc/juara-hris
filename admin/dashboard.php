<?php
$currentPage = 'dashboard';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- DASHBOARD PAGE -->
        <section class="page-section active fade-in" id="page-dashboard">

          <!-- SaaS Landing Apps Hero Banner -->
          <div class="hris-landing-hero fade-in">
            <h1
              style="font-family:var(--font-head); font-weight:900; font-size:28px; color:var(--text); line-height:1.2; margin-bottom:10px;">
              Selamat Datang, <span id="adminWelcomeName" style="color:var(--primary);">Admin</span>! 👋
            </h1>
            <p style="color:var(--text-muted); font-size:13px; line-height:1.6;">
              Pusat kendali untuk mengelola data talenta, absensi real-time, cuti, struktur organisasi, dan produktivitas karyawan secara akurat.
            </p>
          </div>

          <div class="grid-4 stagger">
            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <div class="stat-value" id="s-hadir">—</div>
                  <div class="stat-label">Hadir Hari Ini</div>
                </div>
                <div class="stat-icon stat-icon-success"><i class="bi bi-person-check-fill"></i></div>
              </div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:12px; display: none;">dari <strong
                  id="s-total" class="text-primary">—</strong> karyawan aktif</div>
            </div>

            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <div class="stat-value text-warn" id="s-late">—</div>
                  <div class="stat-label">Terlambat</div>
                </div>
                <div class="stat-icon stat-icon-warn"><i class="bi bi-clock-fill"></i></div>
              </div>
            </div>

            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <div class="stat-value text-primary" id="s-leave">—</div>
                  <div class="stat-label">Cuti / Izin</div>
                </div>
                <div class="stat-icon stat-icon-primary"><i class="bi bi-calendar-check-fill"></i></div>
              </div>
            </div>

            <div class="stat-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <div class="stat-value text-danger" id="s-absent">—</div>
                  <div class="stat-label">Belum Absen</div>
                </div>
                <div class="stat-icon stat-icon-danger"><i class="bi bi-person-x-fill"></i></div>
              </div>
            </div>
          </div>

          <!-- DASHBOARD GRAPHS & LISTS -->
          <div class="dashboard-layout-grid fade-in">
            <!-- LIVE LOG -->
            <div class="card p-0" style="margin:0;">
              <div class="card-header" style="padding: 24px 24px 0;">
                <div>
                  <h3 class="card-title"><i class="bi bi-activity text-primary" style="margin-right:8px"></i>Live Log
                    Absensi</h3>
                  <p class="card-subtitle">Aktivitas kehadiran hari ini</p>
                </div>
                <button class="btn btn-sm btn-primary" onclick="loadDashboard()"><i class="bi bi-arrow-clockwise"></i>
                  Refresh</button>
              </div>
              <div class="table-wrap"
                style="border: none; border-radius: 0; border-top: 1px solid var(--border); margin-top: 20px;">
                <table>
                  <thead id="liveLogThead">
                    <tr>
                      <th style="cursor:pointer;" onclick="sortLiveLogsTable('name')" data-sort="name">Karyawan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                      <th style="cursor:pointer;" onclick="sortLiveLogsTable('clock_in')" data-sort="clock_in">Masuk <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                      <th style="cursor:pointer;" onclick="sortLiveLogsTable('clock_out')" data-sort="clock_out">Pulang <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                      <th style="cursor:pointer;" onclick="sortLiveLogsTable('distance')" data-sort="distance">Jarak <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                      <th style="cursor:pointer;" onclick="sortLiveLogsTable('status_in')" data-sort="status_in">Status <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody id="liveLogBody">
                    <tr>
                      <td colspan="6" style="text-align:center;padding:30px">Memuat data...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- STATISTIK & BELUM ABSEN -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
              <!-- PIE CHART -->
              <div class="card" style="margin:0; padding:20px;">
                <h3 class="card-title"><i class="bi bi-pie-chart-fill text-primary"
                    style="margin-right:8px"></i>Statistik Kehadiran</h3>
                <div style="height: 200px; width: 100%; margin-top: 16px; position: relative;">
                  <canvas id="dashChart"></canvas>
                </div>
              </div>

              <!-- BELUM ABSEN -->
              <div class="card p-0" style="margin:0;">
                <div class="card-header" style="padding: 20px 20px 0;">
                  <div>
                    <h3 class="card-title text-danger"><i class="bi bi-person-x-fill" style="margin-right:8px"></i>Belum
                      Absen</h3>
                    <p class="card-subtitle">Karyawan belum Clock In hari ini</p>
                  </div>
                </div>
                <div class="table-wrap"
                  style="border: none; border-radius: 0; border-top: 1px solid var(--border); margin-top: 16px; max-height: 250px; overflow-y: auto;">
                  <table class="table-compact">
                    <tbody id="belumAbsenBody">
                      <tr>
                        <td style="text-align:center;padding:20px;color:var(--text-muted)">Memuat data...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
