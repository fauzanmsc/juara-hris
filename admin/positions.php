<?php
$currentPage = 'positions';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- POSITIONS PAGE -->
        <section class="page-section active fade-in" id="page-positions">
          <div class="positions-grid">
            <!-- Form Kelola Jabatan -->
            <div class="card">
              <h3 class="card-title" style="margin-bottom:16px"><i class="bi bi-briefcase-fill text-primary"
                  style="margin-right:8px"></i> Kelola Jabatan</h3>
              <div style="display:flex; flex-direction:column; gap:14px;">
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label">Nama Jabatan (Position)</label>
                  <input type="text" class="form-control" id="pos_name" placeholder="Contoh: Senior Developer">
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label">Divisi (Division)</label>
                  <select class="form-control" id="pos_division" style="border-radius:12px; font-weight:700;">
                    <option value="" disabled selected>Pilih Divisi...</option>
                  </select>
                </div>
                <button class="btn btn-primary btn-neu-3d"
                  style="height:40px; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px;"
                  onclick="addPositionAdmin()">
                  <i class="bi bi-plus-circle-fill"></i> Simpan Jabatan
                </button>
              </div>
            </div>

            <!-- Form Kelola Divisi -->
            <div class="card">
              <h3 class="card-title" style="margin-bottom:16px"><i class="bi bi-diagram-3-fill text-success"
                  style="margin-right:8px"></i> Kelola Divisi</h3>
              <div style="display:flex; flex-direction:column; gap:14px;">
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label">Nama Divisi (Division Name)</label>
                  <input type="text" class="form-control" id="div_name" placeholder="Contoh: Marketing">
                </div>
                <button class="btn btn-success btn-neu-3d"
                  style="height:40px; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:48px;"
                  onclick="addDivisionAdmin()">
                  <i class="bi bi-plus-circle-fill"></i> Simpan Divisi
                </button>
              </div>
            </div>

            <!-- Bento Chart Ringkasan Divisi -->
            <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <h3 class="card-title" style="margin-bottom:8px"><i class="bi bi-pie-chart-fill text-warning"
                    style="margin-right:8px"></i> Ringkasan Divisi &amp; Posisi</h3>
                <p style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">Visualisasi jumlah jabatan per
                  divisi</p>
              </div>
              <div id="divisionSummaryChart"
                style="display:flex; flex-direction:column; gap:10px; flex:1; justify-content:center;">
                <div style="text-align:center; color:var(--text-muted)">Memuat data chart...</div>
              </div>
            </div>
          </div>

          <div class="grid-2-resp">
            <!-- Table List of Positions -->
            <div class="card">
              <div
                style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px;">
                <h3 class="card-title" style="margin:0;"><i class="bi bi-list-task text-primary"
                    style="margin-right:8px"></i> Daftar Jabatan</h3>
                <div style="display:flex; align-items:center; gap:8px;">
                  <label class="form-label"
                    style="margin:0; font-size:12px; font-weight:700; white-space:nowrap;">Filter Divisi:</label>
                  <select id="posDivisionFilter" class="form-control"
                    style="width:140px; height:32px; border-radius:12px; font-size:12px; padding:0 8px; font-weight:700;"
                    onchange="filterPositionsTable(this.value)">
                    <option value="">Semua Divisi</option>
                  </select>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table-modern table-compact" style="width:100%;">
                  <thead>
                    <tr>
                      <th style="text-align:left; cursor:pointer;" onclick="sortPositionsTable('position')">Nama Jabatan
                        <i class="bi bi-arrow-down-up" style="font-size:10px; margin-left:4px;"></i>
                      </th>
                      <th style="text-align:left; cursor:pointer;" onclick="sortPositionsTable('division')">Divisi <i
                          class="bi bi-arrow-down-up" style="font-size:10px; margin-left:4px;"></i></th>
                      <th style="text-align:center; width:120px;">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="positionsTableBody">
                    <tr>
                      <td colspan="3" style="text-align:center; padding:30px; color:var(--text-muted)">Memuat daftar
                        jabatan...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Table List of Divisions -->
            <div class="card">
              <h3 class="card-title" style="margin-bottom:16px;"><i class="bi bi-list-stars text-success"
                  style="margin-right:8px"></i> Daftar Divisi</h3>
              <div class="table-responsive">
                <table class="table-modern table-compact" style="width:100%;">
                  <thead>
                    <tr>
                      <th style="text-align:left; cursor:pointer;" onclick="sortDivisionsTable()">Nama Divisi <i
                          class="bi bi-arrow-down-up" style="font-size:10px; margin-left:4px;"></i></th>
                      <th style="text-align:center; width:100px;">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="divisionsTableBody">
                    <tr>
                      <td colspan="2" style="text-align:center; padding:30px; color:var(--text-muted)">Memuat daftar
                        divisi...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
