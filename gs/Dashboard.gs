// ============ DASHBOARD ============

function getEmployeeDashboard(params) {
  const { user_id } = params;
  const today = getTodayString();
  const [yearStr, monthStr] = today.split('-');
  const monthStart = `${yearStr}-${monthStr}-01`;

  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const thisMonth = attendance.filter(a =>
    a.user_id === user_id && formatDate(a.date) >= monthStart
  );

  const todayAtt = thisMonth.find(a => formatDate(a.date) === today);
  const hadir = thisMonth.length;
  const terlambat = thisMonth.filter(a => a.status_in === 'Terlambat').length;

  // Recent activities
  const recentAtts = thisMonth.slice(-5).reverse().map(a => ({
    title: a.clock_out_time ? 'Clock In & Out' : 'Clock In',
    desc: a.status_in || '',
    time: formatDate(a.date), // Use actual attendance date as requested by the user
    color: a.status_in === 'Terlambat' ? 'orange' : 'green',
    photo_in_url: a.photo_in_url ? formatImageUrl(a.photo_in_url) : null,
    photo_out_url: a.photo_out_url ? formatImageUrl(a.photo_out_url) : null
  }));

  const user = sheetToObjects(getSheet(SHEET.USERS)).find(u => u.user_id === user_id);

  // Check today's holiday
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));
  const todayHoliday = holidays.find(h => {
    const s = h.start_date ? formatDate(h.start_date) : '';
    const e = h.end_date ? formatDate(h.end_date) : s;
    return s && today >= s && today <= e;
  });

  // Check today's active leave
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const todayLeave = leaves.find(l => {
    if (l.user_id !== user_id) return false;
    const statusStr = String(l.status || '').trim().toLowerCase();
    if (statusStr !== 'approved') return false;
    const s = l.start_date ? formatDate(l.start_date) : '';
    const e = l.end_date ? formatDate(l.end_date) : s;
    return s && e && s <= today && e >= today;
  });

  // Get latest approved leave for notifications
  const approvedLeaves = leaves.filter(l => l.user_id === user_id && l.status === 'Approved');
  const latestApproved = approvedLeaves.length > 0 ? {
    leave_type: approvedLeaves[approvedLeaves.length - 1].leave_type,
    start_date: formatDate(approvedLeaves[approvedLeaves.length - 1].start_date),
    end_date: formatDate(approvedLeaves[approvedLeaves.length - 1].end_date),
    reason: approvedLeaves[approvedLeaves.length - 1].reason || ''
  } : null;

  // Get latest rejected leave for notifications
  const rejectedLeaves = leaves.filter(l => l.user_id === user_id && l.status === 'Rejected');
  const latestRejected = rejectedLeaves.length > 0 ? {
    leave_type: rejectedLeaves[rejectedLeaves.length - 1].leave_type,
    start_date: formatDate(rejectedLeaves[rejectedLeaves.length - 1].start_date),
    end_date: formatDate(rejectedLeaves[rejectedLeaves.length - 1].end_date),
    reason: rejectedLeaves[rejectedLeaves.length - 1].reason || ''
  } : null;

  const quotaSheet = getOrCreateSheet(SHEET.QUOTAS, ['user_id', 'name', 'allowed_leave_quota']);
  const quotas = sheetToObjects(quotaSheet);
  let qRecord = quotas.find(q => String(q.user_id) === String(user_id));
  let allowedQuota = 12;
  if (qRecord) {
    allowedQuota = Number(qRecord.allowed_leave_quota);
  } else {
    quotaSheet.appendRow([user_id, user ? user.name : 'Karyawan', 12]);
  }

  const overallApprovedCuti = leaves.filter(l => 
    String(l.user_id) === String(user_id) && 
    l.status === 'Approved' && 
    l.type === 'Cuti'
  ).reduce((sum, l) => {
    const start = new Date(l.start_date);
    const end = new Date(l.end_date);
    const days = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
    return sum + (isNaN(days) ? 0 : days);
  }, 0);

  const remainingQuota = allowedQuota - overallApprovedCuti;

  // Calculate Absen (Gak Hadir)
  let absenCount = 0;
  const todayDateObj = new Date(today);
  const startObj = new Date(monthStart);
  
  for (let d = new Date(startObj); d < todayDateObj; d.setDate(d.getDate() + 1)) {
    const dStr = formatDate(d);
    const isSunday = d.getDay() === 0;
    
    const isHol = holidays.find(h => {
      const s = h.start_date ? formatDate(h.start_date) : '';
      const e = h.end_date ? formatDate(h.end_date) : s;
      return s && dStr >= s && dStr <= e;
    });

    if (isSunday || isHol) {
      continue;
    }

    const hasAtt = thisMonth.some(a => formatDate(a.date) === dStr);
    const hasLeave = leaves.some(l => {
      if (l.user_id !== user_id) return false;
      const statusStr = String(l.status || '').trim().toLowerCase();
      if (statusStr !== 'approved') return false;
      const s = l.start_date ? formatDate(l.start_date) : '';
      const e = l.end_date ? formatDate(l.end_date) : s;
      return s && e && dStr >= s && dStr <= e;
    });

    if (!hasAtt && !hasLeave) {
       absenCount++;
    }
  }

  return {
    success: true,
    profile_pic_url: user ? formatImageUrl(user.profile_pic_url || '') : '',
    division: user ? (user.division || 'Umum') : 'Umum',
    stats: { hadir, terlambat, sisa_cuti: remainingQuota >= 0 ? remainingQuota : 0, absen: absenCount },
    today_in: todayAtt ? formatTimeVal(todayAtt.clock_in_time) : null,
    today_out: todayAtt ? formatTimeVal(todayAtt.clock_out_time) : null,
    status_in: todayAtt ? todayAtt.status_in : null,
    status_out: todayAtt ? todayAtt.status_out : null,
    activities: recentAtts,
    today_holiday: todayHoliday ? todayHoliday.description : null,
    today_leave: todayLeave ? todayLeave.leave_type + (todayLeave.reason ? ' - ' + todayLeave.reason : '') : null,
    latest_approved_leave: latestApproved,
    latest_rejected_leave: latestRejected
  };
}

