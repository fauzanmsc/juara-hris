<?php
$activePage = isset($currentPage) ? $currentPage : 'dashboard';
?>
    <!-- SIDEBAR -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <div class="sidebar-brand" style="display:flex; align-items:center; gap:10px; flex:1;">
          <div class="sidebar-brand-icon">JG</div>
          <div class="sidebar-brand-text">
            <h3>JEF HRIS</h3>
            <p>HC Admin Panel</p>
          </div>
        </div>
        <button class="btn-compact-sidebar" id="btnCompactSidebar" onclick="toggleCompactSidebar()"
          title="Minimize Sidebar"
          style="background:rgba(255,255,255,0.06); border:1px solid var(--border); color:var(--text); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-left:auto; transition:all var(--transition); flex-shrink:0;">
          <i class="bi bi-chevron-left" id="compactIcon"></i>
        </button>
        <button class="btn-close-sidebar" onclick="toggleSidebar()" aria-label="Close Sidebar" style="flex-shrink:0;">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">CORE HUB</div>
        <a class="sidebar-link<?php echo $activePage === 'dashboard' ? ' active' : ''; ?>" href="/admin/dashboard">
          <i class="bi bi-grid-1x2-fill"></i> Dashboard
        </a>

        <div class="nav-section-label">WORKFORCE</div>
        <a class="sidebar-link<?php echo $activePage === 'users' ? ' active' : ''; ?>" href="/admin/users">
          <i class="bi bi-people-fill"></i> Talents
          <span class="nav-badge" id="inactiveTalentsBadge" style="display:none;">0</span>
        </a>
        <a class="sidebar-link<?php echo $activePage === 'approval' ? ' active' : ''; ?>" href="/admin/approval">
          <i class="bi bi-clipboard-check-fill"></i> Approvals
          <span class="nav-badge" id="pendingBadge">0</span>
        </a>
        <a class="sidebar-link<?php echo $activePage === 'attendance' ? ' active' : ''; ?>" href="/admin/attendance">
          <i class="bi bi-clock-history"></i> Attendance
        </a>
        <a class="sidebar-link<?php echo $activePage === 'leave-report' ? ' active' : ''; ?>" href="/admin/leave-report">
          <i class="bi bi-file-earmark-bar-graph-fill"></i> Leaves
        </a>
        <a class="sidebar-link<?php echo $activePage === 'positions' ? ' active' : ''; ?>" href="/admin/positions">
          <i class="bi bi-briefcase-fill"></i> Structure
        </a>
        <a class="sidebar-link<?php echo $activePage === 'tasks' ? ' active' : ''; ?>" href="/admin/tasks">
          <i class="bi bi-list-task"></i> Tasks
        </a>

        <div class="nav-section-label">SYSTEM</div>
        <a class="sidebar-link<?php echo $activePage === 'holidays' ? ' active' : ''; ?>" href="/admin/holidays">
          <i class="bi bi-calendar2-x-fill"></i> Holidays
        </a>
        <a class="sidebar-link<?php echo $activePage === 'config' ? ' active' : ''; ?>" href="/admin/config">
          <i class="bi bi-gear-fill"></i> Settings
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" onclick="logout()">
          <div class="avatar-wrapper" style="position: relative; width: 38px; height: 38px; flex-shrink: 0;">
            <div class="avatar avatar-sm" id="sidebarInitials" style="width: 100%; height: 100%;">HR</div>
            <div class="status-indicator-dot online" id="connectionStatusDot" title="Online Jaringan"
              style="position: absolute; bottom: -2px; right: -2px; width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--bg-surface); box-shadow: 0 0 8px rgba(0,0,0,0.3); z-index: 10; transition: all var(--transition);">
            </div>
          </div>
          <div class="sidebar-user-info">
            <h4 id="sidebarName">—</h4>
            <p>Administrator</p>
          </div>
          <i class="bi bi-box-arrow-right text-danger" style="margin-left:auto"></i>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="admin-main">
