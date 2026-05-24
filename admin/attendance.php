<?php
$currentPage = 'attendance';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- ATTENDANCE PAGE -->
        <section class="page-section active fade-in" id="page-attendance">
          <!-- ANALYTICS CARDS (Top 3 Absent & Sick/Permit) -->
          <div id="attendanceAnalyticsContainer" class="analytics-row" style="margin-bottom: 24px;"></div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Riwayat Absensi</h3>
                <p class="card-subtitle">Log kehadiran seluruh karyawan</p>
              </div>
              <button class="btn btn-sm btn-success" onclick="exportCSV()"><i class="bi bi-file-earmark-excel-fill"></i>
                Export CSV</button>
            </div>

            <div class="filter-row">
              <input type="date" class="form-control" id="attFilterStart">
              <input type="date" class="form-control" id="attFilterEnd">
              <input type="text" class="form-control" id="attFilterName" placeholder="Nama karyawan..." style="flex:1">
              <select class="form-control" id="attFilterStatus">
                <option value="">Semua Status</option>
                <option value="Tepat Waktu">Tepat Waktu</option>
                <option value="Terlambat">Terlambat</option>
              </select>
              <button class="btn btn-primary" style="padding: 10px 20px; border-radius: var(--radius-md);"
                onclick="loadAttendance()"><i class="bi bi-search"></i> Cari</button>
            </div>

            <div class="table-wrap">
              <table>
                <thead id="attendanceThead">
                  <tr>
                    <th style="cursor:pointer;" onclick="sortAttendanceTable('name')" data-sort="name">Karyawan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortAttendanceTable('date')" data-sort="date">Tanggal <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortAttendanceTable('clock_in')" data-sort="clock_in">Masuk <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortAttendanceTable('clock_out')" data-sort="clock_out">Pulang <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortAttendanceTable('distance')" data-sort="distance">Jarak <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortAttendanceTable('status_in')" data-sort="status_in">Status <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody id="attBody">
                  <tr>
                    <td colspan="7" style="text-align:center;padding:30px">Gunakan filter untuk mencari data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