function getAdminDashboard(params) {
  const { user_id } = params;
  const today = getTodayString();
  const users = sheetToObjects(getSheet(SHEET.USERS)).filter(u => u.status === 'Active');
  const admin = users.find(u => u.user_id === user_id);
  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));

  // Filter attendance: only Employee role, today only, deduplicated per employee
  const employeeUserIds = new Set(users.filter(u => u.role === 'Employee').map(u => u.user_id));
  const seenToday = new Set();
  const todayAtt = attendance.filter(a => {
    if (formatDate(a.date) !== today) return false;
    const uid = a.user_id;
    if (!employeeUserIds.has(uid)) return false;
    // Deduplicate: only count first record per employee
    if (seenToday.has(uid)) return false;
    seenToday.add(uid);
    return true;
  });
  const todayLeaves = leaves.filter(l => {
    const statusStr = String(l.status || '').trim().toLowerCase();
    if (statusStr !== 'approved') return false;
    const s = l.start_date ? formatDate(l.start_date) : '';
    const e = l.end_date ? formatDate(l.end_date) : s;
    return s && e && s <= today && e >= today;
  });

  const hadirUserIds = todayAtt.map(a => a.user_id);
  const cutiUserIds = todayLeaves.map(l => l.user_id);
  
  const employeeUsers = users.filter(u => u.role === 'Employee');
  
  // Check today's holiday and Sunday
  const isSunday = new Date().getDay() === 0;
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));
  const todayHoliday = holidays.find(h => {
    const s = h.start_date ? formatDate(h.start_date) : '';
    const e = h.end_date ? formatDate(h.end_date) : s;
    return s && today >= s && today <= e;
  });
  
  const isHoliday = isSunday || todayHoliday;
  
  let absenUsers = employeeUsers.filter(u =>
    !hadirUserIds.includes(u.user_id) && !cutiUserIds.includes(u.user_id)
  ).map(u => ({
    ...u,
    profile_pic_url: formatImageUrl(u.profile_pic_url || '')
  }));
  
  if (isHoliday) {
    absenUsers = [];
  }
  
  const absenCount = absenUsers.length;

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  // Count late using status_in directly from database (100% data consistency)
  const lateCount = todayAtt.filter(a => String(a.status_in || '').trim() === 'Terlambat').length;

  // Live log with user names (all users including admin)
  const allTodayAtt = attendance.filter(a => formatDate(a.date) === today);
  const liveLog = allTodayAtt.map(a => {
    const user = users.find(u => u.user_id === a.user_id);
    return {
      name: user ? user.name : 'Unknown',
      position: user ? user.position : '',
      initials: user ? user.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase() : 'XX',
      clock_in: formatTimeVal(a.clock_in_time),
      clock_out: formatTimeVal(a.clock_out_time) || null,
      distance: a.distance_in_meters || a.distance_meters || '',
      status_in: a.status_in,
      photo_in: a.photo_in_url || '',
      profile_pic: user ? formatImageUrl(user.profile_pic_url || '') : ''
    };
  }).reverse();

  const cutiUsers = todayLeaves.map(l => {
    const user = users.find(u => String(u.user_id) === String(l.user_id));
    return {
      name: user ? user.name : 'Unknown',
      position: user ? user.position : '',
      profile_pic_url: user ? formatImageUrl(user.profile_pic_url || '') : '',
      type: l.leave_type || l.type || 'Cuti'
    };
  });

  return {
    success: true,
    profile_pic_url: admin ? formatImageUrl(admin.profile_pic_url || '') : '',
    stats: {
      hadir: todayAtt.length,
      total: employeeUsers.length,
      terlambat: lateCount,
      cuti: todayLeaves.length,
      absen: absenCount
    },
    pending_count: pendingCount,
    live_log: liveLog,
    belum_absen_users: absenUsers,
    cuti_users: cutiUsers,
    is_holiday: isHoliday ? true : false,
    holiday_name: todayHoliday ? todayHoliday.description : (isSunday ? 'Hari Minggu (Libur)' : null)
  };
}


