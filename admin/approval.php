<?php
$currentPage = 'approval';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- APPROVAL PAGE -->
        <section class="page-section active fade-in" id="page-approval">
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Approval Pengajuan</h3>
                <p class="card-subtitle">Persetujuan Cuti, Sakit, dan Izin</p>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="loadApprovals()"><i class="bi bi-arrow-clockwise"></i>
                Refresh</button>
            </div>

            <div class="table-wrap" style="max-height: 380px; overflow-y: auto;">
              <table>
                <thead id="approvalThead">
                  <tr>
                    <th style="cursor:pointer;" onclick="sortApprovalsTable('user_name')" data-sort="user_name">Karyawan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortApprovalsTable('type')" data-sort="type">Jenis <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortApprovalsTable('start_date')" data-sort="start_date">Dari Tanggal <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortApprovalsTable('end_date')" data-sort="end_date">Hingga Tanggal <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th>Catatan</th>
                    <th>Dokumen</th>
                    <th style="cursor:pointer;" onclick="sortApprovalsTable('status')" data-sort="status">Status <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th>Keputusan</th>
                    <th>Hapus</th>
                  </tr>
                </thead>
                <tbody id="approvalBody">
                  <tr>
                    <td colspan="9" style="text-align:center;padding:30px">Memuat pengajuan...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
