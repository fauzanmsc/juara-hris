<?php
$currentPage = 'config';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- CONFIG PAGE -->
        <section class="page-section active fade-in" id="page-config">
          <div class="card" style="margin-bottom: 24px;">
            <h3 class="card-title" style="margin-bottom:20px"><i class="bi bi-sliders text-primary"
                style="margin-right:8px"></i> Pengaturan Sistem &amp; Jam Kerja</h3>

            <div class="grid-2-resp">
              <!-- Left Column: Geofence -->
              <div class="config-group" style="border:none; padding:0; margin:0;">
                <h4 style="margin-bottom:14px;"><i class="bi bi-geo-alt-fill text-primary" style="margin-right:6px"></i>
                  Lokasi Kantor (Geofence)</h4>
                <div class="form-group">
                  <label class="form-label">Latitude</label>
                  <input type="text" class="form-control" id="cfg_lat" placeholder="-6.2088">
                </div>
                <div class="form-group">
                  <label class="form-label">Longitude</label>
                  <input type="text" class="form-control" id="cfg_lng" placeholder="106.8456">
                </div>
                <div class="form-group">
                  <label class="form-label">Radius Maksimal (meter)</label>
                  <input type="number" class="form-control" id="cfg_radius" value="50">
                </div>
                <div id="configMap"
                  style="height: 180px; border-radius: var(--radius-md); margin-top: 15px; border: 1px solid var(--border); box-shadow: var(--shadow-neu-inset); z-index: 1;">
                </div>
              </div>

              <!-- Right Column: Jam Kerja -->
              <div class="config-group" style="border:none; padding:0; margin:0;">
                <h4 style="margin-bottom:14px;"><i class="bi bi-clock-fill text-primary" style="margin-right:6px"></i>
                  Waktu Absensi</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px">
                  <div class="form-group">
                     <label class="form-label">Masuk (Sen-Jum)</label>
                     <input type="time" class="form-control" id="cfg_wday_start" value="10:00">
                  </div>
                  <div class="form-group">
                     <label class="form-label">Pulang (Sen-Jum)</label>
                     <input type="time" class="form-control" id="cfg_wday_end" value="19:00">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Toleransi Keterlambatan (menit)</label>
                  <input type="number" class="form-control" id="cfg_tolerance" value="15">
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px">
                  <div class="form-group">
                    <label class="form-label">Masuk (Sabtu)</label>
                    <input type="time" class="form-control" id="cfg_sat_start" value="09:00">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Pulang (Sabtu)</label>
                    <input type="time" class="form-control" id="cfg_sat_end" value="17:00">
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-top:24px; text-align:right;">
              <button class="btn btn-primary btn-xl btn-neu-3d" onclick="saveConfig()"><i class="bi bi-save-fill"
                  style="margin-right:6px"></i> Simpan Konfigurasi</button>
            </div>
          </div>

          <!-- Bottom Card: Kontak & Komunikasi -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom:20px"><i class="bi bi-chat-dots-fill text-success"
                style="margin-right:8px"></i> Pengaturan Kontak &amp; HC</h3>

            <div class="grid-2-resp">
              <div class="form-group">
                <label class="form-label">Nomor WhatsApp Admin</label>
                <input type="text" class="form-control" id="cfg_wa_admin" placeholder="Contoh: 628123456789">
                <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Gunakan kode negara tanpa simbol +
                  atau spasi.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Email HRD Utama</label>
                <input type="email" class="form-control" id="cfg_email_hrd" placeholder="Contoh: hrd@jefgroup.id">
                <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Email resmi HRD untuk koordinasi
                  data kehadiran.</p>
              </div>
            </div>

            <div style="margin-top:24px; text-align:right;">
              <button class="btn btn-primary btn-xl btn-neu-3d" onclick="saveConfig()"><i class="bi bi-save-fill"
                  style="margin-right:6px"></i> Simpan Kontak</button>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
