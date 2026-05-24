<?php
$currentPage = 'tasks';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- TASKS PAGE -->
        <section class="page-section active fade-in" id="page-tasks">

          <!-- Task Analytics Data Insight Banner -->
          <div class="insight-banner-wrapper fade-in">
            <div class="insight-metric-card">
              <div>
                <div class="insight-metric-value text-primary" id="taskStatTotal">0</div>
                <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-top:2px;">Total Laporan
                  Tugas</div>
              </div>
              <div class="stat-icon stat-icon-primary" style="margin:0;"><i class="bi bi-journal-text"></i></div>
            </div>

            <div class="insight-metric-card">
              <div>
                <div class="insight-metric-value text-success" id="taskStatCompleted">0</div>
                <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-top:2px;">Tugas Selesai
                </div>
              </div>
              <div class="stat-icon stat-icon-success" style="margin:0;"><i class="bi bi-check-circle-fill"></i></div>
            </div>

            <div class="insight-metric-card">
              <div>
                <div class="insight-metric-value text-warn" id="taskStatPending">0</div>
                <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-top:2px;">Pending Follow-up
                </div>
              </div>
              <div class="stat-icon stat-icon-warn" style="margin:0;"><i class="bi bi-clock-fill"></i></div>
            </div>

            <div class="insight-metric-card">
              <div>
                <div class="insight-metric-value text-primary" id="taskStatAvgScore" style="color:#F59E0B !important;">0
                </div>
                <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-top:2px;">Avg Skor
                  Produktivitas</div>
              </div>
              <div class="stat-icon stat-icon-primary"
                style="background:rgba(245,158,11,0.15); color:#F59E0B; margin:0;"><i class="bi bi-star-fill"></i></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Manajemen Tugas &amp; Produktivitas</h3>
                <p class="card-subtitle">Kelola daily task, status pengerjaan, skor produktivitas, dan dokumen pelaporan
                  karyawan</p>
              </div>
              <button class="btn btn-sm btn-primary" onclick="openAddTaskModal()"><i class="bi bi-plus-circle-fill"></i>
                Tambah Tugas</button>
            </div>

            <!-- Filters -->
            <div class="filter-row">
              <input type="date" class="form-control" id="taskFilterStart" style="max-width:140px;">
              <input type="date" class="form-control" id="taskFilterEnd" style="max-width:140px;">
              <input type="text" class="form-control" id="taskFilterName" placeholder="Nama karyawan..."
                style="flex:1;">
              <select class="form-control" id="taskFilterCategory" style="max-width:140px;">
                <option value="">Semua Kategori</option>
                <option value="Development">Development</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Administrative">Administrative</option>
                <option value="Sales">Sales</option>
                <option value="Other">Lain-lain</option>
              </select>
              <select class="form-control" id="taskFilterDivision" style="max-width:140px;">
                <option value="">Semua Divisi</option>
              </select>
              <select class="form-control" id="taskFilterStatus" style="max-width:140px;">
                <option value="">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <button class="btn btn-primary" onclick="loadAdminTasks()"><i class="bi bi-search"></i> Cari</button>
            </div>

            <!-- Simplified Table for High-Fidelity Retina & Mobile Layouts -->
            <div class="table-wrap">
              <table class="table-modern">
                <thead id="tasksThead">
                  <tr>
                    <th style="cursor:pointer;" onclick="sortTasksTable('name')" data-sort="name">Karyawan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortTasksTable('date')" data-sort="date">Tanggal <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortTasksTable('task_name')" data-sort="task_name">Nama Tugas <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer; text-align:center;" onclick="sortTasksTable('status')" data-sort="status">Status <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer; text-align:center;" onclick="sortTasksTable('score')" data-sort="score">Skor Produktivitas <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="text-align:center;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="taskAdminBody">
                  <tr>
                    <td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Memuat data tugas...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
