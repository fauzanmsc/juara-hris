<?php
$currentPage = 'leave-report';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- LEAVE REPORT PAGE -->
        <section class="page-section active fade-in" id="page-leave-report">
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Laporan &amp; Jatah Cuti</h3>
                <p class="card-subtitle">Rekap jatah cuti, sakit, dan izin karyawan secara dinamis per periode</p>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="loadLeaveReport()"><i class="bi bi-arrow-clockwise"></i>
                Refresh</button>
            </div>

            <!-- Periode Filter Row -->
            <div class="filter-row" style="margin-bottom: 20px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:12px; font-weight:600; color:var(--text-muted)">Periode:</span>
                <input type="date" class="form-control" id="repFilterStart" style="width:160px">
                <span style="font-size:12px; font-weight:600; color:var(--text-muted)">s.d</span>
                <input type="date" class="form-control" id="repFilterEnd" style="width:160px">
              </div>
              <button class="btn btn-primary" style="padding: 10px 20px; border-radius: var(--radius-md);"
                onclick="loadLeaveReport()">
                <i class="bi bi-filter"></i> Terapkan Filter
              </button>
            </div>

            <div class="table-wrap">
              <table>
                <thead id="leaveReportThead">
                  <tr>
                    <th style="width: 70px; text-align: center;">Foto</th>
                    <th style="cursor:pointer;" onclick="sortLeaveReportTable('name')" data-sort="name">Karyawan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortLeaveReportTable('position')" data-sort="position">Jabatan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer; text-align: center;" onclick="sortLeaveReportTable('allowed_leave_quota')" data-sort="allowed_leave_quota">Jatah Cuti Tahunan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer; text-align: center;" onclick="sortLeaveReportTable('remaining_leave_quota')" data-sort="remaining_leave_quota">Sisa Cuti <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer; text-align: center;" onclick="sortLeaveReportTable('sick_count')" data-sort="sick_count">Total Sakit (Periode) <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer; text-align: center;" onclick="sortLeaveReportTable('permit_count')" data-sort="permit_count">Total Izin (Periode) <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer; text-align: center;" onclick="sortLeaveReportTable('cuti_count')" data-sort="cuti_count">Total Cuti (Periode) <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="text-align: center;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="leaveReportBody">
                  <tr>
                    <td colspan="9" style="text-align:center;padding:30px">Memuat laporan...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
