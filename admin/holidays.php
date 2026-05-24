<?php
$currentPage = 'holidays';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- HOLIDAYS PAGE -->
        <section class="page-section active fade-in" id="page-holidays">
          <div class="card">
            <h3 class="card-title" style="margin-bottom:20px"><i class="bi bi-calendar2-x-fill text-danger"
                style="margin-right:8px"></i> Hari Libur Operasional</h3>

            <input type="hidden" id="holiday_old_id">
            <div class="holiday-form-grid" style="margin-bottom:20px;">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Tanggal Mulai</label>
                <input type="date" class="form-control" id="holiday_start_date">
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Tanggal Selesai (Opsional)</label>
                <input type="date" class="form-control" id="holiday_end_date">
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Keterangan Libur</label>
                <input type="text" class="form-control" id="holiday_desc" placeholder="Contoh: Libur Lebaran">
              </div>
              <button class="btn btn-primary btn-neu-3d" id="btnSaveHoliday"
                style="height:42px; display:flex; align-items:center; justify-content:center; padding:0 20px;"
                onclick="addHoliday()"><i class="bi bi-plus-lg" id="holidayBtnIcon" style="margin-right:6px"></i> <span
                  id="holidayBtnText">Tambah</span></button>
            </div>

            <div class="holiday-layout-grid">
              <!-- Kolom Kiri: Daftar Hari Libur -->
              <div class="holiday-list-section">
                <h3 class="card-title" style="margin-bottom:16px;"><i class="bi bi-list-task text-primary"
                    style="margin-right:8px"></i> Daftar Hari Libur</h3>
                <div class="holiday-list" id="holidayList" style="margin-top:0;">
                  <div style="text-align:center;padding:30px;color:var(--text-muted)">Memuat hari libur...</div>
                </div>
              </div>

              <!-- Kolom Kanan: Kalender Hari Libur -->
              <div class="holiday-calendar-section">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                  <h3 class="card-title" style="margin:0;"><i class="bi bi-calendar3 text-primary"
                      style="margin-right:8px"></i> Kalender Hari Libur</h3>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="prevCalendarMonth()" class="btn btn-muted btn-sm"
                      style="border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; padding:0;"><i
                        class="bi bi-chevron-left"></i></button>
                    <h4 id="calendarMonthYear"
                      style="margin:0; font-family:var(--font-head); font-weight:800; font-size:13px; color:var(--text); width:90px; text-align:center;">
                      Mei 2026</h4>
                    <button onclick="nextCalendarMonth()" class="btn btn-muted btn-sm"
                      style="border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; padding:0;"><i
                        class="bi bi-chevron-right"></i></button>
                  </div>
                </div>
                <div id="calendarGrid" class="calendar-grid"
                  style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; text-align:center;">
                  <!-- Populated dynamically by script.js -->
                </div>
              </div>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
