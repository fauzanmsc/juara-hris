<?php
$currentPage = 'users';
include 'layout/header.php';
include 'layout/sidebar.php';
include 'layout/topbar.php';
?>

        <!-- USERS PAGE -->
        <section class="page-section active fade-in" id="page-users">
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Data Karyawan</h3>
                <p class="card-subtitle">Kelola akun dan akses karyawan</p>
              </div>
              <button class="btn btn-sm btn-primary" onclick="openAddUser()"><i class="bi bi-person-plus-fill"></i>
                Tambah Karyawan</button>
            </div>

            <div class="filter-row">
              <div class="input-group" style="flex:1; max-width:300px;">
                <i class="bi bi-search input-icon"></i>
                <input type="text" class="form-control" id="userSearch" placeholder="Cari nama / email..."
                  oninput="filterUsers()">
              </div>
              <div style="display:flex; gap:10px;">
                <select class="form-control" id="userStatusFilter" onchange="filterUsers()" style="max-width:160px;">
                  <option value="">Semua Status</option>
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Nonaktif</option>
                  <option value="Pending">Menunggu Persetujuan</option>
                </select>
                <select class="form-control" id="userRoleFilter" onchange="filterUsers()" style="max-width:140px;">
                  <option value="">Semua Role</option>
                  <option value="Employee">Employee Only</option>
                  <option value="Admin">Admin Only</option>
                </select>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead id="usersThead">
                  <tr>
                    <th style="cursor:pointer;" onclick="sortUsersTable('name')" data-sort="name">Karyawan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortUsersTable('email')" data-sort="email">Email <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortUsersTable('position')" data-sort="position">Jabatan <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="cursor:pointer;" onclick="sortUsersTable('status')" data-sort="status">Status <i class="bi bi-arrow-down-up bi-sort-icon" style="font-size:10px; margin-left:4px; opacity:0.35;"></i></th>
                    <th style="text-align:center;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="userTableBody">
                  <tr>
                    <td colspan="5" style="text-align:center;padding:30px">Memuat data karyawan...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

<?php include 'layout/footer.php'; ?>
